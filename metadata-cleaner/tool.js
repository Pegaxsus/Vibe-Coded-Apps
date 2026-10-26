(() => {
  'use strict';
  const $=id=>document.getElementById(id), engine=window.MetadataCleaner;
  const messages={
    es:{moduleTitle:'Carga ficheros para mostrar su contenido',moduleDescription:'Esta app funciona sólo en tu navegador.',uploadPanel:'Carga de archivos',drop:'Arrastra uno o varios archivos aquí',browse:'o pulsa para explorar tu equipo',limits:'Hasta 50 MB por archivo · 200 MB por lote · 50 archivos',review:'Lista de metadatos: ',uploaded:'Archivos cargados',collapse:'Colapsar categoría',expand:'Expandir categoría',deleteDownload:'Eliminar todos los metadatos y descargar',clear:'Limpiar app',all:'Marcar todo',none:'Desmarcar todo',apply:'Aplicar categorías al lote',copy:'Se descarga una copia con la misma extensión. El original no se modifica.',download:'Limpiar las categorías marcadas',downloadBatch:'Descargar lote .zip',location:'Geolocalización',identity:'Identidad y autoría',device:'Dispositivo y software',dates:'Fechas internas',description:'Descripciones y etiquetas',preview:'Miniaturas y vistas previas',other:'Otros y bloques completos',empty:'No se han detectado metadatos eliminables en los bloques compatibles.',error:'No procesado',inspecting:'Analizando archivos…',working:'Preparando y verificando las copias…',ready:'Copia preparada. Descarga solicitada al navegador.',checked:'campos seleccionados para eliminar',found:'campos detectados',noFile:'Añade un archivo para empezar.',limit:'Se supera el límite: 50 MB por archivo, 200 MB en total o 50 archivos.',applied:'Categorías aplicadas a los archivos del lote.',failed:'No se ha descargado el lote. Revisa los archivos con errores.',verified:'Los metadatos seleccionados siguen presentes en la copia.',txt:'TXT no tiene metadatos incrustados estándar. La copia conserva exactamente su contenido y codificación. Las fechas y permisos del sistema no son accesibles aquí.',scope:'Se conserva orientación y perfil de color. XMP, IPTC y los bloques opacos se eliminan completos: pueden contener varias categorías. No se examina información visible ni esteganografía.',remove:'Quitar archivo',downloaded:'Descargado',retained:'Se conserva',noSelection:'Sin campos seleccionados: se descargará una copia idéntica.'},
    en:{moduleTitle:'Load files to show their contents',moduleDescription:'This app runs only in your browser.',uploadPanel:'Upload files',drop:'Drop one or more files here',browse:'or click to browse your computer',limits:'Up to 50 MB per file · 200 MB per batch · 50 files',review:'Metadata list: ',uploaded:'Uploaded files',collapse:'Collapse category',expand:'Expand category',deleteDownload:'Remove all metadata and download',clear:'Reset app',all:'Select all',none:'Deselect all',apply:'Apply categories to batch',copy:'Download a copy with the same extension. Your original stays unchanged.',download:'Clean selected categories',downloadBatch:'Download batch .zip',location:'Geolocation',identity:'Identity and authorship',device:'Device and software',dates:'Internal dates',description:'Descriptions and tags',preview:'Thumbnails and previews',other:'Other and whole blocks',empty:'No removable metadata found in supported blocks.',error:'Not processed',inspecting:'Inspecting files…',working:'Preparing and verifying copies…',ready:'Copy prepared. Download requested from browser.',checked:'fields selected for removal',found:'fields detected',noFile:'Add a file to start.',limit:'Limit exceeded: 50 MB per file, 200 MB total or 50 files.',applied:'Categories applied to batch files.',failed:'Batch not downloaded. Review files with errors.',verified:'Selected metadata is still present in the copy.',txt:'TXT has no standard embedded metadata. Content and encoding are preserved byte for byte. Filesystem dates and permissions are not accessible here.',scope:'Orientation and color profiles are preserved. XMP, IPTC and opaque blocks are removed as a whole and may contain several categories. Visible information and steganography are not examined.',remove:'Remove file',downloaded:'Downloaded',retained:'Preserved',noSelection:'No fields selected: the copy will be identical.'}
  };
  Object.assign(ToolShell.messages.es,messages.es);Object.assign(ToolShell.messages.en,messages.en);
  const t=k=>messages[ToolShell.language][k]||k;
  let entries=[],active=0,batch=false,busy=false;
  const size=n=>n<1024?`${n} B`:`${(n/1024/1024).toFixed(2)} MB`;
  function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
  function status(text){$('status').textContent=text;}
  function render(){
    batch=entries.length>1;
    $('picker').multiple=true;
    $('reset-bar').hidden=!entries.length;
    if(!entries.length)$('upload-panel').open=true;
    $('results').hidden=!entries.length;$('download-batch').hidden=!batch;$('apply').hidden=!batch;
    $('files').replaceChildren();entries.forEach((entry,i)=>{const row=el('div',undefined,'file-row');const button=el('button',undefined,'file-button');button.setAttribute('aria-pressed',String(i===active));button.append(el('strong',entry.file.name),el('small',size(entry.file.size)+' · '+(entry.error?t('error'):entry.parsed.format)));button.onclick=()=>{active=i;render();};button.disabled=busy;const remove=el('button','×','remove');remove.title=t('remove');remove.setAttribute('aria-label',`${t('remove')}: ${entry.file.name}`);remove.disabled=busy;remove.onclick=()=>{entries.splice(i,1);active=Math.min(active,entries.length-1);render();};row.append(button,remove);$('files').append(row);});
    $('clear').disabled=busy||!entries.length;
    const item=entries[active];if(!item)return;
    const separator=el('span','|','file-separator');separator.setAttribute('aria-hidden','true');
    $('file-heading').replaceChildren(el('h3',item.file.name),separator,el('p',item.error?t('error'):`${item.parsed.format} · ${size(item.file.size)} · ${item.parsed.fields.length} ${t('found')}`));
    $('categories').replaceChildren();$('notes').replaceChildren();
    if(item.error)$('notes').append(el('p',item.error,'error'));
    else {
      item.collapsed ||= new Set(engine.categories);
      for(const cat of engine.categories){const fields=item.parsed.fields.filter(f=>f.cat===cat);if(!fields.length)continue;
        const box=el('div',undefined,'category');
        const header=el('div',undefined,'category-header'),tick=el('input');
        tick.type='checkbox';tick.disabled=busy;
        tick.setAttribute('aria-label',`${t('all')}: ${t(cat)}`);
        tick.checked=fields.every(f=>item.selected.has(f.id));
        tick.indeterminate=!tick.checked&&fields.some(f=>item.selected.has(f.id));
        tick.onchange=()=>{for(const f of fields)tick.checked?item.selected.add(f.id):item.selected.delete(f.id);render();};
        const body=el('div',undefined,'category-fields');body.id='fields-'+cat;body.hidden=item.collapsed.has(cat);
        const toggle=el('button',undefined,'category-heading category-toggle');
        toggle.type='button';toggle.disabled=busy;
        toggle.setAttribute('aria-expanded',String(!body.hidden));toggle.setAttribute('aria-controls',body.id);
        toggle.setAttribute('aria-label',`${t(body.hidden?'expand':'collapse')}: ${t(cat)}`);
        toggle.title=t(body.hidden?'expand':'collapse');
        const arrow=el('span',body.hidden?'▸':'▾','category-arrow');arrow.setAttribute('aria-hidden','true');
        toggle.append(el('strong',t(cat)),el('span',String(fields.length),'count'),arrow);
        toggle.onclick=()=>{body.hidden?item.collapsed.delete(cat):item.collapsed.add(cat);render();};
        header.append(tick,toggle);box.append(header,body);
        for(const f of fields){const line=el('label',undefined,'field'),check=el('input');check.type='checkbox';check.disabled=busy;check.checked=item.selected.has(f.id);check.onchange=()=>{check.checked?item.selected.add(f.id):item.selected.delete(f.id);render();};const content=el('span');content.append(el('strong',f.label),el('small',f.value));line.append(check,content);body.append(line);}$('categories').append(box);
      }
      if(!item.parsed.fields.length)$('categories').append(el('div',t('empty'),'empty'));
      $('notes').append(el('p',t(item.parsed.format==='TXT'?'txt':'scope')));
    }
    $('selection-summary').textContent=item.error?t('error'):`${item.selected.size} ${t('checked')}`;
    $('delete-download').disabled=busy||(batch?entries.some(e=>e.error):!!item.error);$('download-one').disabled=busy||!!item.error;$('download-batch').disabled=busy||entries.some(e=>e.error);for(const id of ['all','none','apply','clear'])$(id).disabled=busy;
  }
  async function add(files){if(busy)return;const incoming=[...files];if(!incoming.length)return;
    const current=entries;if(current.length+incoming.length>50||incoming.some(f=>f.size>50*1024*1024)||[...current.map(e=>e.file),...incoming].reduce((n,f)=>n+f.size,0)>200*1024*1024){status(t('limit'));return;}
    busy=true;status(t('inspecting'));render();
    for(const file of incoming){try{const bytes=new Uint8Array(await file.arrayBuffer()),parsed=engine.inspect(bytes,file.name);entries.push({file,bytes,parsed,selected:new Set(),error:null});}catch(e){entries.push({file,error:e.message,selected:new Set()});}await new Promise(r=>setTimeout(r,0));}
    active=Math.max(0,entries.length-incoming.length);if(entries.some(e=>e.parsed))$('upload-panel').open=false;busy=false;status('');render();
  }
  function download(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  function copyName(name){const dot=name.lastIndexOf('.');return dot>0?name.slice(0,dot)+'-clean'+name.slice(dot):name+'-clean';}
  function prepare(entry){const bytes=entry.parsed.clean(entry.selected);const check=engine.inspect(bytes,entry.file.name);
    // Reinspect labels and values as IDs change when EXIF directories shrink.
    const remaining=new Map();for(const f of check.fields){const key=f.cat+'\0'+f.label+'\0'+f.value;remaining.set(key,(remaining.get(key)||0)+1);}
    const retained=new Map();for(const f of entry.parsed.fields.filter(f=>!entry.selected.has(f.id))){const key=f.cat+'\0'+f.label+'\0'+f.value;retained.set(key,(retained.get(key)||0)+1);}
    if(remaining.size!==retained.size||[...remaining].some(([key,n])=>retained.get(key)!==n))throw Error(t('verified'));
    return bytes;
  }
  async function exportFiles(all,removeAll=false){if(busy)return;busy=true;status(t('working'));render();await new Promise(r=>setTimeout(r,20));try{
    const chosen=all?entries:[entries[active]];if(chosen.some(e=>e.error))throw Error(t('failed'));
    const outputs=chosen.map((e,i)=>({name:(all?String(i+1).padStart(2,'0')+'-':'')+copyName(e.file.name),bytes:prepare(removeAll?{...e,selected:new Set(e.parsed.fields.map(f=>f.id))}:e)}));
    if(all)download(zip(outputs),'metadata-cleaner.zip','application/zip');else download(outputs[0].bytes,outputs[0].name,entries[active].file.type||'application/octet-stream');status(t('ready'));
  }catch(e){status(e.message);}finally{busy=false;render();}}
  // ZIP STORE: files keep their exact cleaned bytes; UTF-8 names and neutral dates.
  function zip(files){const local=[],central=[];let offset=0;for(const f of files){const name=new TextEncoder().encode(f.name),crc=engine.crc32(f.bytes),head=new Uint8Array(30+name.length),v=new DataView(head.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,f.bytes.length,true);v.setUint32(22,f.bytes.length,true);v.setUint16(26,name.length,true);head.set(name,30);local.push(head,f.bytes);const c=new Uint8Array(46+name.length),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,f.bytes.length,true);cv.setUint32(24,f.bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);c.set(name,46);central.push(c);offset+=head.length+f.bytes.length;}
    const directory=engine.concat(central),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,directory.length,true);ev.setUint32(16,offset,true);return engine.concat([...local,directory,end]);}
  $('drop').onclick=()=>{if(!busy)$('picker').click();};$('picker').onchange=e=>{add(e.target.files);e.target.value='';};
  for(const event of ['dragenter','dragover'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.add('dragging');});
  for(const event of ['dragleave','drop'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.remove('dragging');if(event==='drop')add(e.dataTransfer.files);});
  $('clear').onclick=()=>{if(busy)return;entries=[];active=0;$('picker').value='';for(const id of ['categories','file-heading','notes'])$(id).replaceChildren();$('selection-summary').textContent='';status('');render();};$('all').onclick=()=>{const e=entries[active];if(e?.parsed)e.selected=new Set(e.parsed.fields.map(f=>f.id));render();};$('none').onclick=()=>{entries[active]?.selected.clear();render();};
  $('apply').onclick=()=>{const source=entries[active];if(!source?.parsed)return;const cats=new Set(source.parsed.fields.filter(f=>source.selected.has(f.id)).map(f=>f.cat));for(const e of entries)if(e.parsed)e.selected=new Set(e.parsed.fields.filter(f=>cats.has(f.cat)).map(f=>f.id));status(t('applied'));render();};
  $('delete-download').onclick=()=>exportFiles(batch,true);
  $('download-one').onclick=()=>exportFiles(false);$('download-batch').onclick=()=>exportFiles(true);
  document.addEventListener('tool:languagechange',()=>{render();status('');});render();ToolShell.setLanguage(ToolShell.language);
  window.CleanerApp={zip};
})();
