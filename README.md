# StereoVision Studio 3D — v0.3

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
| **Anaglifo rojo-cian** | Anaglifo preparado **o** dos fotografías independientes (izquierda + derecha) | Composición real: rojo = ojo izquierdo; verde/azul = ojo derecho. Escala 50–400 %, brillo, contraste, ajuste horizontal/vertical, desplazamiento por ojo, arrastre táctil, bloqueo, vista limpia, exportación PNG y perfiles. |
| **Imagen SBS** | Imagen SBS preparada **o** dos fotografías independientes | Recorte izquierdo/derecho correcto; escala 50–400 %, desplazamiento horizontal y vertical en píxeles CSS, intercambio real de ojos, alineación individual, arrastre táctil, bloqueo, vista limpia, PNG y perfiles. |
| **Video SBS** | MP4 SBS compatible con navegador | **Un solo video**, compuesto en dos regiones; reproducir/pausar, buscar, ±10 s, volumen, escala, desplazamiento horizontal, intercambio de ojos, restablecer y guardar calibración. |

> El modo VR inmersivo (Cardboard y pantalla completa) y la edición/exportación de MP4 se trabajarán en etapas posteriores. La opción de video utiliza Canvas2D y HTML5 Video; requiere un códec MP4 compatible con el dispositivo.

## Uso básico

1. Selecciona **Anaglifo**, **Imagen SBS** o **Video SBS**.
2. En imágenes elige **Una imagen preparada** o **Izquierda + derecha**. En el segundo caso selecciona *por separado* el archivo de cada ojo; al importar el segundo se construye automáticamente la composición.
3. Ajusta **Zoom** y la **Calibración estereoscópica**. Los deslizadores horizontales/verticales se expresan en **píxeles CSS** relativos al visor; la escala inicia al **100 %**, los desplazamientos en **0 px** e **Intercambiar ojos** desactivado.
4. Elige **Mover con el dedo: Ambos / Izquierdo / Derecho**. Un dedo mueve la selección, dos dedos cambian el zoom conjunto. Si necesitas precisión, abre **Ajuste fino de cada ojo**.
5. Pulsa **Bloquear** para evitar movimientos accidentales y **Vista limpia** para inspeccionar sin paneles; para desbloquear vuelve a la vista del Studio.
6. Pulsa **Descargar PNG** para exportar la composición del encuadre actual con márgenes y modificaciones visibles. No afecta al original.
7. Si te gusta un ajuste, introduce un nombre en **Mis ajustes guardados → Guardar**. Posteriormente selecciónalo y pulsa **Aplicar**; también puedes **Eliminar** perfiles. Se conservan como máximo 12 ajustes por módulo en `localStorage`, **solo valores numéricos/booleanos, nunca archivos**.
8. Pulsa **Restablecer** para regresar a los valores iniciales. Una nueva importación siempre comienza con ajustes predeterminados: los perfiles solo se aplican manualmente.

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
│           ├── imageEditor.js         # Gestos, bloqueo, PNG, canvas
│           ├── sbsVideo.js            # Composición de fotogramas SBS
│           ├── videoEditor.js          # Reproducción y Canvas de video
│           └── ui.js                  # Render de controles/estado
└── docs/
    ├── pruebas-etapa1.md
    ├── pruebas-etapa2.md
    └── pruebas-v03.md
```

## Validación, privacidad y límites

- JPG/JPEG, PNG y WebP se comprueban por extensión, firma de archivo y decodificación; los MP4 también se comprueban por compatibilidad de navegador y metadatos.
- Al sustituir contenido, se abortan cargas previas, se detienen videos y se revocan las URL locales. No hay dos archivos *activos* independientes: un **par** constituye una sola composición.
- Los archivos locales **no se suben** a la red ni se guardan en la nube. `localStorage` solo almacena ajustes nombrados, que pueden dejar de estar disponibles en modo privado o si se borran los datos del sitio.
- No se exportan videos MP4, ni se corrige automáticamente la geometría de las fotografías, ni se crea profundidad 3D a partir de una única imagen 2D.
- Compatible con GitHub Pages por HTTP(S), sin rutas absolutas ni dependencias externas. Los tests reales de gafas VR y Safari/Chrome móvil físico deberán documentarse en la evaluación.

## Evidencias y conclusiones

Documentar capturas de los tres módulos, restauración, bloqueo, ajustes por ojo, descarga, error controlado, guardado local, reproducción MP4 y posteriormente VR móvil. Agregar en `docs/pruebas-v03.md` cualquier incidencia real encontrada en el dispositivo final.

**Conclusión provisional:** se implementó una estructura modular de procesamiento y calibración estereoscópica que permite ajustar visualmente perspectivas auténticas de imágenes anaglifo y SBS conservando los archivos originales. Falta concluir y comprobar la experiencia VR en dispositivos físicos.
