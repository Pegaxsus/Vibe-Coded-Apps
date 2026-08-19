const canvas = document.getElementById("patternCanvas");
const ctx = canvas.getContext("2d");
const canvasShell = document.querySelector(".canvas-shell");
const controlPanel = document.querySelector(".control-panel");
const emptyState = document.getElementById("emptyState");
const imageInput = document.getElementById("imageInput");
const filePicker = document.querySelector(".file-picker");
const fileName = document.getElementById("fileName");
const themeSelect = document.getElementById("themeSelect");
const licenseImage = document.getElementById("licenseImage");

const controls = {
  rotation: document.getElementById("rotation"),
  scale: document.getElementById("scale"),
  skewX: document.getElementById("skewX"),
  skewY: document.getElementById("skewY"),
  gapX: document.getElementById("gapX"),
  gapY: document.getElementById("gapY"),
  rowOffset: document.getElementById("rowOffset"),
  density: document.getElementById("density"),
  patternColor: document.getElementById("patternColor"),
  backgroundColor: document.getElementById("backgroundColor"),
  transparentBg: document.getElementById("transparentBg"),
  opacity: document.getElementById("opacity"),
  haloSize: document.getElementById("haloSize"),
  haloSoftness: document.getElementById("haloSoftness")
};

const outputs = {
  rotation: document.getElementById("rotationValue"),
  scale: document.getElementById("scaleValue"),
  skewX: document.getElementById("skewXValue"),
  skewY: document.getElementById("skewYValue"),
  gapX: document.getElementById("gapXValue"),
  gapY: document.getElementById("gapYValue"),
  rowOffset: document.getElementById("rowOffsetValue"),
  density: document.getElementById("densityValue"),
  opacity: document.getElementById("opacityValue"),
  haloSize: document.getElementById("haloSizeValue"),
  haloSoftness: document.getElementById("haloSoftnessValue")
};

let referenceImage = null;
let referenceUrl = "";

function syncPreviewHeight() {
  if (window.matchMedia("(max-width: 980px)").matches) {
    canvasShell.style.height = "";
    return;
  }

  canvasShell.style.height = `${controlPanel.offsetHeight}px`;
}

function getState() {
  return {
    rotation: Number(controls.rotation.value),
    scale: Number(controls.scale.value),
    skewX: Number(controls.skewX.value),
    skewY: Number(controls.skewY.value),
    gapX: Number(controls.gapX.value),
    gapY: Number(controls.gapY.value),
    rowOffset: Number(controls.rowOffset.value),
    density: Number(controls.density.value),
    patternColor: controls.patternColor.value,
    backgroundColor: controls.backgroundColor.value,
    transparentBg: controls.transparentBg.checked,
    opacity: Number(controls.opacity.value) / 100,
    haloSize: Number(controls.haloSize.value),
    haloSoftness: Number(controls.haloSoftness.value)
  };
}

function updateLabels() {
  outputs.rotation.textContent = `${controls.rotation.value} deg`;
  outputs.scale.textContent = `${controls.scale.value}%`;
  outputs.skewX.textContent = `${controls.skewX.value} deg`;
  outputs.skewY.textContent = `${controls.skewY.value} deg`;
  outputs.gapX.textContent = `${controls.gapX.value} px`;
  outputs.gapY.textContent = `${controls.gapY.value} px`;
  outputs.rowOffset.textContent = `${controls.rowOffset.value}%`;
  outputs.density.textContent = controls.density.value;
  outputs.opacity.textContent = `${controls.opacity.value}%`;
  outputs.haloSize.textContent = `${controls.haloSize.value} px`;
  outputs.haloSoftness.textContent = `${controls.haloSoftness.value} px`;
}

function makeTintedImage(image, color, opacity) {
  const tintCanvas = document.createElement("canvas");
  const tintCtx = tintCanvas.getContext("2d");
  tintCanvas.width = image.naturalWidth;
  tintCanvas.height = image.naturalHeight;

  tintCtx.drawImage(image, 0, 0);
  const imageData = tintCtx.getImageData(0, 0, tintCanvas.width, tintCanvas.height);
  const pixels = imageData.data;
  const rgb = hexToRgb(color);
  let hasTransparency = false;

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 250) {
      hasTransparency = true;
      break;
    }
  }

  for (let i = 0; i < pixels.length; i += 4) {
    const luminance = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    const mask = 1 - luminance / 255;
    const alpha = hasTransparency ? pixels[i + 3] : pixels[i + 3] * mask;
    pixels[i] = rgb.r;
    pixels[i + 1] = rgb.g;
    pixels[i + 2] = rgb.b;
    pixels[i + 3] = alpha * opacity;
  }

  tintCtx.putImageData(imageData, 0, 0);
  return tintCanvas;
}

function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  const value = Number.parseInt(cleanHex, 16);
  return {
    r: value >> 16 & 255,
    g: value >> 8 & 255,
    b: value & 255
  };
}

