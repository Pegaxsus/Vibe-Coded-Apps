// Interaction smoke checks using the actual handlers and metadata engine.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('./metadata.js');
class Element {
  constructor(){this.children=[];this.attributes={};this.classList={add(){},remove(){}};}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(k,v){this.attributes[k]=v;}
  querySelector(){return new Element();}
  addEventListener(){}
  click(){this.onclick?.();}
  remove(){}
}
const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
let downloaded;
const context={window:{MetadataCleaner:M},document:{getElementById:get,createElement:()=>new Element(),body:new Element(),addEventListener(){}},ToolShell:{messages:{es:{},en:{}},language:'es',setLanguage(){}},TextEncoder,Uint8Array,DataView,Set,Map,Blob,URL:{createObjectURL(blob){downloaded=blob;return 'blob:test';},revokeObjectURL(){}},setTimeout(fn,ms){if(ms<60000)return setTimeout(fn,ms);},console};
vm.runInNewContext(fs.readFileSync(__dirname+'/tool.js','utf8'),context);
const bytes=fs.readFileSync(__dirname+'/test-output/fixture.jpg');
const file={name:'fixture.jpg',size:bytes.length,type:'image/jpeg',async arrayBuffer(){return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);}};
const flush=()=>new Promise(r=>setTimeout(r,50));
(async()=>{
 assert.equal(get('reset-bar').hidden,true,'reset is hidden before loading any file');
 assert.equal(get('picker').multiple,true);
 get('picker').onchange({target:{files:[file],value:''}});await flush();
 assert.equal(get('reset-bar').hidden,false);
 assert.equal(get('download-batch').hidden,true,'one file offers individual download');
 assert.equal(get('upload-panel').open,false,'successful upload collapses the upload panel');
 let box=get('categories').children[0];assert.ok(get('categories').children.every(category=>category.children[1].hidden),'all categories start collapsed');
 assert.equal(get('file-heading').children[1].textContent,'|');
 box.children[0].children[1].onclick();box=get('categories').children[0];
 assert.equal(box.children[1].hidden,false,'heading expands the category');
 box.children[0].children[1].onclick();box=get('categories').children[0];
 assert.equal(box.children[1].hidden,true);assert.equal(box.children[0].children[1].attributes['aria-expanded'],'false');
 assert.ok(get('selection-summary').textContent.startsWith('0 '),'category heading only collapses; it does not select fields');
 const checkbox=box.children[0].children[0];checkbox.checked=true;checkbox.onchange();
 assert.equal(get('categories').children[0].children[1].hidden,true,'selection preserves collapsed state');
 get('none').onclick();await get('delete-download').onclick();
 assert.ok(downloaded);assert.equal(M.inspect(new Uint8Array(await downloaded.arrayBuffer()),file.name).fields.length,0);
 assert.ok(get('selection-summary').textContent.startsWith('0 '),'remove-all download preserves custom selection');
 get('picker').onchange({target:{files:[file],value:''}});await flush();
 assert.equal(get('files').children.length,2,'additional files append without a mode switch');
 assert.equal(get('download-batch').hidden,false,'multiple files automatically offer batch download');
 assert.equal(get('upload-panel').open,false,'batch upload also collapses the panel');
 await get('delete-download').onclick();
 assert.equal(downloaded.type,'application/zip');fs.writeFileSync(__dirname+'/test-output/ui-batch.zip',new Uint8Array(await downloaded.arrayBuffer()));
 get('clear').onclick();assert.equal(get('results').hidden,true);
 assert.equal(get('categories').children.length,0);
 assert.equal(get('picker').value,'');
 assert.equal(get('reset-bar').hidden,true);
 assert.equal(get('clear').disabled,true);
 assert.equal(get('upload-panel').open,true,'reset reopens the upload panel');
 get('picker').onchange({target:{files:[file,file],value:''}});await flush();
 assert.equal(get('files').children.length,2,'multiple files accepted in one upload');
 get('files').children[1].children[1].onclick();
 assert.equal(get('download-batch').hidden,true);
 get('files').children[0].children[1].onclick();
 assert.equal(get('reset-bar').hidden,true,'removing the last file hides reset');
 console.log('Category collapse, selection persistence, remove-all download, batch ZIP and clear-list checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
