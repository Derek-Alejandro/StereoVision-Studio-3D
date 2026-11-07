// Completa los metadatos Duration de WebM grabado con MediaRecorder, que suele
// producir archivos sin duración conocida (difíciles de adelantar/retroceder).
// No transcodifica: inserta un elemento EBML en Info si el Segment es desconocido
// y no existe SeekHead que dependa de desplazamientos absolutos.
const INDEX={info:[0x15,0x49,0xa9,0x66],segment:[0x18,0x53,0x80,0x67],cluster:[0x1f,0x43,0xb6,0x75],seek:[0x11,0x4d,0x9b,0x74]};
function locate(bytes,pattern,start=0){
  scan:for(let i=start;i<=bytes.length-pattern.length;i++){
    for(let j=0;j<pattern.length;j++)if(bytes[i+j]!==pattern[j])continue scan;
    return i;
  }
  return -1;
}
function readSize(bytes,offset){
  const head=bytes[offset];if(!head)return null;
  let len=1,mask=0x80;
  while(len<=8 && !(head&mask)){mask>>=1;len++;}
  if(len>8||offset+len>bytes.length)return null;
  let value=BigInt(head&(mask-1));
  for(let j=1;j<len;j++)value=value*256n+BigInt(bytes[offset+j]);
  const max=(1n<<BigInt(len*7))-1n;
  return {len,value,unknown:value===max};
}
function writeSize(bytes,offset,len,value){
  let v=BigInt(value);
  for(let j=len-1;j>=0;j--){bytes[offset+j]=Number(v&255n);v>>=8n;}
  bytes[offset]|=(1<<(8-len));
}
export async function addWebmDuration(blob,durationSeconds){
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0)return blob;
  // Solo se leen los primeros 128 KiB. Los datos del video no se copian.
  const bytes=new Uint8Array(await blob.slice(0,Math.min(blob.size,131072)).arrayBuffer());
  const segment=locate(bytes,INDEX.segment);
  if(segment<0)return blob;
  const segmentSize=readSize(bytes,segment+4);
  if(!segmentSize?.unknown)return blob;
  const info=locate(bytes,INDEX.info,segment+4+segmentSize.len);
  const cluster=locate(bytes,INDEX.cluster,segment+4+segmentSize.len);
  if(info<0||cluster<0||info>cluster)return blob;
  if(locate(bytes,INDEX.seek,segment+4+segmentSize.len)>=0 && locate(bytes,INDEX.seek)<cluster)return blob;
  const sizeOffset=info+4, size=readSize(bytes,sizeOffset);
  if(!size||size.unknown||size.value>BigInt(Number.MAX_SAFE_INTEGER))return blob;
  const end=sizeOffset+size.len+Number(size.value);
  if(end>bytes.length||end>cluster)return blob;
  const durID=[0x44,0x89];
  if(locate(bytes.slice(sizeOffset+size.len,end),durID)>=0)return blob;
  const newSize=size.value+11n;
  if(newSize>=(1n<<BigInt(size.len*7))-1n)return blob;
  const prefix=bytes.slice(0,end);
  writeSize(prefix,sizeOffset,size.len,newSize);
  const appended=new Uint8Array(11);
  appended.set([0x44,0x89,0x88],0);
  // TimecodeScale habitual de MediaRecorder = 1 ms. Detecta escala si cambia.
  let scale=1_000_000;
  const scaleId=locate(bytes,[0x2a,0xd7,0xb1],sizeOffset+size.len);
  if(scaleId>=0 && scaleId<end){
    const sz=readSize(bytes,scaleId+3);
    if(sz&&!sz.unknown&&sz.value>0n&&sz.value<=8n){
      const start=scaleId+3+sz.len;
      let n=0;
      for(let j=0;j<Number(sz.value);j++)n=n*256+bytes[start+j];
      if(n>0&&Number.isFinite(n))scale=n;
    }
  }
  const durationUnits=durationSeconds*1e9/scale;
  new DataView(appended.buffer).setFloat64(3,durationUnits,false);
  return new Blob([prefix,appended,blob.slice(end)],{type:blob.type});
}
