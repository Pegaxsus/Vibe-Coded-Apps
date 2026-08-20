# Quick Image Cut

Quick Image Cut is a self-contained browser tool for cropping images locally. It runs from plain HTML, CSS, and JavaScript, so no server, build step, or external dependency is required.

## Features

- Upload images through the file picker or drag and drop.
- Set the crop size in exact pixels.
- Move the crop overlay with the mouse or pointer.
- Resize the overlay from any side or corner.
- Enable Square mode to keep width and height synced.
- Keep the current overlay position and size when another image is loaded during the same page session.
- Export the crop using the original filename.
- Switch between light and dark themes.

## How to Use

1. Open `index.html` in a browser.
2. Upload or drop an image into the preview area.
3. Choose the crop width and height, or keep Square mode enabled for matching sides.
4. Drag the overlay to position the crop.
5. Drag an overlay handle to resize it.
6. Click `Cut & Download` to save the cropped image.

## Project Structure

- `index.html` contains the app layout, controls, preview area, resize handles, and attribution footer.
- `styles.css` defines the shared tool theme, responsive layout, crop overlay, drag states, and resize handles.
- `app.js` handles image loading, crop coordinate mapping, drag and resize behavior, and file export.
- `assets/license.png` stores the attribution/license graphic copied from the companion tool style.

## Implementation Notes

The crop rectangle is stored in natural image pixels, not screen pixels. The preview image is scaled to fit the available panel, and `app.js` converts between preview coordinates and original image coordinates through `displayScale`. This keeps the downloaded crop aligned with the visible overlay.

The app only stores state in memory. Refreshing the page resets the loaded image and overlay, while loading another image without refreshing preserves the current crop rectangle as much as the new image dimensions allow.
