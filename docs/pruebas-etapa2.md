# Pruebas de la versión 0.2 — pendientes de comprobación en dispositivos físicos

## Pruebas funcionales sugeridas

| Prueba | Procedimiento | Resultado esperado |
|---|---|---|
| M-01 | Importar JPG/PNG/WebP anaglifo | Se visualiza sin estiramiento |
| M-02 | Desplazar imagen con un dedo/mouse | La vista se traslada sin alterar el original |
| M-03 | Pellizcar con dos dedos | Zoom en tiempo real, conservando el encuadre del gesto |
| M-04 | Bloquear y arrastrar | No se mueve la imagen |
| M-05 | Bloquear y usar controles | Los controles de calibración están desactivados |
| M-06 | Vista limpia y salir | Oculta herramientas y regresa sin perder el estado |
| M-07 | Brillo/contraste anaglifo | Efectos visibles sin reimportar |
| M-08 | Separación y alineación SBS | Cambios relativos reales en las perspectivas |
| M-09 | Intercambiar ojos | Se intercambian las mitades de origen |
| M-10 | Descargar PNG | Archivo con vista y calibración actual, original intacto |
| M-11 | Restablecer | Regresa a zoom 100 %, desplazamientos 0 y ojos originales |
| M-12 | Cargar archivo corrupto | Mensaje de error, recuperación sin recargar |
| M-13 | Cambiar de módulo | Se libera el recurso anterior; ningún video continúa oculto |
| M-14 | Video MP4 | Reproducción, búsqueda, volumen y pausa mediante controles nativos |
| M-15 | Navegador móvil | No hay desplazamiento horizontal de la página |

**Advertencia:** las pruebas con gafas reales y navegadores específicos deben registrarse tras la evaluación en esos dispositivos. Este documento no inventa resultados presenciales.
