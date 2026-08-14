# Factorio: Silhouette to Blueprint

A small offline web app that converts a black-and-white silhouette image into a Factorio blueprint string.

Upload a PNG with a white background and a black silhouette, tune the generation controls, and copy the generated blueprint into Factorio. The app is designed for creating ship/platform shapes with tiles such as Space platform foundation, Stone Brick, Concrete, and Refined concrete.

## Features

- Runs completely offline in the browser.
- No internet connection required.
- No uploaded image or generated blueprint is sent anywhere.
- Converts silhouette shapes into Factorio tile blueprints.
- Live grid preview of the final in-game tile layout.
- Adjustable black threshold, scale, smoothing, and max tile size.
- Optional vertical symmetry: Auto, Force, or Off.
- Tile selector with:
  - Space platform foundation
  - Stone Brick
  - Concrete
  - Refined concrete
- English and Spanish UI.
- Light and dark themes.
- Copy-to-clipboard and `.txt` download actions.

## How To Use

1. Open `index.html` in a modern browser.
2. Upload or drag in a silhouette image.
3. Adjust the generation controls:
   - `Black threshold`: decides which pixels count as part of the silhouette.
   - `In-game scale`: scales the final blueprint size from 25% to 300%.
   - `Max side tiles`: caps the longest side of the generated tile grid.
   - `Smoothing %`: controls how strict or soft the row tracing is.
   - `Vertical symmetry`: keeps both sides equal when the source shape is symmetric.
   - `Internal tile name`: chooses which Factorio tile prototype to place.
4. Copy the blueprint string.
5. Import it in Factorio.

## Input Image Format

Best results come from simple silhouettes:

- White or transparent background.
- Black main shape.
- High contrast edges.
- Minimal shadows, gradients, or texture.

PNG is recommended, although most browser-readable image formats should load.

## How It Works

The app reads the uploaded image into an offscreen canvas and builds a binary mask from dark pixels. It then finds the silhouette bounds and traces horizontal runs of the shape row by row. Those runs are converted into a Factorio tile grid, optionally mirrored for vertical symmetry.

The generated blueprint JSON is encoded as a Factorio blueprint string:

1. Build blueprint JSON with a `tiles` array.
2. Compress the JSON with zlib/deflate.
3. Base64 encode the compressed bytes.
4. Prefix the result with `0`, as expected by Factorio blueprint strings.

If the browser does not support `CompressionStream`, the app falls back to a valid uncompressed zlib stream, so it still works offline.

## Project Structure

```text
factorio-silhouette-blueprint/
  index.html
  styles.css
  assets/
    dark-license.jpg
    light-license.png
  samples/
    example silhouette images
```

## Local Development

This is a static app. You can open `index.html` directly.

For local testing through a web server:

```bash
python -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/factorio-silhouette-blueprint/
```

## Notes

- `space-platform-foundation` is intended for Factorio Space Age space platform builds.
- `stone-path`, `concrete`, and `refined-concrete` are vanilla tile prototype names.
- Very large blueprints can produce long strings and may be slower to import or place.

## Attribution

Created with CODEX.

Project by `u/Pegaxsus`.

## License

Licensed under CC BY-NC-SA.

