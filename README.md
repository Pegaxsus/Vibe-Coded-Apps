# Vibe-Coded-Apps

A collection of small browser tools created with AI assistance for image editing, pattern design, QR codes, 3D model inspection, and Factorio blueprints.

Each tool has its own folder and can be opened directly in a modern browser. No installation or build step is required. All five tools offer English and Spanish interfaces, plus light and dark themes.

## Explore the tools

| Tool | What you can do | Output |
| --- | --- | --- |
| [Factorio: Silhouette to Blueprint](factorio-silhouette-blueprint/) | Turn a silhouette image into a tile layout for Factorio. | Blueprint string, copied or saved as `.txt` |
| [Pattern Generator](pattern-generator/) | Create repeating patterns from an image with custom spacing, transforms, and colors. | PNG or SVG containing an embedded raster image |
| [QR Generator](qr-generator/) | Generate static QR codes from URLs or text, with adjustable colors and error correction. | PNG or vector SVG |
| [Quick Image Cut](quick-image-cut/) | Crop images with precise pixel dimensions and an interactive selection. | Cropped image |
| [Local STL Viewer](stl-viewer/) | Inspect ASCII or binary STL models with interactive 3D controls. | On-screen 3D preview and mesh statistics |

## Factorio: Silhouette to Blueprint

Convert a high-contrast silhouette into a Factorio tile blueprint for platform shapes or ground layouts.

- Upload or drag in an image and preview the resulting tile grid.
- Adjust the black threshold, in-game scale, maximum grid size, and smoothing.
- Use automatic or forced vertical symmetry, or disable it.
- Fill enclosed holes automatically.
- Choose Space platform foundation, Stone Brick, Concrete, or Refined concrete.
- Copy the blueprint string or download it as a text file, then import it into Factorio.

Black shapes on white or transparent backgrounds work best. Space platform foundation is intended for Factorio: Space Age.

[Usage and details](factorio-silhouette-blueprint/README.md)

## Pattern Generator

Build repeating artwork from an uploaded motif or reference image.

- Adjust rotation, scale, and horizontal or vertical skew.
- Control spacing, alternating row offsets, and repetition coverage through the density control.
- Customize motif and background colors, transparency, and opacity.
- Add a background-colored halo with adjustable size and softness to separate overlapping motifs.
- Export PNG or SVG.

Exports use a fixed 1600 × 1100 canvas. SVG exports embed a PNG rather than editable vector shapes. Transparent images use their alpha as a mask; opaque images use inverse luminance, making white areas transparent.

[Usage and details](pattern-generator/README.md)

## QR Generator

Create static QR codes that encode your URL or text directly.

- Encode URLs and UTF-8 text with QR versions 1 through 10.
- Choose from all four error-correction levels: L, M, Q, and H.
- Adjust image size, quiet-zone margin, foreground and background colors, and transparency.
- Preview the code and download PNG or crisp vector SVG.
- See warnings for low contrast, inverted colors, or transparent backgrounds that may affect scanning.

Include `https://` when encoding a web address. Payload capacity depends on text length and error correction. There is no redirect service or QR expiration service; availability of a linked website depends on that website.

[Usage and details](qr-generator/README.md)

## Quick Image Cut

Crop images locally while keeping control over the exported pixel dimensions.

- Upload an image using the file picker or drag and drop.
- Enter crop width and height in original image pixels, or enable square mode.
- Move the crop overlay and resize it with eight handles.
- Fine-tune its position with X/Y sliders, use size presets, or center the selection.
- Download the crop at its original pixel resolution.
- Reuse the current crop size and position when replacing an image during the same session.

PNG, JPEG, and WebP inputs export in their matching formats. Other browser-readable formats fall back to PNG data while retaining the original filename, so the extension may need correction. Metadata and animation are not preserved.

[Usage and details](quick-image-cut/README.md)

## Local STL Viewer

Inspect STL geometry in an interactive WebGL preview without uploading the model.

- Load ASCII or binary STL files with automatic centering and mesh statistics.
- Orbit, zoom, and pan using mouse or touch controls.
- Enable automatic orbit rotation and adjust its speed.
- Choose from five model colors.
- Rotate the model in 90-degree steps around the X, Y, or Z axis.
- Recenter the view when needed.

An internet connection is required to load Three.js and its controls from unpkg. A browser with WebGL support is required. STL dimensions are shown in the file's coordinate units; the format does not specify physical units. Large models may take longer to load and use significant memory.

[Usage and details](stl-viewer/README.md)

## Getting started

1. Download the repository using **Code → Download ZIP** and extract it, or clone it with Git.
2. Open the folder of the tool you want to use.
3. Open its `index.html` in a modern browser.
4. Load your image or STL file, or enter text for the QR generator, and adjust the controls.

For local development, you can also serve the repository from its root with Python:

```bash
python -m http.server 8765
```

Then open a tool at, for example, `http://localhost:8765/qr-generator/`.

GitHub's file preview shows the source code; download the files and open them locally to run the tools.

## Local processing and connectivity

Images, QR payloads, STL models, and blueprint generation are processed in your browser. The tools do not upload these inputs to a processing server.

Factorio: Silhouette to Blueprint, Pattern Generator, QR Generator, and Quick Image Cut can operate offline. Local STL Viewer fetches its 3D dependencies from a CDN. Optional external links, such as attribution or support links, require connectivity when followed. Language and theme preferences may be saved in browser storage.

## About and licensing

These tools are examples of applications created with AI assistance. Individual tools retain their own attribution, including MIMOmakers and the Factorio tool's project credit to `u/Pegaxsus`.

The repository includes an [Apache License 2.0](LICENSE). Individual tool documentation and attribution artwork also include Creative Commons notices, including CC BY-NC-SA. Review the relevant tool's README and included notices before reusing or redistributing it; the licensing information is not uniform across the collection.
