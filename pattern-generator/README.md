# Pattern Generator

An offline pattern studio using the local `00-template-tools` shell, following the integration used by `quick-image-cut`. Open `index.html` directly in a modern browser. No server, installation, network connection, or build step is required.

## Usage and Features

1. Upload a reference image in the preview, or drag and drop it onto the preview.
2. Adjust rotation, scale, and horizontal/vertical skew in **Orientation**.
3. Set horizontal/vertical spacing, alternate row offset, and density in **Pattern**.
4. Choose pattern and background colors, transparency, and opacity in **Color**.
5. Set halo size and softness to separate overlapping motifs using the background color.
6. Download PNG or SVG, or clear the preview. Each control section can be collapsed.
7. Use the template header to select English/Spanish and light/dark themes.

All original control ranges and defaults are retained: rotation/skew 0, scale 70%, spacing 190 px, row offset 50%, density 3, pattern color #2f7dff, background #10131b, opacity 100%, halo size 0 and softness 8 px. The interface theme does not change artwork colors.

## Files

- `index.html`: shared template header and generator module inside `#tool-root`.
- `styles.css`: original header styles, template dark palette, and scoped responsive generator styles.
- `shell.js`: shared language/theme controls and optional preference storage.
- `tool.js`: module translations, image loading, repeat rendering, halo, and exports.
- `assets/license.png`: preserved original license artwork.
- `samples/`: preserved local example images.
- `old_version/`: complete standalone original application, including `app.js`, styles, assets, and samples. Open its `index.html` to use it.

English and light are the defaults. Preferences use `pattern-generator-language` and `pattern-generator-theme` when localStorage is available. Images and generator settings are not persisted.

## Limitations

Exports keep the original fixed 1600 x 1100 pixel canvas. Window resizing only changes the preview display. SVG export embeds a PNG and is not editable vector artwork. Browser image decoding determines supported formats; animated images produce a static frame and metadata is not preserved.

Transparent images use their alpha as a mask; opaque images use inverse luminance, so white becomes transparent. Large references, dense spacing, and large halos can take longer to render. Softness has an effect when halo size is greater than zero. Halos use the background color even in transparent exports. Density retains its original behavior of increasing repetition coverage beyond the canvas edges, rather than changing spacing.

## Verification

Verified in Microsoft Edge by opening the file URL directly: upload and drag/drop, all generator controls, halo softness, transparency, PNG/SVG downloads, clear, invalid image errors, both languages/themes, saved preferences, and operation without localStorage. Layout checks cover widths of 320, 390, 768, 1024, and 1440 pixels. The header's computed styles match the template, and the original backup opens and renders independently.

## Attribution

Local generator  
By MIMOmakers  
Original license artwork and attribution are preserved in `assets/license.png`.
