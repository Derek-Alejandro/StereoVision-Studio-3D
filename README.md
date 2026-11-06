# StereoVision Studio 3D — v0.2

**Instituto Tecnológico de Pachuca**  
**Ingeniería en Tecnologías de la Información y Comunicaciones**  
**Examen Unidad 2 — Estereoscopía**

**Autor:** Derek Alejandro Vargas Meneses  
**Número de control:** 22200792  
**Año:** 2026

## Objetivo
Studio web de visualización, edición no destructiva y calibración de imágenes anaglifo rojo-cian e imágenes Side-by-Side (SBS), además de reproducción preliminar de video SBS. El contenido se procesa **localmente en el navegador**; no se requiere backend ni se envían archivos a servidores.

## Estado de la versión 0.2

- **Anaglifo:** archivos JPG, PNG y WebP; zoom (50–400 %), movimiento táctil, brillo, contraste, bloqueo, vista limpia y exportación PNG.
- **Imagen SBS:** división izquierda/derecha real; ajustes de desplazamiento relativo horizontal, alineación vertical, intercambio de ojos, zoom, movimiento táctil, bloqueo, vista limpia y descarga PNG.
- **Video SBS:** importación MP4 compatible, vista SBS original y controles nativos de reproducción, pausa, búsqueda y volumen.
- **Importación:** drag-and-drop en escritorio, validación de firma de archivo y decodificación, sustitución de contenido y revocación de URLs temporales.
- **Móvil:** diseño priorizado para pantallas táctiles; un dedo desplaza ambas perspectivas, dos dedos hacen zoom, panel de bloqueo y modo de vista limpia.

**Pendiente de siguientes etapas:** visor VR/Cardboard y calibración de video en tiempo real. No se ofrecen controles decorativos para estas funciones.

## Ejecutar localmente

En la carpeta que contiene `index.html`, ejecutar:

```powershell
python -m http.server 5500
```

Abrir `http://localhost:5500/` en Chrome, Edge, Firefox o Safari. No usar `file://` con módulos ES. La publicación en GitHub Pages funciona sin rutas absolutas ni claves de API.

## Uso móvil

1. Selecciona **Anaglifo**, **Imagen SBS** o **Video SBS** antes de importar.
2. Pulsa **Elegir archivo** para importar desde el teléfono.
3. Para imágenes, arrastra con un dedo y pellizca con dos para ampliar o reducir. También puedes usar controles de zoom y calibración.
4. Pulsa **Bloquear** para impedir gestos y cambios en la calibración; **Desbloquear** para editar otra vez.
5. Pulsa **Vista limpia** para visualizar la imagen sin editor. Para salir, pulsa **Salir de vista**. El desbloqueo se realiza únicamente desde el panel principal.
6. Pulsa **Descargar PNG** para exportar la composición visible con sus ajustes. El original no se sobrescribe. La descarga **es una imagen del encuadre actual**, por lo que las proporciones y márgenes negros que muestra la vista también aparecen en el PNG.
7. **Restablecer** recupera valores de calibración iniciales (si está bloqueada, primero desbloquea).

La opción de intercambio de ojos modifica **realmente** la región de origen de cada perspectiva SBS. La calibración digital no sustituye la separación física entre lentes ni inventa profundidad.

## Arquitectura

```text
StereoVision-Studio-3D/
├── index.html                    # Estructura accesible de la interfaz
├── assets/css/styles.css        # Diseño visual minimalista
├── assets/css/responsive.css    # Adaptación móvil
├── assets/js/main.js            # Estado, navegación y eventos
├── assets/js/modules/
│   ├── fileManager.js           # Validación, decodificación y recursos
│   ├── ui.js                    # Sincronización de interfaz y estado
│   ├── imageEditor.js           # Canvas, Pointer Events, zoom, bloqueo, PNG
│   ├── calibration.js           # Valores por defecto y límites
│   ├── canvasUtils.js           # Recortes, proporciones y dibujo
│   ├── anaglyph.js              # Render anaglifo y filtros
│   ├── sbsImage.js              # Render por ojo y calibración SBS
│   └── sbsVideo.js              # Contenedor del video original
└── docs/
    ├── pruebas-etapa1.md
    └── pruebas-etapa2.md
```

## Alcance y límites

Se visualiza contenido estereoscópico ya existente; no se genera profundidad 3D desde una foto plana ni se certifica automáticamente que un par SBS tenga perspectivas reales. No se reescriben los archivos originales. Para MP4, el dispositivo debe soportar el códec integrado al archivo (comúnmente H.264/AAC). La aplicación no utiliza registro, servidor ni almacenamiento remoto.

## Licencia de medios de prueba

Los archivos audiovisuales de prueba deben ser propios o con permiso de uso. Evita publicar contenido privado en el repositorio.
