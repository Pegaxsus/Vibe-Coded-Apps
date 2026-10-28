const $ = id => document.getElementById(id);
const slots = [null, null];
const jobs = [null, null];
const versions = [0, 0];
const maxSize = 256 * 1024 * 1024;
const workerSource = `onmessage = async ({data}) => {
  try {
    const buffer = await data.file.arrayBuffer();
    postMessage({stage: 'hashing'});
    const digest = await crypto.subtle.digest(data.algorithm, buffer);
    postMessage({hash: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')});
  } catch (error) { postMessage({error: error.message}); }
};`;
const workerURL = URL.createObjectURL(new Blob([workerSource], {type: 'text/javascript'}));
const bytes = value => `${new Intl.NumberFormat('es-ES').format(value)} bytes`;
const readableSize = value => value < 1024 ? bytes(value) : `${new Intl.NumberFormat('es-ES', {maximumFractionDigits: 2}).format(value / (value < 1048576 ? 1024 : 1048576))} ${value < 1048576 ? 'KiB' : 'MiB'}`;

for (let i = 0; i < 2; i++) {
  const letter = i ? 'B' : 'A';
  const card = document.createElement('article');
  card.className = 'file-card';
  card.innerHTML = `<div class="card-heading"><span class="slot-letter">${letter}</span><h3>Archivo ${letter}</h3><span class="file-state" id="state${i}">Sin archivo</span></div>
    <input id="input${i}" class="visually-hidden" type="file" tabindex="-1" aria-label="Seleccionar archivo ${letter}">
    <button class="drop-zone" id="drop${i}" aria-label="Seleccionar o reemplazar archivo ${letter}"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-7m-3 3 3-3 3 3"/></svg><strong id="name${i}">Arrastra aquí tu archivo</strong><span id="hint${i}">o pulsa para seleccionarlo</span><span class="file-limit">Cualquier formato · máximo 256 MiB</span></button>
    <div class="file-details" id="details${i}" hidden></div><div class="hash-block"><div class="hash-heading"><span id="hashLabel${i}">SHA-256</span><button class="copy-button" id="copy${i}" disabled aria-label="Copiar hash del archivo ${letter}">Copiar</button></div><code class="hash-value" id="hash${i}">El hash aparecerá aquí</code></div>`;
  $('fileGrid').append(card);
  const input = $(`input${i}`), drop = $(`drop${i}`);
  drop.onclick = () => input.click();
  input.onchange = () => { if (input.files[0]) loadFile(i, input.files[0]); input.value = ''; };
  let depth = 0;
  drop.addEventListener('dragenter', e => { e.preventDefault(); depth++; drop.classList.add('dragging'); });
  drop.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  drop.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; drop.classList.remove('dragging'); } });
  drop.addEventListener('drop', e => {
    e.preventDefault(); depth = 0; drop.classList.remove('dragging');
    if (e.dataTransfer.files.length !== 1) { $('notice').textContent = 'Arrastra un único archivo en cada espacio.'; return; }
    loadFile(i, e.dataTransfer.files[0]);
  });
  $(`copy${i}`).onclick = async () => {
    try { await navigator.clipboard.writeText(slots[i].hash); $('notice').textContent = `Hash del archivo ${letter} copiado.`; }
    catch { $('notice').textContent = 'No se pudo acceder al portapapeles. Puedes seleccionar y copiar el hash manualmente.'; }
  };
}
// Prevent an accidental drop outside the targets from navigating away.
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());

