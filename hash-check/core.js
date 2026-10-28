/* Shared pure helpers: also exercised by node --test. */
(function (root) {
  const algorithms = ['SHA-256', 'SHA-384', 'SHA-512'];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function compare(a, b) {
    if (!a || !b || a.status !== 'ready' || b.status !== 'ready' || a.algorithm !== b.algorithm) return null;
    return a.file.size === b.file.size && a.hash === b.hash;
  }
  function report(a, b, now = new Date()) {
    const matches = compare(a, b);
    if (matches === null) throw new Error('La comparación aún no está lista.');
    return {
      application: 'Hash Check', checkedAt: now.toISOString(), algorithm: a.algorithm,
      matches, result: matches ? 'Contenido coincidente' : 'Contenido diferente',
      method: 'Comparación del tamaño en bytes y del hash de todo el contenido. No se realiza una comparación byte a byte.',
      files: [a, b].map((item, i) => ({slot: i ? 'B' : 'A', name: item.file.name, sizeBytes: item.file.size,
        type: item.file.type || 'No especificado', lastModified: new Date(item.file.lastModified).toISOString(), hash: item.hash})),
      note: 'Un hash coincidente aporta una evidencia muy sólida de igualdad, aunque no constituye una garantía matemática. Este informe se genera localmente y no tiene firma digital.'
    };
  }
  function asText(data) {
    return ['HASH CHECK — INFORME DE COMPROBACIÓN', '', `Resultado: ${data.result}`, `Fecha (UTC): ${data.checkedAt}`, `Algoritmo: ${data.algorithm}`, '', ...data.files.flatMap(f => [`Archivo ${f.slot}: ${f.name}`, `Tamaño: ${f.sizeBytes} bytes`, `Tipo: ${f.type}`, `Última modificación (UTC): ${f.lastModified}`, `Hash: ${f.hash}`, '']), data.method, '', data.note].join('\n');
  }
  function asHtml(data) {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Hash Check · Informe</title><style>body{font:15px system-ui,sans-serif;color:#172033;max-width:900px;margin:48px auto;padding:0 28px}h1{font-size:34px}h2{font-size:20px;overflow-wrap:anywhere}.result{padding:20px;border:1px solid ${data.matches ? '#22815c' : '#c0513d'};border-radius:8px}section{margin:28px 0}dt{font-weight:700;margin-top:12px}dd{margin:4px 0;overflow-wrap:anywhere}code{font-size:13px}footer{border-top:1px solid #ccd2dc;padding-top:16px;color:#536177;font-size:12px}@media print{body{margin:0;max-width:none}section{break-inside:avoid}}</style></head><body><p>VERIFICACIÓN LOCAL DE ARCHIVOS</p><h1>Hash Check</h1><div class="result"><strong>${escape(data.result)}</strong><p>Algoritmo: ${escape(data.algorithm)} · Tamaño y hash ${data.matches ? 'coincidentes' : 'no coincidentes'}</p></div><p>Fecha de comprobación (UTC): ${escape(data.checkedAt)}</p>${data.files.map(f => `<section><h2>Archivo ${f.slot} · ${escape(f.name)}</h2><dl><dt>Tamaño</dt><dd>${f.sizeBytes} bytes</dd><dt>Tipo</dt><dd>${escape(f.type)}</dd><dt>Última modificación (UTC)</dt><dd>${escape(f.lastModified)}</dd><dt>${escape(data.algorithm)}</dt><dd><code>${escape(f.hash)}</code></dd></dl></section>`).join('')}<footer><p>${escape(data.method)}</p><p>${escape(data.note)}</p><p>Usa la opción Imprimir de tu navegador para guardar este informe como PDF.</p></footer></body></html>`;
  }
  root.HashCheck = {algorithms, compare, report, asText, asHtml};
})(globalThis);
