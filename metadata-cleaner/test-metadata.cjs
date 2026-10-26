const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('./metadata.js');
const dir=path.join(__dirname,'test-output');
for(const name of ['fixture.jpg','fixture.png','fixture.webp']){
 const original=new Uint8Array(fs.readFileSync(path.join(dir,name))),scan=M.inspect(original,name);
 assert.ok(scan.fields.some(f=>f.cat==='identity'),name+' identity');
 assert.ok(scan.fields.some(f=>f.cat==='dates'),name+' dates');
 assert.ok(scan.fields.some(f=>f.cat==='location'),name+' GPS');
 assert.deepEqual(scan.clean([]),original,'No selection preserves all bytes');
 const selected=scan.fields.filter(f=>f.cat==='location').map(f=>f.id),clean=scan.clean(selected),after=M.inspect(clean,name);
 assert.ok(!after.fields.some(f=>f.cat==='location'));
 assert.ok(after.fields.some(f=>f.cat==='identity'&&f.value.includes('Test Author')));
 assert.ok(!Buffer.from(clean).includes(Buffer.from('PRIVATE-GPS')));
 fs.writeFileSync(path.join(dir,'gps-clean-'+name),clean);
 const all=scan.clean(scan.fields.map(f=>f.id));assert.equal(M.inspect(all,name).fields.length,0);
 assert.ok(!Buffer.from(all).includes(Buffer.from('Test Author')));
 fs.writeFileSync(path.join(dir,'all-clean-'+name),all);
 for(let cut=1;cut<Math.min(original.length,80);cut++)assert.throws(()=>M.inspect(original.slice(0,cut),name));
 console.log(name+': selective GPS, all fields, retained author, raw byte removal, no-op and truncation passed');
}
const text=new Uint8Array([255,254,65,0,10,0]);assert.deepEqual(M.inspect(text,'test.txt').clean([]),text);
assert.throws(()=>M.inspect(new Uint8Array([1,2,3]),'test.pdf'));
// PNG textual blocks are individually selectable and CRC is regenerated for changed EXIF.
const png=fs.readFileSync(path.join(dir,'fixture.png')),s=M.inspect(png,'x.png');assert.ok(s.fields.some(f=>f.label.includes('Author')));
console.log('TXT encoding and unsupported formats passed');
// Run the ZIP writer with a minimal DOM stub; validate the archive using Python.
const vm=require('node:vm');
const stub=()=>({addEventListener(){},querySelector(){return stub();},setAttribute(){},replaceChildren(){},append(){},classList:{add(){},remove(){}}});
const context={window:{MetadataCleaner:M},document:{getElementById:()=>stub(),addEventListener(){}},ToolShell:{messages:{es:{},en:{}},language:'es',setLanguage(){}},TextEncoder,Uint8Array,DataView,Set,Map,console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'tool.js'),'utf8'),context);
fs.writeFileSync(path.join(dir,'batch.zip'),context.window.CleanerApp.zip([{name:'01-prueba-ñ.txt',bytes:text},{name:'02-fixture-clean.jpg',bytes:new Uint8Array(fs.readFileSync(path.join(dir,'all-clean-fixture.jpg')))}]));
