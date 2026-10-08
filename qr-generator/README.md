# QR Generator

A self-contained browser tool for creating static QR codes from a URL or text.
Open `index.html` directly in a modern browser. No installation, server,
internet connection, account, CDN, or external API is required.

## Usage

1. Enter a URL or text. Surrounding whitespace is trimmed; the content is otherwise encoded literally.
   Include `https://` in web addresses when you want scanners to open a website.
2. Choose error correction, output size, quiet-zone margin, and colors.
3. Download PNG or SVG. Clear empties the content without resetting the other controls.
4. Use the original template header controls to select English/Spanish and light/dark theme.

English and light theme are the defaults. Preferences are stored under
`qr-generator-language` and `qr-generator-theme` when localStorage is available.
Blocked storage does not prevent generation or theme/language changes.

## Features and Defaults

- Local QR encoding using the existing corrected encoder.
- URL and plain-text payloads, UTF-8 byte encoding, QR versions 1 through 10.
- Four error-correction levels: L, M (default), Q and H.
- Requested PNG size: 480-1600 pixels, default 960, step 80.
- Quiet-zone margin: 1-8 modules, default 4.
- QR foreground: `#111111`; background: `#ffffff`; transparency off.
- Initial content: `https://mimomakers.com`.
- PNG raster and crisp SVG vector exports with the selected colors and margin.
- Contrast, inverted-color, and transparent-background scan warnings.
- Responsive preview, collapsible settings, translated status/error messages and accessible labels.
- No network requests, redirects, intermediaries, tracking, or QR expiration service.

## Files

- `index.html`: unchanged shared header structure and the module inside `#tool-root`.
- `styles.css`: template shell styles and isolated QR module styles.
- `shell.js`: header controls, theme/language events and optional preference storage.
- `tool.js`: module translations, existing QR encoder, canvas preview and downloads.
- `README.md`: usage, structure and limitations.
- `assets/license.png`: user-provided Creative Commons attribution icon.
- `old_version/`: independent, unchanged original (`index.html`, `styles.css`, `app.js`).

The footer retains the translated local-generator label and displays "By MIMOmakers"
with the user-provided Creative Commons Attribution-NonCommercial-ShareAlike icon.

## Limitations

- Capacity depends on the UTF-8 payload length and correction level; content beyond
  version 10 displays an error. Shorten the payload or reduce correction.
- The encoder retains its original byte-mode behavior. Some scanners may interpret
  non-ASCII text differently because no explicit ECI encoding marker is emitted.
- PNG dimensions round down to a multiple of the total module count, rather than
  resampling modules. SVG uses a scalable square viewBox.
- A four-module quiet zone, dark foreground and opaque light background are recommended
  for scanning. Smaller margins, low contrast or transparency can reduce readability.
- The page theme changes the interface, not the chosen QR colors.
- Wi-Fi forms and logo overlays are not part of this version.
- Browser download and localStorage support depend on browser settings.
