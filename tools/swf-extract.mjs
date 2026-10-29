// Carves the SWF out of a Flash projector .exe and dumps its tag table + strings.
import fs from 'node:fs';
import zlib from 'node:zlib';

const exe = process.argv[2];
const outDir = process.argv[3];
fs.mkdirSync(outDir, { recursive: true });
const b = fs.readFileSync(exe);
const size = b.readUInt32LE(b.length - 4);
const start = b.length - 8 - size;
const swfRaw = b.subarray(start, start + size);
fs.writeFileSync(`${outDir}/embedded.swf`, swfRaw);
const sig = swfRaw.toString('ascii', 0, 3);
const ver = swfRaw[3];
let body = swfRaw.subarray(8);
if (sig === 'CWS') body = zlib.inflateSync(body);
const full = Buffer.concat([Buffer.from('FWS'), Buffer.from([ver]), Buffer.alloc(4), body]);
full.writeUInt32LE(full.length, 4);
fs.writeFileSync(`${outDir}/embedded.decompressed.swf`, full);
console.log({ sig, ver, compressed: swfRaw.length, decompressed: full.length });

// parse header
let pos = 8;
const nbits = full[pos] >> 3;
pos += Math.ceil((5 + nbits * 4) / 8);
const frameRate = full.readUInt16LE(pos) / 256; pos += 2;
const frameCount = full.readUInt16LE(pos); pos += 2;
console.log({ frameRate, frameCount });

const names = {0:'End',1:'ShowFrame',2:'DefineShape',4:'PlaceObject',5:'RemoveObject',6:'DefineBits',7:'DefineButton',8:'JPEGTables',9:'SetBackgroundColor',10:'DefineFont',11:'DefineText',12:'DoAction',13:'DefineFontInfo',14:'DefineSound',15:'StartSound',17:'DefineButtonSound',18:'SoundStreamHead',19:'SoundStreamBlock',20:'DefineBitsLossless',21:'DefineBitsJPEG2',22:'DefineShape2',23:'DefineButtonCxform',24:'Protect',26:'PlaceObject2',28:'RemoveObject2',32:'DefineShape3',33:'DefineText2',34:'DefineButton2',35:'DefineBitsJPEG3',36:'DefineBitsLossless2',37:'DefineEditText',39:'DefineSprite',43:'FrameLabel',45:'SoundStreamHead2',46:'DefineMorphShape',48:'DefineFont2',56:'ExportAssets',57:'ImportAssets',58:'EnableDebugger',59:'DoInitAction',60:'DefineVideoStream',61:'VideoFrame',62:'DefineFontInfo2',64:'EnableDebugger2',65:'ScriptLimits',66:'SetTabIndex',69:'FileAttributes',70:'PlaceObject3',71:'ImportAssets2',73:'DefineFontAlignZones',74:'CSMTextSettings',75:'DefineFont3',76:'SymbolClass',77:'Metadata',78:'DefineScalingGrid',82:'DoABC',83:'DefineShape4',84:'DefineMorphShape2',86:'DefineSceneAndFrameLabelData',87:'DefineBinaryData',88:'DefineFontName',90:'DefineBitsJPEG4'};

const counts = {};
const scripts = [];
function walk(buf, p, end, depth, ctx) {
  while (p < end) {
    const th = buf.readUInt16LE(p); p += 2;
    const code = th >> 6; let len = th & 0x3f;
    if (len === 0x3f) { len = buf.readUInt32LE(p); p += 4; }
    const data = buf.subarray(p, p + len);
    const n = names[code] || `Tag${code}`;
    counts[n] = (counts[n] || 0) + 1;
    if (code === 12 || code === 59 || code === 82) scripts.push({ tag: n, ctx, offset: p, data });
    if (code === 39) { // DefineSprite: id(2) frames(2) then tags
      const id = data.readUInt16LE(0);
      walk(data, 4, data.length, depth + 1, `${ctx}/sprite${id}`);
    }
    p += len;
    if (code === 0 && depth === 0) break;
  }
}
walk(full, pos, full.length, 0, 'root');
console.log(counts);
console.log('script tags:', scripts.length);
scripts.forEach((s, i) => fs.writeFileSync(`${outDir}/script_${String(i).padStart(3,'0')}_${s.tag}_${s.ctx.replace(/\//g,'_')}.bin`, s.data));
