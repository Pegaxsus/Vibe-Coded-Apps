const canvas = document.getElementById("qrCanvas");
const ctx = canvas.getContext("2d");
const emptyState = document.getElementById("emptyState");
const controls = {
  theme: document.getElementById("themeSelect"),
  url: document.getElementById("urlInput"),
  ecc: document.getElementById("eccLevel"),
  size: document.getElementById("qrSize"),
  margin: document.getElementById("quietZone"),
  foreground: document.getElementById("foregroundColor"),
  background: document.getElementById("backgroundColor"),
  transparent: document.getElementById("transparentBg")
};
const outputs = {
  ecc: document.getElementById("eccValue"),
  size: document.getElementById("sizeValue"),
  margin: document.getElementById("marginValue"),
  status: document.getElementById("statusText")
};

const eccNames = { L: "Baja", M: "Media", Q: "Alta", H: "Muy alta" };
const eccBits = { L: 1, M: 0, Q: 3, H: 2 };
const defaultForeground = "#111111";
const defaultBackground = "#ffffff";
const alignmentPatternPositions = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50]
];
const rsBlocks = {
  L: [
    null, [1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80], [1, 134, 108],
    [2, 86, 68], [2, 98, 78], [2, 121, 97], [2, 146, 116], [2, 86, 68, 2, 87, 69]
  ],
  M: [
    null, [1, 26, 16], [1, 44, 28], [1, 70, 44], [2, 50, 32], [2, 67, 43],
    [4, 43, 27], [4, 49, 31], [2, 60, 38, 2, 61, 39], [3, 58, 36, 2, 59, 37], [4, 69, 43, 1, 70, 44]
  ],
  Q: [
    null, [1, 26, 13], [1, 44, 22], [2, 35, 17], [2, 50, 24], [2, 33, 15, 2, 34, 16],
    [4, 43, 19], [2, 32, 14, 4, 33, 15], [4, 40, 18, 2, 41, 19], [4, 36, 16, 4, 37, 17], [6, 43, 19, 2, 44, 20]
  ],
  H: [
    null, [1, 26, 9], [1, 44, 16], [2, 35, 13], [4, 25, 9], [2, 33, 11, 2, 34, 12],
    [4, 43, 15], [4, 39, 13, 1, 40, 14], [4, 40, 14, 2, 41, 15], [4, 36, 12, 4, 37, 13], [6, 43, 15, 2, 44, 16]
  ]
};

const gfExp = new Array(512);
const gfLog = new Array(256);
let gfValue = 1;
for (let i = 0; i < 255; i += 1) {
  gfExp[i] = gfValue;
  gfLog[gfValue] = i;
  gfValue <<= 1;
  if (gfValue & 0x100) {
    gfValue ^= 0x11d;
  }
}
for (let i = 255; i < 512; i += 1) {
  gfExp[i] = gfExp[i - 255];
}

let currentQr = null;

function gfMul(a, b) {
  return a === 0 || b === 0 ? 0 : gfExp[gfLog[a] + gfLog[b]];
}

function makeGenerator(degree) {
  const poly = new Array(degree).fill(0);
  poly[degree - 1] = 1;
  let root = 1;

  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      poly[j] = gfMul(poly[j], root);

      if (j + 1 < degree) {
        poly[j] ^= poly[j + 1];
      }
    }

    root = gfMul(root, 2);
  }

  return poly;
}

function reedSolomon(data, degree) {
  const generator = makeGenerator(degree);
  const result = new Array(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);
    generator.forEach((coefficient, index) => {
      result[index] ^= gfMul(coefficient, factor);
    });
  });
  return result;
}

function parseBlocks(ecc, version) {
  const spec = rsBlocks[ecc][version];
  const blocks = [];
  for (let i = 0; i < spec.length; i += 3) {
    for (let count = 0; count < spec[i]; count += 1) {
      blocks.push({ total: spec[i + 1], data: spec[i + 2] });
    }
  }
  return blocks;
}

function dataCapacity(ecc, version) {
  return parseBlocks(ecc, version).reduce((sum, block) => sum + block.data, 0);
}

function appendBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push(value >>> i & 1);
  }
}

function bitsToBytes(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) {
      byte = byte << 1 | (bits[i + j] || 0);
    }
    bytes.push(byte);
  }
  return bytes;
}

function chooseVersion(byteLength, ecc) {
  for (let version = 1; version <= 10; version += 1) {
    const charCountBits = version < 10 ? 8 : 16;
    const bitLength = 4 + charCountBits + byteLength * 8;
    if (Math.ceil(bitLength / 8) <= dataCapacity(ecc, version)) {
      return version;
    }
  }
  throw new Error("La URL es demasiado larga para esta version. Acortala o baja la correccion.");
}

