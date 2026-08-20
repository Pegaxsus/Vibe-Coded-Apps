const canvasShell = document.getElementById("canvasShell");
const controlPanel = document.querySelector(".control-panel");
const emptyState = document.getElementById("emptyState");
const imageStage = document.getElementById("imageStage");
const previewImage = document.getElementById("previewImage");
const cropOverlay = document.getElementById("cropOverlay");
const cropSizeLabel = document.getElementById("cropSizeLabel");
const imageInput = document.getElementById("imageInput");
const sideImageInput = document.getElementById("sideImageInput");
const filePicker = document.querySelector(".empty-state .file-picker");
const sideFilePicker = document.querySelector(".side-picker");
const fileName = document.getElementById("fileName");
const sideFileName = document.getElementById("sideFileName");
const themeSelect = document.getElementById("themeSelect");
const licenseImage = document.getElementById("licenseImage");
const downloadCropButton = document.getElementById("downloadCrop");
const centerCropButton = document.getElementById("centerCrop");
const clearPreviewButton = document.getElementById("clearPreview");

const controls = {
  squareMode: document.getElementById("squareMode"),
  cropWidth: document.getElementById("cropWidth"),
  cropHeight: document.getElementById("cropHeight"),
  cropX: document.getElementById("cropX"),
  cropY: document.getElementById("cropY")
};

const outputs = {
  cropWidth: document.getElementById("cropWidthValue"),
  cropHeight: document.getElementById("cropHeightValue"),
  cropX: document.getElementById("cropXValue"),
  cropY: document.getElementById("cropYValue")
};

// Runtime state only lives for the current page session, so replacing an image can keep the crop rectangle.
let sourceImage = null;
let sourceUrl = "";
let activeDownloadName = "quick-image-cut.png";
let activeMimeType = "image/png";
let displayScale = 1;
let dragState = null;