function makeHaloSprite(haloImage, width, height, state) {
  if (state.haloSize <= 0) {
    return null;
  }

  const pad = state.haloSize + state.haloSoftness * 3 + 4;
  const sprite = document.createElement("canvas");
  const spriteCtx = sprite.getContext("2d");
  sprite.width = Math.ceil(width + pad * 2);
  sprite.height = Math.ceil(height + pad * 2);

  const baseX = (sprite.width - width) / 2;
  const baseY = (sprite.height - height) / 2;

  spriteCtx.imageSmoothingEnabled = true;
  spriteCtx.filter = state.haloSoftness > 0 ? `blur(${state.haloSoftness}px)` : "none";

  for (let radius = state.haloSize; radius >= 0; radius -= 2) {
    const steps = Math.max(24, Math.ceil(radius * Math.PI / 2));

    for (let step = 0; step < steps; step += 1) {
      const angle = step / steps * Math.PI * 2;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      spriteCtx.drawImage(haloImage, baseX + offsetX, baseY + offsetY, width, height);
    }
  }

  return {
    canvas: sprite,
    offsetX: baseX,
    offsetY: baseY,
    width: sprite.width,
    height: sprite.height
  };
}

function drawPatternImage(image, haloSprite, x, y, width, height) {
  if (haloSprite) {
    ctx.drawImage(haloSprite.canvas, x - haloSprite.offsetX, y - haloSprite.offsetY, haloSprite.width, haloSprite.height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.filter = "none";
  ctx.drawImage(image, x, y, width, height);
}

function drawBackground(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.transparentBg) {
    ctx.fillStyle = state.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function render() {
  const state = getState();
  updateLabels();
  drawBackground(state);

  emptyState.classList.toggle("is-hidden", Boolean(referenceImage));

  if (!referenceImage) {
    return;
  }

  const tintedImage = makeTintedImage(referenceImage, state.patternColor, state.opacity);
  const haloImage = makeTintedImage(referenceImage, state.backgroundColor, 1);
  const maxNaturalSide = Math.max(referenceImage.naturalWidth, referenceImage.naturalHeight);
  const targetMaxSide = 190 * (state.scale / 100);
  const drawWidth = referenceImage.naturalWidth * (targetMaxSide / maxNaturalSide);
  const drawHeight = referenceImage.naturalHeight * (targetMaxSide / maxNaturalSide);
  const haloSprite = makeHaloSprite(haloImage, drawWidth, drawHeight, state);
  const angle = state.rotation * Math.PI / 180;
  const skewX = Math.tan(state.skewX * Math.PI / 180);
  const skewY = Math.tan(state.skewY * Math.PI / 180);
  const rowOffsetPx = state.gapX * (state.rowOffset / 100);
  const margin = Math.max(state.gapX, state.gapY, drawWidth, drawHeight) * (state.density + 1) + state.haloSize + state.haloSoftness * 2;

  for (let y = -margin, row = 0; y < canvas.height + margin; y += state.gapY) {
    const offset = row % 2 === 0 ? 0 : rowOffsetPx;

    for (let x = -margin + offset; x < canvas.width + margin; x += state.gapX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.transform(1, skewY, skewX, 1, 0, 0);
      ctx.rotate(angle);
      drawPatternImage(tintedImage, haloSprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
    }

    row += 1;
  }
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

function downloadPng() {
  render();
  canvas.toBlob((blob) => {
    if (blob) {
      downloadFile(blob, "pattern-generator.png");
    }
  }, "image/png");
}

function downloadSvg() {
  render();
  const pngData = canvas.toDataURL("image/png");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`,
    `<image href="${pngData}" width="${canvas.width}" height="${canvas.height}" />`,
    "</svg>"
  ].join("");
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  downloadFile(blob, "pattern-generator.svg");
}

function loadImage(file) {
  if (!file.type.startsWith("image/")) {
    fileName.textContent = "The file must be an image";
    return;
  }

  if (referenceUrl) {
    URL.revokeObjectURL(referenceUrl);
  }

  referenceUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    referenceImage = image;
    fileName.textContent = file.name;
    render();
  };
  image.onerror = () => {
    referenceImage = null;
    fileName.textContent = "The image could not be loaded";
    render();
  };
  image.src = referenceUrl;
}

function clearPreview() {
  if (referenceUrl) {
    URL.revokeObjectURL(referenceUrl);
  }

  referenceImage = null;
  referenceUrl = "";
  imageInput.value = "";
  fileName.textContent = "No image selected";
  render();
}

function setDropState(isDragging) {
  canvasShell.classList.toggle("is-dragging", isDragging);
  filePicker.classList.toggle("is-dragging", isDragging);
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

function setTheme(theme) {
  document.body.dataset.theme = theme;
  licenseImage.src = "assets/license.png";
  controls.backgroundColor.value = theme === "light" ? "#f5f7fb" : "#10131b";
  render();
}

imageInput.addEventListener("change", () => {
  const [file] = imageInput.files;
  if (file) {
    loadImage(file);
  }
});

[canvasShell, filePicker].forEach((dropTarget) => {
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

window.addEventListener("resize", syncPreviewHeight);

if ("ResizeObserver" in window) {
  const panelObserver = new ResizeObserver(syncPreviewHeight);
  panelObserver.observe(controlPanel);
}

Object.values(controls).forEach((control) => {
  control.addEventListener("input", render);
});

themeSelect.addEventListener("change", () => setTheme(themeSelect.value));
document.getElementById("downloadPng").addEventListener("click", downloadPng);
document.getElementById("downloadSvg").addEventListener("click", downloadSvg);
document.getElementById("clearPreview").addEventListener("click", clearPreview);

updateLabels();
syncPreviewHeight();
render();