function makeDataCodewords(text, ecc, version) {
  const data = [...new TextEncoder().encode(text)];
  const capacity = dataCapacity(ecc, version);
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, data.length, version < 10 ? 8 : 16);
  data.forEach((byte) => appendBits(bits, byte, 8));

  const maxBits = capacity * 8;
  appendBits(bits, 0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords = bitsToBytes(bits);
  for (let pad = 0; codewords.length < capacity; pad += 1) {
    codewords.push(pad % 2 === 0 ? 0xec : 0x11);
  }
  return codewords;
}

function makeCodewords(text, ecc, version) {
  const dataCodewords = makeDataCodewords(text, ecc, version);
  const blocks = parseBlocks(ecc, version);
  const dataBlocks = [];
  const eccBlocks = [];
  let offset = 0;

  blocks.forEach((block) => {
    const data = dataCodewords.slice(offset, offset + block.data);
    offset += block.data;
    dataBlocks.push(data);
    eccBlocks.push(reedSolomon(data, block.total - block.data));
  });

  const result = [];
  const maxData = Math.max(...dataBlocks.map((block) => block.length));
  const maxEcc = Math.max(...eccBlocks.map((block) => block.length));
  for (let i = 0; i < maxData; i += 1) {
    dataBlocks.forEach((block) => {
      if (i < block.length) {
        result.push(block[i]);
      }
    });
  }
  for (let i = 0; i < maxEcc; i += 1) {
    eccBlocks.forEach((block) => {
      if (i < block.length) {
        result.push(block[i]);
      }
    });
  }
  return result;
}

function makeMatrix(size) {
  return {
    size,
    modules: Array.from({ length: size }, () => new Array(size).fill(false)),
    reserved: Array.from({ length: size }, () => new Array(size).fill(false))
  };
}

function setModule(matrix, row, col, value, reserve = true) {
  if (row < 0 || col < 0 || row >= matrix.size || col >= matrix.size) {
    return;
  }
  matrix.modules[row][col] = Boolean(value);
  if (reserve) {
    matrix.reserved[row][col] = true;
  }
}

function drawFinder(matrix, row, col) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const dark = x >= 0 && x <= 6 && y >= 0 && y <= 6 &&
        (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
      setModule(matrix, row + y, col + x, dark);
    }
  }
}

function drawAlignment(matrix, row, col) {
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      setModule(matrix, row + y, col + x, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    }
  }
}

function getVersionBits(version) {
  let bits = version << 12;
  for (let i = 17; i >= 12; i -= 1) {
    if ((bits >>> i & 1) !== 0) {
      bits ^= 0x1f25 << (i - 12);
    }
  }
  return version << 12 | bits;
}

function drawFunctionPatterns(matrix, version) {
  const size = matrix.size;
  drawFinder(matrix, 0, 0);
  drawFinder(matrix, 0, size - 7);
  drawFinder(matrix, size - 7, 0);

  for (let i = 8; i < size - 8; i += 1) {
    setModule(matrix, 6, i, i % 2 === 0);
    setModule(matrix, i, 6, i % 2 === 0);
  }

  alignmentPatternPositions[version].forEach((row) => {
    alignmentPatternPositions[version].forEach((col) => {
      const topLeft = row === 6 && col === 6;
      const topRight = row === 6 && col === size - 7;
      const bottomLeft = row === size - 7 && col === 6;
      if (!topLeft && !topRight && !bottomLeft) {
        drawAlignment(matrix, row, col);
      }
    });
  });

  setModule(matrix, size - 8, 8, true);
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      matrix.reserved[8][i] = true;
      matrix.reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i += 1) {
    matrix.reserved[8][size - 1 - i] = true;
    matrix.reserved[size - 1 - i][8] = true;
  }

  if (version >= 7) {
    const bits = getVersionBits(version);
    for (let i = 0; i < 18; i += 1) {
      const bit = bits >>> i & 1;
      const a = Math.floor(i / 3);
      const b = i % 3;
      setModule(matrix, a, size - 11 + b, bit);
      setModule(matrix, size - 11 + b, a, bit);
    }
  }
}

function placeData(matrix, codewords) {
  const bits = [];
  codewords.forEach((byte) => appendBits(bits, byte, 8));
  let bitIndex = 0;
  let direction = -1;

  for (let col = matrix.size - 1; col > 0; col -= 2) {
    if (col === 6) {
      col -= 1;
    }
    for (let step = 0; step < matrix.size; step += 1) {
      const row = direction === -1 ? matrix.size - 1 - step : step;
      for (let offset = 0; offset < 2; offset += 1) {
        const c = col - offset;
        if (!matrix.reserved[row][c]) {
          matrix.modules[row][c] = Boolean(bits[bitIndex] || 0);
          bitIndex += 1;
        }
      }
    }
    direction *= -1;
  }
}

