# Metadata Cleaner

Abre `index.html` con doble clic en un navegador moderno. No requiere instalación, conexión, compilación ni servidor. Basada en `00-template-tools`, con sus temas claro/oscuro e idiomas ES/EN.

## Uso

1. Arrastra uno o varios archivos o pulsa para seleccionarlos. No hay selector de modo; puedes añadir más archivos en cargas sucesivas.
La zona «Carga de archivos» se colapsa automáticamente al terminar una carga válida, tanto individual como por lotes. Pulsa su encabezado para volver a abrirla. «Limpiar app» la despliega de nuevo.

2. Revisa los archivos y los campos encontrados, agrupados por categorías. Inicialmente no se selecciona ningún campo para borrar.
3. Marca categorías completas o campos individuales. En modo lote, «Aplicar categorías al lote» sustituye las selecciones del lote por las categorías marcadas en el archivo activo.
4. «Limpiar las categorías marcadas» genera una copia individual eliminando los campos seleccionados. También puedes descargar un ZIP del lote. Cada archivo conserva su formato y recibe el sufijo `-clean`; los originales no se escriben. El ZIP añade un número para evitar nombres repetidos.

El orden es: archivos cargados, lista de metadatos y sección de descarga. «Eliminar todos los metadatos y descargar» limpia todos los campos eliminables del archivo activo cuando solo hay uno, o de todos los archivos cuando hay varios, sin cambiar tu selección personalizada. El encabezado de cada categoría (nombre, contador y flecha) permite colapsarla o expandirla; la casilla independiente es el único control que selecciona la categoría para borrado y su estado se conserva al marcar campos y cambiar de archivo.

El botón rojo «Limpiar app», al final, vacía archivos, metadatos, selecciones y mensajes, y vuelve a la pantalla de carga; mantiene el idioma y el tema. Solo aparece mientras hay archivos cargados.

Límites: 50 MB por archivo, 200 MB por lote y 50 archivos. Los errores se muestran por archivo. Retira archivos incompatibles para exportar el resto del lote.

## Alcance

- JPEG: campos EXIF, GPS, miniaturas EXIF/JFIF, comentarios, XMP, IPTC/Photoshop y otros segmentos APP adicionales. XMP/IPTC y bloques no interpretables son unidades completas: pueden contener categorías distintas y se identifican como tales.
- PNG: campos EXIF, textos `tEXt`, `zTXt`, `iTXt`, fecha `tIME`, bloques auxiliares adicionales y datos añadidos tras IEND. Los bloques comprimidos se identifican por su palabra clave, sin mostrar su contenido descomprimido.
- WebP: campos EXIF, XMP y bloques adicionales; actualiza tamaño RIFF y flags de presencia de metadatos.
- TXT: no contiene propiedades incrustadas estándar. Se informa de ello y se copia exactamente, incluida su codificación y saltos de línea; no se modifica su contenido.

No se recomprimen imágenes. Se conservan orientación EXIF, datos de imagen, animación y perfiles de color. La orientación es técnica y no aparece como opción eliminable. Los campos EXIF eliminados se retiran de sus directorios y sus valores referenciados se ponen a cero, incluidos los bytes de miniatura seleccionados. La longitud del archivo puede no disminuir porque se preservan offsets de los campos restantes.

Antes de descargar se vuelve a analizar la copia y se comprueba que sus campos coinciden con los que debían conservarse. Las estructuras EXIF incompatibles se ofrecen como bloque completo; no se modifican parcialmente. Se rechaza la limpieza parcial si los campos elegidos comparten datos con campos retenidos.

No es una garantía de anonimización forense: no detecta datos en los píxeles, esteganografía, bytes huérfanos sin referencias en EXIF ni información personal en estructuras propietarias desconocidas. Conserva APP14 Adobe y perfiles ICC para mantener el aspecto. Las fechas, permisos, atributos extendidos del sistema de archivos y el nombre original son ajenos a los metadatos incrustados. Una descarga recibe las propiedades que le asigne el sistema.

Todo el procesamiento sucede en memoria; solo se guarda la preferencia de tema/idioma en localStorage. No hay peticiones de red ni bibliotecas remotas.

## Verificación

`node --check metadata.js` y `node --check tool.js` comprueban sintaxis.

Después de generar las muestras, `node test-ui.cjs` comprueba los controles de colapsar, la conservación de selecciones, la descarga con todos los metadatos eliminados, el modo lote y el vaciado de la lista mediante los manejadores reales en un DOM simulado.

`python test-images.py` requiere Pillow y Node. Genera imágenes de prueba con autor, fechas, GPS y orientación; verifica borrado selectivo y total, ausencia de valores borrados en bytes, conservación del autor cuando procede, rechazo de truncados, copia exacta TXT y decodificación con idénticos píxeles y orientación. Las muestras se guardan en `test-output/`.

Referencias de formato: [PNG W3C](https://www.w3.org/TR/png-3/) y [WebP RIFF](https://developers.google.com/speed/webp/docs/riff_container).
