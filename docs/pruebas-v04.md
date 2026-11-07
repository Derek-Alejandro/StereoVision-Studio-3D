# Pruebas v0.4 — Exportación multimedia e icono

**Fecha:** noviembre 2026. **Estado:** pruebas automatizadas en Chromium de escritorio y viewport móvil simulado, usando archivos locales sintéticos. **Pendiente:** confirmación en teléfono físico con Chrome/Safari y URL de GitHub Pages.

| Prueba | Resultado (automatizado) | Observación |
|---|---|---|
| Favicon presente | PASS (estructura) | SVG, ICO, 32, 180, 192, 512; las referencias HTML son relativas |
| Anaglifo en par, exportar JPG | PASS | Descarga `.jpg` con render y calibración |
| SBS preparado, exportar PNG | PASS | Descarga `.png` con render y calibración |
| Video con dos perspectivas, audio y ajuste horizontal | PASS | WebM VP8/Opus producido localmente, con duración EBML 3.000 s |
| Exportación sin audio | PASS | Archivo solo con pista VP8, duración EBML 3.000 s |
| Cancelar exportación | PASS | Se detiene la captura y se restauran botones, sin descarga incompleta |
| Exportar de nuevo tras cancelar | PASS | Archivo final válido y descargable |
| Cambiar de módulo tras exportar | PASS | Limpieza de enlace temporal y ocultación de herramientas incompatibles |
| Diseño a 390 px | PASS | Sin overflow horizontal ni excepciones JavaScript |

## Límites aún por comprobar en el equipo del alumno

- Probar el mismo MP4 en el teléfono que utilizará el docente, verificar formato de salida y audibilidad.
- Probar **Descargar** y **Compartir** en Android o iOS; la UI de guardado depende de permisos del navegador.
- Comprobar RAM, batería y temperatura con un MP4 de duración/tamaño real; mantener la página en primer plano.
- Repetir la matriz de la rúbrica P-01 a P-09 en GitHub Pages y lentes reales (VR aún pendiente).

## Dos incidencias reales detectadas y corregidas durante las pruebas

1. Chromium anunciaba salida `video/mp4` incluso produciendo códecs VP9/Opus, difíciles de reproducir en ciertos móviles como MP4. **Corrección:** dar preferencia a WebM en Chromium y a MP4 en WebKit/Safari cuando está soportado.
2. MediaRecorder produjo inicialmente WebM sin campo de duración, dificultando la búsqueda. **Corrección:** insertar `Duration` dentro de `Info` EBML sin transcodificación, comprobando después que `ffprobe` muestra 3.000 s.
