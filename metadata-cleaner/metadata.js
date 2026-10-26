/* Local binary metadata inspection. No image re-encoding and no network. */
(function (root) {
  'use strict';
  const categories = ['location','identity','device','dates','description','preview','other'];
  const ascii = b => new TextDecoder('latin1').decode(b);
  const concat = parts => { const out = new Uint8Array(parts.reduce((n,b)=>n+b.length,0)); let p=0; for(const b of parts){out.set(b,p);p+=b.length;}return out; };
  const fail = () => { throw Error('Estructura no compatible o archivo dañado. No se ha generado una copia.'); };
  const classify = s => /gps|location|latitude|longitude|geograf/i.test(s)?'location':/author|artist|owner|creator|copyright|person|email/i.test(s)?'identity':/software|make|model|serial|firmware|device/i.test(s)?'device':/date|time|fecha/i.test(s)?'dates':/thumbnail|preview/i.test(s)?'preview':'description';
  const names = {270:'ImageDescription',271:'Make',272:'Model',274:'Orientation',305:'Software',306:'DateTime',315:'Artist',33432:'Copyright',36867:'DateTimeOriginal',36868:'DateTimeDigitized',37500:'MakerNote',37510:'UserComment',42016:'ImageUniqueID',42032:'CameraOwnerName',42033:'BodySerialNumber',42034:'LensSpecification',42035:'LensMake',42036:'LensModel',42037:'LensSerialNumber',40091:'XPTitle',40092:'XPComment',40093:'XPAuthor',40094:'XPKeywords',40095:'XPSubject'};
  function tiff(bytes) {
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength), le=ascii(bytes.slice(0,2))==='II';
    const check=(p,n)=>{if(!Number.isSafeInteger(p)||p<0||p+n>bytes.length)fail();};
    const u16=p=>{check(p,2);return v.getUint16(p,le);},u32=p=>{check(p,4);return v.getUint32(p,le);};
    if(!['II','MM'].includes(ascii(bytes.slice(0,2))))fail();if(u16(2)!==42)fail();
    const sizes={1:1,2:1,3:2,4:4,5:8,6:1,7:1,8:2,9:4,10:8,11:4,12:8,13:4};
    const dirs=[], fields=[], seen=new Set(); let idx=0;
    function walk(p,group,depth=0){
      if(!p)return; if(depth>12||seen.has(p)||dirs.length>128)fail();seen.add(p);
      const n=u16(p);if(n>4096)fail();check(p,2+n*12+4);
      const dir={p,n,entries:[],next:p+2+n*12,group};dirs.push(dir);
      for(let i=0;i<n;i++){
        const e=p+2+i*12,tag=u16(e),type=u16(e+2),count=u32(e+4),size=sizes[type]*count;
        if(!sizes[type]||!Number.isSafeInteger(size))fail();
        const start=size>4?u32(e+8):e+8;check(start,size);
        const pointer=[34665,34853,40965].includes(tag);
        const cat=group==='gps'?'location':group==='thumb'?'preview':tag===37500?'device':names[tag]?classify(names[tag]):'other';
        const gpsNames={0:'GPSVersion',1:'GPSLatitudeRef',2:'GPSLatitude',3:'GPSLongitudeRef',4:'GPSLongitude',5:'GPSAltitudeRef',6:'GPSAltitude',7:'GPSTime',18:'GPSMapDatum',27:'GPSProcessingMethod',29:'GPSDate'};
        const item={id:'t'+idx++,tag,e,start,size,cat,pointer,dir,label:(group==='gps'?gpsNames[tag]:names[tag])||'EXIF 0x'+tag.toString(16),value:''};
        if(type===2)item.value=ascii(bytes.slice(start,start+Math.min(size,300))).replace(/\0/g,'');
        else if(type===3&&count===1)item.value=String(u16(start));
        else if(type===4&&count===1)item.value=String(u32(start));
        else if(type===5&&count<=6)item.value=Array.from({length:count},(_,j)=>{const den=u32(start+j*8+4);return den?String(u32(start+j*8)/den):'0/0';}).join(', ');
        else item.value=`${count} valores · ${size} bytes`;
        dir.entries.push(item);
        if(pointer){if(type!==4||count!==1)fail();walk(u32(e+8),tag===34853?'gps':group,depth+1);}
        else if(tag!==274)fields.push(item); // Orientation is structural and always preserved.
      }
      const next=u32(dir.next);if(next)walk(next,'thumb',depth+1);
    }
    walk(u32(4),'main');
    // JPEG thumbnail offsets refer to TIFF-relative raw bytes rather than an IFD value.
    for(const d of dirs.filter(d=>d.group==='thumb')){
      const off=d.entries.find(e=>e.tag===513),len=d.entries.find(e=>e.tag===514);
      if(off&&len){const p=u32(off.e+8),n=u32(len.e+8);check(p,n);off.extra=[p,n];}
      // TIFF strip thumbnails need a dedicated writer; refuse ambiguous structures.
      if(d.entries.some(e=>[273,324,330].includes(e.tag)))fail();
    }
    if(fields.some(e=>e.tag===330))fail();
    function clean(selected){
      const out=bytes.slice(),ov=new DataView(out.buffer);
      const removed=fields.filter(f=>selected.has(f.id));
      const ranges=removed.flatMap(f=>[[f.start,f.size],...(f.extra?[f.extra]:[])]);
      const protectedRanges=fields.filter(f=>!selected.has(f.id)).map(f=>[f.start,f.size]);
      for(const [p,n] of ranges){
        if(protectedRanges.some(([a,b])=>p<a+b&&a<p+n))throw Error('Hay datos compartidos: selecciona todos los campos relacionados.');
        if(dirs.some(d=>p<d.next+4&&d.p<p+n)&&!removed.some(f=>f.start===p&&f.size===n&&f.size<=4))fail();
        out.fill(0,p,p+n);
      }
      for(const d of dirs){
        const kept=d.entries.filter(e=>e.pointer||!selected.has(e.id));
        const records=kept.map(e=>out.slice(e.e,e.e+12));
        const next=out.slice(d.next,d.next+4);
        out.fill(0,d.p,d.next+4);ov.setUint16(d.p,kept.length,le);
        records.forEach((b,i)=>out.set(b,d.p+2+i*12));out.set(next,d.p+2+kept.length*12);
      }
      return out;
    }
    return {fields,clean};
  }
  function inspect(input, filename='') {
    const b=input instanceof Uint8Array?input:new Uint8Array(input),view=new DataView(b.buffer,b.byteOffset,b.byteLength);
    const fields=[],parts=[],warnings=[];let serial=0,format;
    const bounds=(p,n)=>{if(p<0||p+n>b.length)fail();};
    const add=(raw,data,label,cat,value,kind)=>{
      const part={raw,data,kind};parts.push(part);
      if(kind==='exif'){
        const prefix=ascii(data.slice(0,6))==='Exif\0\0'?6:0;
        try{part.exif=tiff(data.subarray(prefix));part.prefix=data.slice(0,prefix);
          for(const f of part.exif.fields){const global={...f,id:'f'+serial++,local:f.id};fields.push(global);(part.fields ||= []).push(global);}
        }catch{part.exif=null;part.id='f'+serial++;fields.push({id:part.id,cat:'other',label:label+' (bloque no interpretable)',value:'Se elimina completo; puede contener varias categorías.'});}
      }else if(cat){part.id='f'+serial++;fields.push({id:part.id,cat,label,value});}
      return part;
    };
    if(b[0]===255&&b[1]===216){
      format='JPEG';parts.push({raw:b.slice(0,2)});let p=2,ended=false;
      while(p<b.length){const start=p;if(b[p++]!==255)fail();while(b[p]===255)p++;const marker=b[p++];
        if(marker===217){parts.push({raw:b.slice(start,p)});if(p<b.length)add(b.slice(p),b.slice(p),'Datos tras JPEG','other',`${b.length-p} bytes`,'tail');ended=true;break;}
        if(marker===1||marker>=208&&marker<=215){parts.push({raw:b.slice(start,p)});continue;}
        bounds(p,2);const n=view.getUint16(p);if(n<2)fail();bounds(p,n);const data=b.slice(p+2,p+n),raw=b.slice(start,p+n);p+=n;
        if(marker===218){parts.push({raw});let scan=p;
          while(scan<b.length){if(b[scan]!==255){scan++;continue;}let q=scan+1;while(b[q]===255)q++;const m=b[q];if(m===0||m>=208&&m<=215){scan=q+1;continue;}break;}
          if(scan>=b.length)fail();parts.push({raw:b.slice(p,scan)});p=scan;continue;}
        let cat=null,label='',kind='jpeg';
        if(marker===225&&ascii(data.slice(0,6))==='Exif\0\0'){label='EXIF';kind='exif';}
        else if(marker===225){cat='other';label='XMP / APP1 · bloque completo';}
        else if(marker===237){cat='other';label='IPTC / Photoshop · bloque completo';}
        else if(marker===254){cat='description';label='Comentario JPEG';}
        else if(marker===224&&ascii(data.slice(0,5))!=='JFIF\0'){cat='other';label='APP0 / JFXX · bloque completo';}
        else if(marker>=224&&marker<=239&&![224,238].includes(marker)&&!(marker===226&&ascii(data.slice(0,12))==='ICC_PROFILE\0')){cat='other';label='APP'+(marker-224)+' · bloque completo';}
        const part=add(raw,data,label,cat,cat==='description'?ascii(data).slice(0,300):`${data.length} bytes · puede contener varias categorías`,kind);part.marker=marker;
        // JFIF can contain a raw RGB thumbnail. Keep its density and version intact.
        if(marker===224&&ascii(data.slice(0,5))==='JFIF\0'&&data.length>=14&&data[12]*data[13]){
          part.jfif=true;part.id='f'+serial++;fields.push({id:part.id,cat:'preview',label:'Miniatura JFIF',value:`${data[12]} × ${data[13]}`});
        }
      }if(!ended)fail();
    }else if(b[0]===137&&ascii(b.slice(1,8))==='PNG\r\n\x1a\n'){
      format='PNG';parts.push({raw:b.slice(0,8)});let p=8,ended=false;
      while(p<b.length){bounds(p,12);const n=view.getUint32(p),type=ascii(b.slice(p+4,p+8));bounds(p,n+12);const data=b.slice(p+8,p+8+n),raw=b.slice(p,p+n+12);p+=n+12;
        let cat=null,label=type,kind=type==='eXIf'?'exif':'png';
        if(['tEXt','zTXt','iTXt'].includes(type)){const key=ascii(data.slice(0,Math.max(0,data.indexOf(0))));cat=/xmp|iptc|exif/i.test(key)?'other':classify(key);label=type+' · '+key;}
        else if(type==='tIME')cat='dates';
        else if(!['IHDR','PLTE','IDAT','IEND','tRNS','cHRM','gAMA','iCCP','sBIT','sRGB','bKGD','hIST','pHYs','sPLT','acTL','fcTL','fdAT','cICP','mDCV','cLLI','eXIf'].includes(type)){if(type[0]===type[0].toUpperCase())fail();cat='other';label=type+' · bloque adicional';}
        const part=add(raw,data,label,cat,type==='tEXt'?ascii(data).replace(/\0/,' = ').slice(0,300):`${n} bytes`,kind);part.type=type;
        if(type==='IEND'){if(n!==0)fail();ended=true;if(p<b.length)add(b.slice(p),b.slice(p),'Datos tras PNG','other',`${b.length-p} bytes`,'tail');break;}
      }if(!ended)fail();
    }else if(ascii(b.slice(0,4))==='RIFF'&&ascii(b.slice(8,12))==='WEBP'){
      format='WebP';bounds(0,12);if(view.getUint32(4,true)+8!==b.length)fail();parts.push({raw:b.slice(0,12)});let p=12;
      while(p<b.length){bounds(p,8);const type=ascii(b.slice(p,p+4)),n=view.getUint32(p+4,true);bounds(p,8+n+(n%2));const raw=b.slice(p,p+8+n+(n%2)),data=b.slice(p+8,p+8+n);p+=raw.length;
        const cat=type==='XMP '?'other':!['VP8 ','VP8L','VP8X','ALPH','ANIM','ANMF','ICCP','EXIF'].includes(type)?'other':null;
        const part=add(raw,data,type==='XMP '?'XMP · bloque completo':type,cat,`${n} bytes · bloque completo`,type==='EXIF'?'exif':'webp');part.type=type;
      }
    }else if(/\.txt$/i.test(filename)){
      format='TXT';parts.push({raw:b});warnings.push('TXT no define metadatos incrustados estándar. Se conserva el contenido y la codificación byte a byte. Las fechas y permisos del sistema no son accesibles desde esta app.');
    }else throw Error('Formato no compatible. Usa JPG, PNG, WebP o TXT.');
    if(format!=='TXT')warnings.push('Se conservan orientación, perfil de color y datos necesarios para mostrar la imagen, salvo que selecciones sus campos EXIF. XMP, IPTC y bloques opacos se borran completos y pueden agrupar varias categorías. No se analiza información visible en los píxeles ni datos ocultos por esteganografía.');
    function clean(ids){
      const selected=new Set(ids),out=[];
      for(const part of parts){
        if(part.id&&selected.has(part.id)&&!part.jfif)continue;
        let data=part.data;
        if(part.exif){const local=new Set((part.fields||[]).filter(f=>selected.has(f.id)).map(f=>f.local));if(local.size)data=concat([part.prefix,part.exif.clean(local)]);}
        if(part.jfif&&selected.has(part.id)){data=part.data.slice(0,14);data[12]=data[13]=0;}
        if(data===part.data||!data){out.push(part.raw);continue;}
        if(format==='JPEG'){const head=new Uint8Array([255,part.marker,(data.length+2)>>8,(data.length+2)&255]);out.push(concat([head,data]));}
        if(format==='PNG')out.push(pngChunk(part.type,data));
        if(format==='WebP')out.push(webpChunk(part.type,data));
      }
      let result=concat(out);
      if(format==='WebP'){
        new DataView(result.buffer).setUint32(4,result.length-8,true);
        const hasExif=parts.some(p=>p.type==='EXIF'&&!(p.id&&selected.has(p.id))),hasXmp=parts.some(p=>p.type==='XMP '&&!selected.has(p.id));
        let p=12;while(p<result.length){const type=ascii(result.slice(p,p+4)),n=new DataView(result.buffer).getUint32(p+4,true);if(type==='VP8X'){if(!hasExif)result[p+8]&=~8;if(!hasXmp)result[p+8]&=~4;}p+=8+n+n%2;}
      }
      return result;
    }
    return {format,fields,warnings,clean};
  }
  function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
  function pngChunk(type,data){const out=new Uint8Array(data.length+12),v=new DataView(out.buffer);v.setUint32(0,data.length);out.set(new TextEncoder().encode(type),4);out.set(data,8);v.setUint32(out.length-4,crc32(out.subarray(4,out.length-4)));return out;}
  function webpChunk(type,data){const out=new Uint8Array(8+data.length+data.length%2);out.set(new TextEncoder().encode(type));new DataView(out.buffer).setUint32(4,data.length,true);out.set(data,8);return out;}
  const api={inspect,categories,crc32,pngChunk,webpChunk,concat};root.MetadataCleaner=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