function syncPreviewHeight() {
  if (window.matchMedia("(max-width: 980px)").matches) {
    canvasShell.style.height = "";
    return;
  }

  canvasShell.style.height = `${controlPanel.offsetHeight}px`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getRequestedSize() {
  return {
    width: Math.max(1, Math.round(Number(controls.cropWidth.value) || 1)),
    height: Math.max(1, Math.round(Number(controls.cropHeight.value) || 1))
  };
}

function getCropSize() {
  const requested = getRequestedSize();

  if (!sourceImage) {
    return requested;
  }

  return {
    width: Math.min(requested.width, sourceImage.naturalWidth),
    height: Math.min(requested.height, sourceImage.naturalHeight)
  };
}

function getCropPosition() {
  return {
    x: Math.round(Number(controls.cropX.value) || 0),
    y: Math.round(Number(controls.cropY.value) || 0)
  };
}

function getFitSize() {
  if (!sourceImage) {
    return { width: 0, height: 0 };
  }

  // Fit the source image inside the preview shell without upscaling; this defines displayScale.
  const maxWidth = Math.max(1, canvasShell.clientWidth - 28);
  const maxHeight = Math.max(1, canvasShell.clientHeight - 28);
  const scale = Math.min(
    1,
    maxWidth / sourceImage.naturalWidth,
    maxHeight / sourceImage.naturalHeight
  );

  return {
    width: Math.round(sourceImage.naturalWidth * scale),
    height: Math.round(sourceImage.naturalHeight * scale)
  };
}

function setCropPosition(x, y) {
  const cropSize = getCropSize();
  const maxX = sourceImage ? Math.max(0, sourceImage.naturalWidth - cropSize.width) : 0;
  const maxY = sourceImage ? Math.max(0, sourceImage.naturalHeight - cropSize.height) : 0;

  controls.cropX.value = String(clamp(Math.round(x), 0, maxX));
  controls.cropY.value = String(clamp(Math.round(y), 0, maxY));
}

function setCropRect(x, y, width, height) {
  if (!sourceImage) {
    return;
  }

  // Inputs are the single source of truth for crop size, so mouse resizing updates them too.
  const cropWidth = clamp(Math.round(width), 1, sourceImage.naturalWidth);
  const cropHeight = clamp(Math.round(height), 1, sourceImage.naturalHeight);

  controls.cropWidth.value = String(cropWidth);
  controls.cropHeight.value = String(cropHeight);
  setCropPosition(x, y);
}

function updateLabels() {
  const requested = getRequestedSize();
  const cropSize = getCropSize();
  const position = getCropPosition();

  outputs.cropWidth.textContent = `${requested.width} px`;
  outputs.cropHeight.textContent = `${requested.height} px`;
  outputs.cropX.textContent = `${position.x} px`;
  outputs.cropY.textContent = `${position.y} px`;
  cropSizeLabel.textContent = `${cropSize.width} x ${cropSize.height} px`;
}

function syncRangeLimits() {
  const cropSize = getCropSize();
  const maxX = sourceImage ? Math.max(0, sourceImage.naturalWidth - cropSize.width) : 0;
  const maxY = sourceImage ? Math.max(0, sourceImage.naturalHeight - cropSize.height) : 0;

  // Range sliders must shrink or grow with each loaded image and current crop size.
  controls.cropX.max = String(maxX);
  controls.cropY.max = String(maxY);
  setCropPosition(controls.cropX.value, controls.cropY.value);
}

function updateOverlay() {
  syncRangeLimits();
  updateLabels();

  const hasImage = Boolean(sourceImage);
  emptyState.classList.toggle("is-hidden", hasImage);
  imageStage.classList.toggle("is-visible", hasImage);
  downloadCropButton.disabled = !hasImage;
  centerCropButton.disabled = !hasImage;
  clearPreviewButton.disabled = !hasImage;

  if (!hasImage) {
    return;
  }

  const fitSize = getFitSize();
  const cropSize = getCropSize();
  const position = getCropPosition();
  displayScale = fitSize.width / sourceImage.naturalWidth;

  // Convert natural-image crop coordinates to the scaled preview coordinate system.
  imageStage.style.width = `${fitSize.width}px`;
  imageStage.style.height = `${fitSize.height}px`;
  cropOverlay.style.width = `${Math.max(16, cropSize.width * displayScale)}px`;
  cropOverlay.style.height = `${Math.max(16, cropSize.height * displayScale)}px`;
  cropOverlay.style.transform = `translate(${position.x * displayScale}px, ${position.y * displayScale}px)`;
}

function centerCrop() {
  if (!sourceImage) {
    return;
  }

  const cropSize = getCropSize();
  setCropPosition(
    (sourceImage.naturalWidth - cropSize.width) / 2,
    (sourceImage.naturalHeight - cropSize.height) / 2
  );
  updateOverlay();
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  licenseImage.src = "assets/license.png";
}

function setSquareSize(value) {
  controls.cropWidth.value = String(value);
  controls.cropHeight.value = String(value);
}

function handleDimensionInput(changedControl) {
  const value = Math.max(1, Math.round(Number(changedControl.value) || 1));
  changedControl.value = String(value);

  if (controls.squareMode.checked) {
    setSquareSize(value);
  }

  updateOverlay();
}

function loadImage(file) {
  if (!file.type.startsWith("image/")) {
    fileName.textContent = "The file must be an image";
    sideFileName.textContent = "The file must be an image";
    return;
  }

  if (sourceUrl) {
    URL.revokeObjectURL(sourceUrl);
  }

  const hadImage = Boolean(sourceImage);
  sourceUrl = URL.createObjectURL(file);
  // The exported crop keeps the original filename and the closest canvas-supported MIME type.
  activeDownloadName = file.name || "quick-image-cut.png";
  activeMimeType = ["image/png", "image/jpeg", "image/webp"].includes(file.type) ? file.type : "image/png";

  const image = new Image();
  image.onload = () => {
    sourceImage = image;
    fileName.textContent = file.name;
    sideFileName.textContent = `${file.name} (${image.naturalWidth} x ${image.naturalHeight} px)`;
    const placeOverlay = () => {
      // First image starts centered; later images keep the existing crop rectangle for batch work.
      if (hadImage) {
        setCropPosition(controls.cropX.value, controls.cropY.value);
        updateOverlay();
      } else {
        centerCrop();
      }
      syncPreviewHeight();
    };
    previewImage.onload = placeOverlay;
    previewImage.src = sourceUrl;

    if (previewImage.complete) {
      placeOverlay();
    }
  };
  image.onerror = () => {
    sourceImage = null;
    previewImage.removeAttribute("src");
    fileName.textContent = "The image could not be loaded";
    sideFileName.textContent = "The image could not be loaded";
    updateOverlay();
  };
  image.src = sourceUrl;
}

function clearPreview() {
  if (sourceUrl) {
    URL.revokeObjectURL(sourceUrl);
  }

  sourceImage = null;
  sourceUrl = "";
  activeDownloadName = "quick-image-cut.png";
  activeMimeType = "image/png";
  previewImage.removeAttribute("src");
  imageInput.value = "";
  sideImageInput.value = "";
  fileName.textContent = "No image selected";
  sideFileName.textContent = "No image selected";
  setCropPosition(0, 0);
  updateOverlay();
}

function downloadFile(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function cropAndDownload() {
  if (!sourceImage) {
    return;
  }

  const cropSize = getCropSize();
  const position = getCropPosition();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Draw only the selected natural-image rectangle into an output canvas of the same size.
  canvas.width = cropSize.width;
  canvas.height = cropSize.height;
  ctx.drawImage(
    sourceImage,
    position.x,
    position.y,
    cropSize.width,
    cropSize.height,
    0,
    0,
    cropSize.width,
    cropSize.height
  );

  canvas.toBlob((blob) => {
    if (blob) {
      downloadFile(blob, activeDownloadName);
    }
  }, activeMimeType);
}

function setDropState(isDragging) {
  canvasShell.classList.toggle("is-dragging", isDragging);
  filePicker.classList.toggle("is-dragging", isDragging);
  sideFilePicker.classList.toggle("is-dragging", isDragging);
}

function handleDrag(event) {
  event.preventDefault();
  event.stopPropagation();
}

function handleDrop(event) {
  handleDrag(event);
  setDropState(false);

  const [file] = event.dataTransfer.files;
  if (file) {
    loadImage(file);
  }
}

function handlePointerDown(event) {
  if (!sourceImage) {
    return;
  }

  event.preventDefault();
  cropOverlay.setPointerCapture(event.pointerId);

  const position = getCropPosition();
  const cropSize = getCropSize();
  // A data-resize target starts resize mode; any other overlay point starts move mode.
  dragState = {
    mode: event.target.dataset.resize ? "resize" : "move",
    handle: event.target.dataset.resize || "",
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    cropX: position.x,
    cropY: position.y,
    cropWidth: cropSize.width,
    cropHeight: cropSize.height
  };
}

function handlePointerMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  const deltaX = (event.clientX - dragState.startX) / displayScale;
  const deltaY = (event.clientY - dragState.startY) / displayScale;

  // Moving preserves size and only changes the top-left crop coordinate.
  if (dragState.mode === "move") {
    setCropPosition(dragState.cropX + deltaX, dragState.cropY + deltaY);
    updateOverlay();
    return;
  }

  const handle = dragState.handle;
  let nextX = dragState.cropX;
  let nextY = dragState.cropY;
  let nextWidth = dragState.cropWidth;
  let nextHeight = dragState.cropHeight;

  if (handle.includes("e")) {
    nextWidth = dragState.cropWidth + deltaX;
  }
  if (handle.includes("s")) {
    nextHeight = dragState.cropHeight + deltaY;
  }
  if (handle.includes("w")) {
    nextWidth = dragState.cropWidth - deltaX;
    nextX = dragState.cropX + deltaX;
  }
  if (handle.includes("n")) {
    nextHeight = dragState.cropHeight - deltaY;
    nextY = dragState.cropY + deltaY;
  }

  if (controls.squareMode.checked) {
    // Square mode lets any dragged edge define one shared side length.
    const sideSource = handle === "n" || handle === "s" ? nextHeight : nextWidth;
    const side = Math.max(1, sideSource);
    nextWidth = side;
    nextHeight = side;

    if (handle.includes("w")) {
      nextX = dragState.cropX + dragState.cropWidth - side;
    }
    if (handle.includes("n")) {
      nextY = dragState.cropY + dragState.cropHeight - side;
    }
  }

  if (nextX < 0) {
    nextWidth += nextX;
    nextX = 0;
  }
  if (nextY < 0) {
    nextHeight += nextY;
    nextY = 0;
  }
  if (nextX + nextWidth > sourceImage.naturalWidth) {
    nextWidth = sourceImage.naturalWidth - nextX;
  }
  if (nextY + nextHeight > sourceImage.naturalHeight) {
    nextHeight = sourceImage.naturalHeight - nextY;
  }

  if (controls.squareMode.checked) {
    // After clamping to image bounds, square mode resolves to the largest valid shared side.
    const side = Math.max(1, Math.min(nextWidth, nextHeight));
    nextWidth = side;
    nextHeight = side;
  }

  setCropRect(nextX, nextY, nextWidth, nextHeight);
  updateOverlay();
}

function handlePointerUp(event) {
  if (dragState && dragState.pointerId === event.pointerId) {
    dragState = null;
  }
}

function handleFileInput(event) {
  const [file] = event.target.files;
  if (file) {
    loadImage(file);
  }
}

imageInput.addEventListener("change", handleFileInput);
sideImageInput.addEventListener("change", handleFileInput);

[canvasShell, filePicker, sideFilePicker].forEach((dropTarget) => {
  dropTarget.addEventListener("dragenter", (event) => {
    handleDrag(event);
    setDropState(true);
  });
  dropTarget.addEventListener("dragover", handleDrag);
  dropTarget.addEventListener("dragleave", (event) => {
    handleDrag(event);

    if (!dropTarget.contains(event.relatedTarget)) {
      setDropState(false);
    }
  });
  dropTarget.addEventListener("drop", handleDrop);
});

document.querySelectorAll(".control-group").forEach((section) => {
  section.addEventListener("toggle", syncPreviewHeight);
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const [width, height] = button.dataset.preset.split(",").map(Number);
    controls.cropWidth.value = String(width);
    controls.cropHeight.value = String(controls.squareMode.checked ? width : height);
    updateOverlay();
  });
});

