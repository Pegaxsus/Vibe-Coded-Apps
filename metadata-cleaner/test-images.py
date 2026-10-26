from pathlib import Path
from PIL import Image, PngImagePlugin
import subprocess
import zipfile

base=Path(__file__).parent
out=base/'test-output'
out.mkdir(exist_ok=True)
im=Image.new('RGB',(20,14),(120,150,180))
exif=Image.Exif()
exif[315]='Test Author'
exif[306]='2026:10:21 12:00:00'
exif[274]=6
exif[271]='Test Camera'
exif[34853]={1:'N',2:(40.0,25.0,12.0),3:'W',4:(3.0,42.0,0.0),27:b'PRIVATE-GPS'}
for ext in ['jpg','png','webp']:
    kw={'exif':exif}
    if ext=='png':
        info=PngImagePlugin.PngInfo()
        info.add_text('Author','PNG Test Author')
        info.add_text('Description','Keep this description')
        kw['pnginfo']=info
    im.save(out/('fixture.'+ext),**kw)
subprocess.run(['node',str(base/'test-metadata.cjs')],check=True)
for ext in ['jpg','png','webp']:
    original=Image.open(out/('fixture.'+ext))
    for prefix in ['gps-clean-','all-clean-']:
        cleaned=Image.open(out/(prefix+'fixture.'+ext))
        cleaned.load()
        assert cleaned.tobytes()==original.tobytes(), (ext,'pixels changed')
        assert cleaned.getexif()[274]==6, (ext,'orientation changed')
print('All generated images decode; pixel bytes and orientation preserved in all three formats.')
with zipfile.ZipFile(out/'batch.zip') as archive:
    assert archive.testzip() is None
    assert archive.read('01-prueba-ñ.txt')==bytes([255,254,65,0,10,0])
    assert archive.read('02-fixture-clean.jpg')==(out/'all-clean-fixture.jpg').read_bytes()
print('Batch ZIP: valid CRCs, UTF-8 filenames and byte-identical contents.')
