# StereoVision Studio 3D — v0.4

**Instituto Tecnológico de Pachuca**  
**Ingeniería en Tecnologías de la Información y Comunicaciones**  
**Examen de segunda unidad: Estereoscopía**

**Autor:** Derek Alejandro Vargas Meneses  
**Número de control:** 22200792  
**Año:** 2026

## ¿Qué resuelve el proyecto?

Editor estereoscópico **100 % local** para comparar, ajustar y presentar contenido binocular sin modificar los archivos originales. El módulo anaglifo permite ver el resultado con **lentes rojo-cian**; el módulo SBS distribuye una perspectiva a cada ojo, adecuada para una posterior presentación con visores VR para teléfono. No convierte fotografías planas en profundidad 3D artificial.

## Modalidades operativas

| Módulo | Entrada | Funciones |
|---|---|---|
| **Anaglifo rojo-cian** | Anaglifo preparado **o** dos fotografías independientes (izquierda + derecha) | Composición real: rojo = ojo izquierdo; verde/azul = ojo derecho. Escala 50–400 %, brillo, contraste, ajuste horizontal/vertical, desplazamiento por ojo, arrastre táctil, bloqueo, vista limpia, exportación PNG/JPG, compartir archivos y perfiles. |
| **Imagen SBS** | Imagen SBS preparada **o** dos fotografías independientes | Recorte izquierdo/derecho correcto; escala 50–400 %, desplazamiento horizontal y vertical en píxeles CSS, intercambio real de ojos, alineación individual, arrastre táctil, bloqueo, vista limpia, PNG/JPG, compartir archivos y perfiles. |
| **Video SBS** | MP4 SBS compatible con navegador | **Un solo video**, compuesto en dos regiones; reproducir/pausar, buscar, ±10 s, volumen, escala, desplazamiento horizontal, intercambio de ojos, restablecer, guardar calibración y exportar el video con los ajustes aplicados (MP4/WebM según soporte del navegador). |

> El modo VR inmersivo (Cardboard y pantalla completa) se trabajará en una etapa posterior. Los videos se exportan localmente en **tiempo real**, sin servidores: según el navegador el resultado es WebM (habitual en Chrome/Android) o MP4 (si el codificador es compatible, por ejemplo Safari actualizado). **No se garantiza MP4 en todos los dispositivos.**

## Uso básico

1. Selecciona **Anaglifo**, **Imagen SBS** o **Video SBS**.
2. En imágenes elige **Una imagen preparada** o **Izquierda + derecha**. En el segundo caso selecciona *por separado* el archivo de cada ojo; al importar el segundo se construye automáticamente la composición.
3. Ajusta **Zoom** y la **Calibración estereoscópica**. Los deslizadores horizontales/verticales se expresan en **píxeles CSS** relativos al visor; la escala inicia al **100 %**, los desplazamientos en **0 px** e **Intercambiar ojos** desactivado.
4. Elige **Mover con el dedo: Ambos / Izquierdo / Derecho**. Un dedo mueve la selección, dos dedos cambian el zoom conjunto. Si necesitas precisión, abre **Ajuste fino de cada ojo**.
5. Pulsa **Bloquear** para evitar movimientos accidentales y **Vista limpia** para inspeccionar sin paneles; para desbloquear vuelve a la vista del Studio.
6. Para imágenes, escoge **PNG** (sin pérdida) o **JPG** (más ligero) y pulsa **Guardar imagen**. El archivo conserva la composición, recortes, alineación, zoom, brillo/contraste y márgenes visibles; el original no cambia. Si el móvil admite Web Share, aparece **Compartir** después de guardar.
7. Si te gusta un ajuste, introduce un nombre en **Mis ajustes guardados → Guardar**. Posteriormente selecciónalo y pulsa **Aplicar**; también puedes **Eliminar** perfiles. Se conservan como máximo 12 ajustes por módulo en `localStorage`, **solo valores numéricos/booleanos, nunca archivos**.
8. En **Video SBS**, ajusta escala, separación e intercambio de ojos y pulsa **Exportar video calibrado**. El Studio reproducirá el MP4 desde el inicio mientras graba el render SBS. Mantén la pestaña abierta. Puedes ver el progreso, **Cancelar** y después **Descargar video WEBM/MP4** o **Compartir / Guardar en móvil** si está disponible.
9. **Incluir audio** está activado inicialmente. Si el navegador no admite la captura de audio, puedes desmarcarlo para exportar solo video. No se cambia el MP4 original ni se conserva una copia en el servidor.
10. Pulsa **Restablecer** para regresar a los valores iniciales. Una nueva importación siempre comienza con ajustes predeterminados: los perfiles solo se aplican manualmente.

### Detalles estereoscópicos

- Un par de dos fotografías **debe** contener perspectivas diferentes tomadas desde posiciones ligeramente distintas. El programa no comprueba automáticamente que la disparidad original sea auténtica.
- **Anaglifo preparado:** se separan los componentes rojos y cian del archivo para permitir desplazar visualmente los canales. No es posible recuperar de ese archivo por separado las fotografías a color completas.
- **Anaglifo con par:** la composición se hace en pantalla a partir de cada imagen, igual que la mezcla por canales utilizada en editores estereoscópicos.
- **SBS preparado:** se supone SBS de ancho completo con el ojo izquierdo a la izquierda y el derecho a la derecha. No se admiten automáticamente disposiciones Over/Under ni formatos MPO.
- **SBS con par:** se dibujan las dos imágenes sin deformarlas; cuando sus proporciones no coinciden se incorporan márgenes en vez de estirarlas.
- **Desplazamiento horizontal**: cambia el ajuste relativo entre ambos ojos, sumando la mitad del valor a la vista izquierda y restando la mitad a la derecha. **Alineación vertical** aplica lo mismo en Y. Los cuatro controles finos permiten intervenir en cada ojo por separado.
- **Intercambiar ojos** modifica los recursos o recortes realmente renderizados en cada región.
- La calibración digital no altera la IPD física de las gafas. Detén cualquier prueba que provoque mareos, fatiga o visión doble persistente.