function maskBit(mask, row, col) {
  switch (mask) {
    case 0: return (row + col) % 2 === 0;
    case 1: return row % 2 === 0;
    case 2: return col % 3 === 0;
    case 3: return (row + col) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5: return row * col % 2 + row * col % 3 === 0;
    case 6: return (row * col % 2 + row * col % 3) % 2 === 0;
    case 7: return ((row + col) % 2 + row * col % 3) % 2 === 0;
    default: return false;
  }
}

function applyMask(matrix, mask) {
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!matrix.reserved[row][col] && maskBit(mask, row, col)) {
        matrix.modules[row][col] = !matrix.modules[row][col];
      }
    }
  }
}

function getFormatBits(ecc, mask) {
  const data = eccBits[ecc] << 3 | mask;
  let bits = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((bits >>> i & 1) !== 0) {
      bits ^= 0x537 << (i - 10);
    }
  }
  return ((data << 10) | bits) ^ 0x5412;
}

function drawFormatBits(matrix, ecc, mask) {
  const bits = getFormatBits(ecc, mask);
  const size = matrix.size;

  for (let i = 0; i < 15; i += 1) {
    const bit = bits >>> i & 1;

    if (i < 6) {
      setModule(matrix, i, 8, bit);
    } else if (i < 8) {
      setModule(matrix, i + 1, 8, bit);
    } else {
      setModule(matrix, size - 15 + i, 8, bit);
    }

    if (i < 8) {
      setModule(matrix, 8, size - i - 1, bit);
    } else if (i < 9) {
      setModule(matrix, 8, 15 - i, bit);
    } else {
      setModule(matrix, 8, 14 - i, bit);
    }
  }

  setModule(matrix, size - 8, 8, true);
}

function matchesPattern(values, pattern) {
  return values.every((value, index) => value === pattern[index]);
}

function penalty(matrix) {
  const size = matrix.size;
  let score = 0;

  for (let row = 0; row < size; row += 1) {
    let runColor = matrix.modules[row][0];
    let runLength = 1;
    for (let col = 1; col < size; col += 1) {
      if (matrix.modules[row][col] === runColor) {
        runLength += 1;
      } else {
        if (runLength >= 5) score += runLength - 2;
        runColor = matrix.modules[row][col];
        runLength = 1;
      }
    }
    if (runLength >= 5) score += runLength - 2;
  }

  for (let col = 0; col < size; col += 1) {
    let runColor = matrix.modules[0][col];
    let runLength = 1;
    for (let row = 1; row < size; row += 1) {
      if (matrix.modules[row][col] === runColor) {
        runLength += 1;
      } else {
        if (runLength >= 5) score += runLength - 2;
        runColor = matrix.modules[row][col];
        runLength = 1;
      }
    }
    if (runLength >= 5) score += runLength - 2;
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let col = 0; col < size - 1; col += 1) {
      const color = matrix.modules[row][col];
      if (color === matrix.modules[row][col + 1] && color === matrix.modules[row + 1][col] && color === matrix.modules[row + 1][col + 1]) {
        score += 3;
      }
    }
  }

  const finderPattern = [true, false, true, true, true, false, true, false, false, false, false];
  const reverseFinderPattern = [...finderPattern].reverse();
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col <= size - 11; col += 1) {
      const slice = matrix.modules[row].slice(col, col + 11);
      if (matchesPattern(slice, finderPattern) || matchesPattern(slice, reverseFinderPattern)) score += 40;
    }
  }
  for (let col = 0; col < size; col += 1) {
    for (let row = 0; row <= size - 11; row += 1) {
      const slice = [];
      for (let i = 0; i < 11; i += 1) slice.push(matrix.modules[row + i][col]);
      if (matchesPattern(slice, finderPattern) || matchesPattern(slice, reverseFinderPattern)) score += 40;
    }
  }

  const dark = matrix.modules.flat().filter(Boolean).length;
  score += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  return score;
}

function cloneMatrix(matrix) {
  return {
    size: matrix.size,
    modules: matrix.modules.map((row) => row.slice()),
    reserved: matrix.reserved.map((row) => row.slice())
  };
}

