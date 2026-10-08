# Local STL Viewer

Open `index.html` directly in a modern browser with WebGL support. No installation or build is required. Select an STL file or drop it onto the upload area. Files are parsed on your device and are not uploaded.

## Features

- ASCII and binary STL loading, automatic centering and mesh statistics.
- Automatic orbit rotation (enabled initially), speed slider (50% initially), manual orbit, zoom and pan through OrbitControls.
- Five model colors, with light gray selected initially.
- Six quarter-turn controls (+X, -X, +Y, -Y, +Z, -Z) rotate the model by +/-90 degrees around fixed world axes. Each turn takes 280 ms with smooth easing; repeated clicks are queued. The camera, zoom and pan are preserved. Automatic orbit rotation pauses when a turn is requested.
- Center-view button and responsive desktop/mobile layout.
- Attribution footer: Local generator, By MIMOmakers and the supplied CC BY-NC-SA artwork. Dark gray text and artwork provide contrast in the light theme.
- English (default) and Spanish; light (default) and dark themes.
- Optional localStorage persistence using `stl-viewer-language` and `stl-viewer-theme`. Storage failures do not prevent use.

## Files

- `index.html`: shared header structure, STL module markup and Three.js import map.
- `styles.css`: template header styling and tool styles scoped to `#tool-root`.
- `shell.js`: shared theme/language controls and preference persistence.
- `tool.js`: translations, STL parsing, rendering, color palette and camera controls.
- `assets/license.png`: supplied attribution/license artwork displayed in the left column below the STL information.
- `assets/mimomakers-watermark.png`: retained original asset, no longer displayed in the preview.
- `old_version/`: complete original version, including its own index.html and asset. Open its index.html separately to use the original.

## Limitations

Three.js 0.166.1, STLLoader and OrbitControls are loaded from unpkg, just as in the original version. An internet connection is needed to fetch these dependencies; the folder is self-contained apart from that existing CDN dependency. Browser restrictions, WebGL availability and GPU limits can affect loading. Very large STL files can use substantial memory and block the interface while parsing.

Dimensions are reported in the STL coordinate units; STL does not record physical units. Automatic rotation orbits the centered model using the original OrbitControls behavior. On touch devices, use one finger to orbit and two fingers to zoom/pan.

The header follows `00-template-tools`; `quick-image-cut` is the reference for module-scoped light surfaces and tool-specific preferences. Original attribution assets are preserved. The original source contains no separate copyright notice.