## Ejecución local

Desde la carpeta raíz que contiene `index.html`:

```powershell
python -m http.server 5500
```

Abre `http://localhost:5500` en el navegador. **No utilizar `file://`** por los módulos JavaScript `import/export`. Para probarlo desde el teléfono, publicar mediante **GitHub Pages HTTPS**. Las rutas son relativas y no hay servidor backend, cuentas ni claves.

## Arquitectura modular

```text
StereoVision-Studio-3D/
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   ├── styles.css                 # Diseño minimalista
│   │   └── responsive.css             # Adaptación táctil móvil
│   ├── img/
│   │   ├── favicon.svg               # Favicon vectorial principal
│   │   ├── favicon.ico               # Compatibilidad de pestañas
│   │   ├── favicon-32.png
│   │   ├── icon-192.png               # También usado en el encabezado
│   │   ├── icon-512.png
│   │   └── apple-touch-icon.png       # Icono en dispositivo Apple
│   ├── media/
│   └── js/
│       ├── main.js                    # Estado, eventos, cambios de modo
│       ├── utils/constants.js         # Definición de módulos
│       └── modules/
│           ├── fileManager.js         # Importación, validación, pares y limpieza
│           ├── calibration.js         # Defaults, límites y normalización
│           ├── presetStore.js         # Ajustes locales por módulo
│           ├── canvasUtils.js         # Dibujo contenido sin deformación
│           ├── anaglyph.js            # Composición rojo/cian por canales
│           ├── sbsImage.js            # Vista por ojo (compuesta o par)
│           ├── imageEditor.js         # Gestos, bloqueo, PNG/JPG, canvas
│           ├── sbsVideo.js            # Composición de fotogramas SBS
│           ├── videoEditor.js          # Reproducción y Canvas de video
│           ├── videoExporter.js        # MediaRecorder, mezcla y progreso
│           ├── webmDuration.js         # Duración EBML para WebM exportado
│           └── ui.js                  # Render de controles/estado
└── docs/
    ├── pruebas-etapa1.md
    ├── pruebas-etapa2.md
    ├── pruebas-v03.md
    └── pruebas-v04.md
```

## Validación, privacidad y límites

- JPG/JPEG, PNG y WebP se comprueban por extensión, firma de archivo y decodificación; los MP4 también se comprueban por compatibilidad de navegador y metadatos.
- Al sustituir contenido, se abortan cargas previas, se detienen videos y se revocan las URL locales. No hay dos archivos *activos* independientes: un **par** constituye una sola composición.
- Los archivos locales **no se suben** a la red ni se guardan en la nube. `localStorage` solo almacena ajustes nombrados, que pueden dejar de estar disponibles en modo privado o si se borran los datos del sitio.
- La exportación de video depende de **MediaRecorder + Canvas.captureStream + decodificación del MP4 de origen**. Chrome/Edge suelen generar WebM; Safari puede generar MP4. Algunos navegadores móviles no admiten la función. La aplicación informa claramente si no es posible.
- La salida de video se graba **a velocidad de reproducción**: un MP4 de 3 minutos tarda al menos unos 3 minutos. Necesita CPU, memoria, espacio local y mantener la pestaña activa. Para videos largos o 4K, usar un equipo más potente o reducir previamente el archivo.
- La resolución de video exportado conserva la proporción SBS del original, pero está limitada por memoria (aproximadamente 1920 px de ancho en móvil, hasta 3840 px en escritorio). Las diferencias de márgenes o encuadre dependen de la relación de aspecto del visor.
- Los perfiles se guardan localmente por módulo; no son lo mismo que exportar el archivo.
- No se corrige automáticamente la geometría de las fotografías, ni se crea profundidad 3D a partir de una única imagen 2D.
- Compatible con GitHub Pages por HTTP(S), sin rutas absolutas ni dependencias externas. Los tests reales de gafas VR y Safari/Chrome móvil físico deberán documentarse en la evaluación.

## Evidencias y conclusiones

Documentar capturas de los tres módulos, restauración, bloqueo, ajustes por ojo, exportación PNG/JPG, error controlado, perfiles locales, reproducción y exportación MP4/WebM y posteriormente VR móvil. Las verificaciones de esta versión están en `docs/pruebas-v04.md`. Registrar incidencias encontradas con el teléfono físico usado en la evaluación.

### Publicación y favicon

Todos los iconos se incluyen en `assets/img/`. `index.html` ya apunta a `favicon.svg`, `favicon.ico`, `favicon-32.png` y `apple-touch-icon.png` mediante rutas relativas; no hace falta editar las etiquetas al publicar el sitio HTTPS en GitHub Pages. Si el navegador conserva el icono anterior en caché, fuerza la recarga o abre una pestaña nueva.

**Conclusión provisional:** se implementó una estructura modular de procesamiento y calibración estereoscópica que permite ajustar visualmente perspectivas auténticas de imágenes anaglifo y SBS conservando los archivos originales. Falta concluir y comprobar la experiencia VR en dispositivos físicos.
