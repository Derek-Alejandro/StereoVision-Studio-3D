# Comprobaciones versión 0.3 — Edición estereoscópica

**Importante:** la siguiente matriz distingue lo probado automáticamente de las pruebas que requieren gafas y dispositivo físicos. No atribuir pruebas de usuario real sin haberlas realizado.

| Prueba | Descripción | Estado |
|---|---|---|
| V3-01 | Importar un par izquierda y derecha como anaglifo y mostrar canales rojo/cian. | Probado con par sintético en Chromium de escritorio y viewport móvil. |
| V3-02 | Importar par SBS, alternar ojos y restablecer. | Probado en Chromium. |
| V3-03 | Arrastrar solo ojo izquierdo, bloquear y comprobar que deja de moverse. | Probado con Pointer Events emulados. |
| V3-04 | Cambiar separación horizontal en píxeles y observar valor. | Probado en Chromium. |
| V3-05 | Guardar, seleccionar y aplicar perfil; importación nueva arranca con ceros. | Probado con almacenamiento local simulado en sesión de prueba. |
| V3-06 | Descargar PNG del anaglifo ajustado. | Probado con descarga en Chromium. |
| V3-07 | Reproducir MP4 SBS, aplicar separación, intercambiar ojos y reset. | Probado con MP4 sintético H.264 de 3 segundos. |
| V3-08 | Archivo PNG corrupto: error claro y recuperación al importar archivo válido. | Probado en Chromium. |
| V3-09 | No desborde horizontal en escritorio 1365 px y móvil 390 px. | Probado en Chromium. |
| V3-10 | Confirmar par estereoscópico real y confort con lentes rojo-cian. | Pendiente de prueba presencial. |
| V3-11 | Confirmar compatibilidad de archivos MP4 en teléfono real. | Pendiente de prueba presencial. |
| V3-12 | Verificación VR/Cardboard real. | Pendiente de implementación. |

Nota técnica: el test de navegador se ejecutó con el mismo JavaScript modular agrupado temporalmente para la ejecución de pruebas en un entorno aislado; para GitHub Pages se mantienen los archivos ES Modules originales.
