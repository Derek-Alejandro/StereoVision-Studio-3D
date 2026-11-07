# Pruebas funcionales · v0.5 · Vista VR/Cardboard

**Alcance:** verificación automatizada en Chromium de la interfaz, dibujo SBS, reproducción de MP4 y conservación de estado. Las pruebas automáticas se realizaron en una vista de navegador con el HTML/CSS/JS incluidos localmente debido a restricciones de navegación HTTP de este entorno. **No sustituyen la verificación real desde GitHub Pages y con las gafas Cardboard.**

| ID | Prueba | Resultado automatizado |
|---|---|---|
| VR-01 | Sin archivo, botón VR no disponible | Correcto: botones ocultos |
| VR-02 | Cargar imagen SBS y entrar al visor VR | Correcto: canvas en dos mitades, ancho par |
| VR-03 | Cambiar disparidad, intercambiar ojos, bloquear y salir de VR | Correcto: valores y bloqueo preservados |
| VR-04 | Ocultar / mostrar interfaz VR y salir | Correcto |
| VR-05 | Orientación vertical | Correcto: aviso para girar el teléfono |
| VR-06 | Orientación horizontal | Correcto: visor operativo sin estiramiento provocado por CSS |
| VR-07 | Cargar MP4 y entrar a VR | Correcto: una fuente de video, dos vistas SBS |
| VR-08 | Reproducir, pausar, volver al Studio | Correcto: controles y ajustes conservados |
| VR-09 | Pantalla completa | Correcto en Chromium automatizado; orientación automática no permitida en el entorno, se informa y se mantiene el visor |
| VR-10 | Interfaz móvil en 390×844 y 844×390 | Correcto: sin desplazamiento horizontal |
| VR-11 | Excepciones JS durante pruebas | Ninguna detectada |

## Evidencias reales que faltan para cerrar el examen

1. Publicar desde GitHub Pages HTTPS y comprobar que carguen todos los módulos sin error de Network/Console.
2. Usar **imagen SBS real** (dos perspectivas) y **MP4 SBS H.264/AAC compatible** en el **teléfono de la evaluación**.
3. Probar horizontal con Cardboard y calibrar **antes** de colocar el móvil en las gafas.
4. Verificar salida táctil, función de pantalla completa cuando el navegador la permita, bloqueo y retorno al mismo ajuste.
5. Repetir con video (play/pause, audio, búsqueda en Studio y retorno a VR). Detener la prueba ante mareo, fatiga o visión doble persistente.
6. Registrar: nombre del archivo, dispositivo/navegador, escala, disparidad, intercambio, observaciones visuales y dos incidencias reales resueltas.

**Importante:** esta v0.5 no introduce seguimiento de cabeza, corrección óptica de lentes, calibración física de IPD, reproyección 6DoF ni conversión automática 2D→3D. La vista SBS/Cardboard es una presentación estereoscópica 2D por ojo, adecuada al alcance de la rúbrica.