function cancel(i) { versions[i]++; jobs[i]?.terminate(); jobs[i] = null; }
function clear(i) { cancel(i); slots[i] = null; $(`input${i}`).value = ''; $('notice').textContent = ''; render(); }
function loadFile(i, file) {
  if (file.size > maxSize) { $('notice').textContent = `El archivo «${file.name}» supera el límite de 256 MiB. Selecciona uno más pequeño.`; return; }
  cancel(i);
  const version = versions[i], algorithm = $('algorithm').value;
  const item = slots[i] = {file, algorithm, status: 'reading', hash: ''};
  $('notice').textContent = '';
  render();
  function fail() {
    if (versions[i] !== version) return;
    item.status = 'error'; jobs[i]?.terminate(); jobs[i] = null; render();
  }
  if (!globalThis.crypto?.subtle) { fail(); $('notice').textContent = 'El cálculo requiere un navegador compatible y abrir la web desde un archivo local, localhost o HTTPS.'; return; }
  try {
    const worker = jobs[i] = new Worker(workerURL);
    worker.onmessage = ({data}) => {
      if (versions[i] !== version) return;
      if (data.error) { fail(); return; }
      if (data.stage) item.status = 'hashing';
      else { item.hash = data.hash; item.status = 'ready'; worker.terminate(); jobs[i] = null; }
      render();
    };
    worker.onerror = fail;
    worker.postMessage({file, algorithm});
  } catch { fail(); }
}
function render() {
  slots.forEach((item, i) => {
    const ready = item?.status === 'ready', busy = item && ['reading', 'hashing'].includes(item.status);
    $(`state${i}`).textContent = !item ? 'Sin archivo' : ({reading: 'Leyendo…', hashing: 'Calculando…', ready: 'Calculado', error: 'Error'})[item.status];
    $(`state${i}`).dataset.state = item?.status || 'empty';
    $(`name${i}`).textContent = item?.file.name || 'Arrastra aquí tu archivo';
    $(`hint${i}`).textContent = item ? 'Pulsa o arrastra otro archivo para reemplazarlo' : 'o pulsa para seleccionarlo';
    $(`details${i}`).hidden = !item;
    $(`details${i}`).textContent = item ? `${readableSize(item.file.size)} · ${bytes(item.file.size)}` : '';
    $(`hashLabel${i}`).textContent = $('algorithm').value;
    $(`hash${i}`).textContent = ready ? item.hash : busy ? (item.status === 'reading' ? 'Leyendo el archivo…' : 'Calculando el hash…') : item ? 'No se pudo calcular. Vuelve a seleccionar el archivo.' : 'El hash aparecerá aquí';
    $(`hash${i}`).classList.toggle('pending', Boolean(busy));
    $(`copy${i}`).disabled = !ready;
    $(i ? 'clearB' : 'clearA').disabled = !item;
  });
  $('clearAll').disabled = !slots.some(Boolean);
  const result = HashCheck.compare(...slots), both = slots.every(Boolean);
  $('exportReport').disabled = result === null;
  $('comparison').hidden = !both;
  $('guide').hidden = both;
  if (both) {
    const box = $('comparison');
    box.dataset.result = result === null ? 'pending' : result ? 'match' : 'different';
    const title = result === null ? (slots.some(s => s.status === 'error') ? 'No se ha podido completar la comparación' : 'Comprobando los archivos…') : result ? 'Los archivos tienen el mismo contenido' : 'Los archivos son diferentes';
    const detail = result === null ? 'Los dos hashes deben estar calculados para obtener un resultado.' : result ? `El tamaño y el hash ${$('algorithm').value} coinciden. El nombre y la fecha del archivo no afectan a la comparación.` : `El tamaño o el hash ${$('algorithm').value} no coinciden. El contenido de los archivos es distinto.`;
    box.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = title;
    const paragraph = document.createElement('p'); paragraph.textContent = detail;
    box.append(heading, paragraph);
  }
}
$('algorithm').onchange = () => { $('algorithmBadge').textContent = $('algorithm').value; slots.forEach((item, i) => { if (item) loadFile(i, item.file); }); render(); };
$('clearA').onclick = () => clear(0);
$('clearB').onclick = () => clear(1);
$('clearAll').onclick = () => { clear(0); clear(1); };
$('exportReport').onclick = () => {
  if (HashCheck.compare(...slots) === null) return;
  const data = HashCheck.report(...slots), format = $('reportFormat').value;
  const content = format === 'html' ? HashCheck.asHtml(data) : format === 'txt' ? HashCheck.asText(data) : JSON.stringify(data, null, 2);
  const type = {html: 'text/html', txt: 'text/plain', json: 'application/json'}[format];
  const url = URL.createObjectURL(new Blob([content], {type: `${type};charset=utf-8`}));
  const link = document.createElement('a'); link.href = url; link.download = `hash-check-${data.checkedAt.replace(/[:.]/g, '-')}.${format}`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  $('notice').textContent = 'Descarga del informe solicitada. Revisa las descargas de tu navegador.';
};
$('themeSelect').onchange = () => { document.body.dataset.theme = $('themeSelect').value; try { localStorage.setItem('hash-check-theme', $('themeSelect').value); } catch {} };
try { const saved = localStorage.getItem('hash-check-theme'); if (['light', 'dark'].includes(saved)) { $('themeSelect').value = saved; document.body.dataset.theme = saved; } } catch {}
render();