controls.cropWidth.addEventListener("input", () => handleDimensionInput(controls.cropWidth));
controls.cropHeight.addEventListener("input", () => handleDimensionInput(controls.cropHeight));
controls.cropX.addEventListener("input", updateOverlay);
controls.cropY.addEventListener("input", updateOverlay);
controls.squareMode.addEventListener("change", () => {
  if (controls.squareMode.checked) {
    setSquareSize(controls.cropWidth.value);
  }
  updateOverlay();
});

cropOverlay.addEventListener("pointerdown", handlePointerDown);
cropOverlay.addEventListener("pointermove", handlePointerMove);
cropOverlay.addEventListener("pointerup", handlePointerUp);
cropOverlay.addEventListener("pointercancel", handlePointerUp);

themeSelect.addEventListener("change", () => setTheme(themeSelect.value));
downloadCropButton.addEventListener("click", cropAndDownload);
centerCropButton.addEventListener("click", centerCrop);
clearPreviewButton.addEventListener("click", clearPreview);
window.addEventListener("resize", updateOverlay);
window.addEventListener("resize", syncPreviewHeight);

if ("ResizeObserver" in window) {
  const panelObserver = new ResizeObserver(syncPreviewHeight);
  panelObserver.observe(controlPanel);

  const imageObserver = new ResizeObserver(updateOverlay);
  imageObserver.observe(canvasShell);
}

setTheme(themeSelect.value);
updateOverlay();
syncPreviewHeight();
