# Quick Image Cut

An offline image cropper built on the shared `00-template-tools` shell. Open `index.html` directly in a modern browser. No installation, build step, server, or external services are required.

## Features

- Upload an image using either file picker or drag and drop.
- Set crop width and height in original image pixels.
- Enable Square to keep both dimensions equal.
- Drag the overlay to position the crop, or resize it using its eight handles.
- Adjust X and Y with sliders, choose a size preset, or center the selection.
- Use **Cut & Download** to download the crop with the original filename.
- Replace an image to reuse the current crop size and position during the page session. Coordinates are clamped to the new image bounds.
- Switch between English and Spanish, and light and dark themes using the shared header. English and light are the defaults; subsequent visits restore saved preferences when browser storage is available.

## Files

- `index.html`: shared header and the crop module inside `#tool-root`.
- `styles.css`: template theme tokens, header styles, and scoped responsive crop styles.
- `shell.js`: language and theme preferences, translations, and shell events.
- `tool.js`: image loading, crop geometry, pointer interactions, and canvas export.
- `assets/license.png`: original attribution artwork.
- `old_version/`: complete original application preserved before migration, including its README and assets. Open `old_version/index.html` to use it.

## Implementation Notes

All image processing happens locally in the browser. Images are decoded through object URLs; a canvas draws the selected rectangle at its original pixel resolution. The preview is scaled to fit without changing export dimensions.

Crop state lives only in memory and resets on page reload. Theme and language use the tool-specific `quick-image-cut-theme` and `quick-image-cut-language` storage keys.

PNG, JPEG, and WebP images are exported using their matching canvas formats. Other browser-readable formats use PNG data while retaining the original filename; the extension may therefore differ from the encoded format. Browser decoding and canvas limits determine supported input formats and maximum image size. Metadata and animation are not preserved.

The module extends `ToolShell.messages` and listens for `tool:languagechange` to refresh dynamic status text. The **Cut & Download** label remains in English in both languages.

## Attribution

U/PEGAXSUS. Made with CODEX. Original license artwork is retained in `assets/license.png`.