function createQr(text, ecc) {
  const bytes = [...new TextEncoder().encode(text)];
  const version = chooseVersion(bytes.length, ecc);
  const size = version * 4 + 17;
  const codewords = makeCodewords(text, ecc, version);
  const base = makeMatrix(size);
  drawFunctionPatterns(base, version);
  placeData(base, codewords);

  let best = null;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = cloneMatrix(base);
    applyMask(candidate, mask);
    drawFormatBits(candidate, ecc, mask);
    const score = penalty(candidate);
    if (!best || score < best.score) {
      best = { matrix: candidate, score };
    }
  }

  return { ...best.matrix, version };
}

function normalizeUrl(value) {
  return value.trim();
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return {
    r: value >> 16 & 255,
    g: value >> 8 & 255,
    b: value & 255
  };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getScanWarning() {
  if (controls.transparent.checked) {
    return " Usa fondo blanco opaco para que la camara lo detecte mejor.";
  }

  const foregroundLuminance = luminance(controls.foreground.value);
  const backgroundLuminance = luminance(controls.background.value);

  if (foregroundLuminance >= backgroundLuminance) {
    return " Para camaras, usa QR oscuro sobre fondo claro.";
  }

  if (Math.abs(foregroundLuminance - backgroundLuminance) < 125) {
    return " Aumenta el contraste para mejorar la lectura.";
  }

  return "";
}

function updateLabels() {
  outputs.ecc.textContent = eccNames[controls.ecc.value];
  outputs.size.textContent = `${controls.size.value} px`;
  outputs.margin.textContent = `${controls.margin.value} modulos`;
}

function drawPlaceholder() {
  canvas.width = Number(controls.size.value);
  canvas.height = Number(controls.size.value);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = controls.background.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderQr(qr) {
  const requestedSize = Number(controls.size.value);
  const margin = Number(controls.margin.value);
  const totalModules = qr.size + margin * 2;
  const moduleSize = Math.max(1, Math.floor(requestedSize / totalModules));
  const imageSize = moduleSize * totalModules;
  canvas.width = imageSize;
  canvas.height = imageSize;

  ctx.clearRect(0, 0, imageSize, imageSize);
  if (!controls.transparent.checked) {
    ctx.fillStyle = controls.background.value;
    ctx.fillRect(0, 0, imageSize, imageSize);
  }

  ctx.fillStyle = controls.foreground.value;
  for (let row = 0; row < qr.size; row += 1) {
    for (let col = 0; col < qr.size; col += 1) {
      if (qr.modules[row][col]) {
        ctx.fillRect((col + margin) * moduleSize, (row + margin) * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

function render() {
  updateLabels();
  const payload = normalizeUrl(controls.url.value);
  emptyState.classList.toggle("is-hidden", Boolean(payload));

  if (!payload) {
    currentQr = null;
    outputs.status.textContent = "Introduce una URL o texto para generar el QR.";
    drawPlaceholder();
    return;
  }

  try {
    currentQr = createQr(payload, controls.ecc.value);
    renderQr(currentQr);
    outputs.status.textContent = `QR generado localmente. Version ${currentQr.version}, ${currentQr.size} x ${currentQr.size} modulos.${getScanWarning()}`;
  } catch (error) {
    currentQr = null;
    outputs.status.textContent = error.message;
    drawPlaceholder();
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
  if (!currentQr) {
    return;
  }
  canvas.toBlob((blob) => {
    if (blob) {
      downloadFile(blob, "codigo-qr.png");
    }
  }, "image/png");
}

function downloadSvg() {
  render();
  if (!currentQr) {
    return;
  }

  const margin = Number(controls.margin.value);
  const totalModules = currentQr.size + margin * 2;
  const background = controls.transparent.checked ? "" : `<rect width="100%" height="100%" fill="${controls.background.value}"/>`;
  const rects = [];

  for (let row = 0; row < currentQr.size; row += 1) {
    for (let col = 0; col < currentQr.size; col += 1) {
      if (currentQr.modules[row][col]) {
        rects.push(`<rect x="${col + margin}" y="${row + margin}" width="1" height="1"/>`);
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges">${background}<g fill="${controls.foreground.value}">${rects.join("")}</g></svg>`;
  downloadFile(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "codigo-qr.svg");
}

function clearQr() {
  controls.url.value = "";
  render();
  controls.url.focus();
}

controls.theme.addEventListener("change", () => {
  document.body.dataset.theme = controls.theme.value;
  render();
});

[controls.url, controls.ecc, controls.size, controls.margin, controls.foreground, controls.background, controls.transparent].forEach((control) => {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
});

document.getElementById("downloadPng").addEventListener("click", downloadPng);
document.getElementById("downloadSvg").addEventListener("click", downloadSvg);
document.getElementById("clearQr").addEventListener("click", clearQr);

controls.foreground.value = defaultForeground;
controls.background.value = defaultBackground;
controls.url.value = "https://mimomakers.com";
render();
