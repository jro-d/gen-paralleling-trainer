// Minimal AS3 ABC parser + disassembler (read-only analysis helper).
import fs from 'node:fs';

const buf = fs.readFileSync(process.argv[2]);
const only = process.argv[3]; // optional class-name filter
let p = 0;
const u8 = () => buf[p++];
const u16 = () => { const v = buf.readUInt16LE(p); p += 2; return v; };
const u30 = () => { let r = 0, s = 0, b; do { b = buf[p++]; r |= (b & 0x7f) << s; s += 7; } while (b & 0x80 && s < 35); return r >>> 0; };
const s32 = () => { let r = 0, s = 0, b; do { b = buf[p++]; r |= (b & 0x7f) << s; s += 7; } while (b & 0x80 && s < 35); return r | 0; };
const d64 = () => { const v = buf.readDoubleLE(p); p += 8; return v; };
const str = () => { const n = u30(); const s = buf.toString('utf8', p, p + n); p += n; return s; };

p += 4 + 0; // flags (DoABC tag data: flags u32, name cstring)
while (buf[p++] !== 0);
const minor = u16(), major = u16();

const ints = [0], uints = [0], dbls = [NaN], strs = [''], nss = [null], nssets = [null], mns = [null];
let n = u30(); for (let i = 1; i < n; i++) ints.push(s32());
n = u30(); for (let i = 1; i < n; i++) uints.push(u30());
n = u30(); for (let i = 1; i < n; i++) dbls.push(d64());
n = u30(); for (let i = 1; i < n; i++) strs.push(str());
n = u30(); for (let i = 1; i < n; i++) { const k = u8(); const nm = u30(); nss.push({ k, nm }); }
n = u30(); for (let i = 1; i < n; i++) { const c = u30(); const a = []; for (let j = 0; j < c; j++) a.push(u30()); nssets.push(a); }
n = u30();
for (let i = 1; i < n; i++) {
  const k = u8(); const m = { k };
  if (k === 0x07 || k === 0x0d) { m.ns = u30(); m.name = u30(); }
  else if (k === 0x0f || k === 0x10) { m.name = u30(); }
  else if (k === 0x11 || k === 0x12) { }
  else if (k === 0x09 || k === 0x0e) { m.name = u30(); m.nsset = u30(); }
  else if (k === 0x1b || k === 0x1c) { m.nsset = u30(); }
  else if (k === 0x1d) { m.base = u30(); const c = u30(); m.params = []; for (let j = 0; j < c; j++) m.params.push(u30()); }
  mns.push(m);
}
const nsName = (i) => (i ? strs[nss[i].nm] : '*');
const mnName = (i) => {
  const m = mns[i]; if (!m) return '*';
  if (m.name !== undefined && m.ns !== undefined) { const ns = nsName(m.ns); return (ns ? ns + '.' : '') + strs[m.name]; }
  if (m.name !== undefined) return strs[m.name];
  if (m.base !== undefined) return mnName(m.base) + '.<>';
  return '<rt>';
};

const methods = [];
n = u30();
for (let i = 0; i < n; i++) {
  const pc = u30(); const ret = u30(); const ptypes = []; for (let j = 0; j < pc; j++) ptypes.push(u30());
  const name = u30(); const flags = u8();
  if (flags & 0x08) { const oc = u30(); for (let j = 0; j < oc; j++) { u30(); u8(); } }
  if (flags & 0x80) { for (let j = 0; j < pc; j++) u30(); }
  methods.push({ i, pc, ret, ptypes, name: strs[name], flags });
}
n = u30(); for (let i = 0; i < n; i++) { u30(); const c = u30(); for (let j = 0; j < c; j++) u30(); for (let j = 0; j < c; j++) u30(); }

function traits() {
  const c = u30(); const out = [];
  for (let i = 0; i < c; i++) {
    const name = u30(); const kb = u8(); const kind = kb & 0x0f; const attrs = kb >> 4;
    const t = { name: mnName(name), kind };
    if (kind === 0 || kind === 6) {
      u30(); t.type = mnName(u30()); const vi = u30();
      if (vi) {
        const vk = u8();
        t.value = vk === 0x03 ? ints[vi] : vk === 0x04 ? uints[vi] : vk === 0x06 ? dbls[vi] : vk === 0x01 ? JSON.stringify(strs[vi]) : `kind${vk}:${vi}`;
      }
    }
    else if (kind === 4) { u30(); u30(); }
    else if (kind === 5) { u30(); u30(); }
    else { u30(); t.method = u30(); }
    if (attrs & 0x04) { const mc = u30(); for (let j = 0; j < mc; j++) u30(); }
    out.push(t);
  }
  return out;
}
const insts = [];
n = u30();
for (let i = 0; i < n; i++) {
  const name = mnName(u30()); const sup = mnName(u30()); const fl = u8();
  if (fl & 0x08) u30();
  const ic = u30(); for (let j = 0; j < ic; j++) u30();
  const iinit = u30(); const tr = traits();
  insts.push({ name, sup, iinit, traits: tr });
}
for (let i = 0; i < n; i++) { const cinit = u30(); const tr = traits(); insts[i].cinit = cinit; insts[i].ctraits = tr; }
const sc = u30(); for (let i = 0; i < sc; i++) { u30(); traits(); }
const bodies = {};
n = u30();
for (let i = 0; i < n; i++) {
  const m = u30(); const ms = u30(); const lc = u30(); const id = u30(); const md = u30();
  const cl = u30(); const code = buf.subarray(p, p + cl); p += cl;
  const ec = u30(); for (let j = 0; j < ec; j++) { u30(); u30(); u30(); u30(); u30(); }
  traits();
  bodies[m] = { code, ms, lc };
}

// opcode table: name + operand kinds (u=u30, s=s32/s24, b=byte, m=multiname, S=string...)
const OP = {
  0x01:['bkpt'],0x02:['nop'],0x03:['throw'],0x04:['getsuper','m'],0x05:['setsuper','m'],0x06:['dxns','S'],0x07:['dxnslate'],
  0x08:['kill','u'],0x09:['label'],0x0c:['ifnlt','j'],0x0d:['ifnle','j'],0x0e:['ifngt','j'],0x0f:['ifnge','j'],0x10:['jump','j'],
  0x11:['iftrue','j'],0x12:['iffalse','j'],0x13:['ifeq','j'],0x14:['ifne','j'],0x15:['iflt','j'],0x16:['ifle','j'],0x17:['ifgt','j'],
  0x18:['ifge','j'],0x19:['ifstricteq','j'],0x1a:['ifstrictne','j'],0x1b:['lookupswitch','L'],0x1c:['pushwith'],0x1d:['popscope'],
  0x1e:['nextname'],0x1f:['hasnext'],0x20:['pushnull'],0x21:['pushundefined'],0x23:['nextvalue'],0x24:['pushbyte','b'],0x25:['pushshort','u'],
  0x26:['pushtrue'],0x27:['pushfalse'],0x28:['pushnan'],0x29:['pop'],0x2a:['dup'],0x2b:['swap'],0x2c:['pushstring','S'],0x2d:['pushint','I'],
  0x2e:['pushuint','U'],0x2f:['pushdouble','D'],0x30:['pushscope'],0x31:['pushnamespace','u'],0x32:['hasnext2','uu'],
  0x40:['newfunction','u'],0x41:['call','u'],0x42:['construct','u'],0x43:['callmethod','uu'],0x44:['callstatic','uu'],0x45:['callsuper','mu'],
  0x46:['callproperty','mu'],0x47:['returnvoid'],0x48:['returnvalue'],0x49:['constructsuper','u'],0x4a:['constructprop','mu'],
  0x4c:['callproplex','mu'],0x4e:['callsupervoid','mu'],0x4f:['callpropvoid','mu'],0x55:['newobject','u'],0x56:['newarray','u'],
  0x57:['newactivation'],0x58:['newclass','u'],0x59:['getdescendants','m'],0x5a:['newcatch','u'],0x5d:['findpropstrict','m'],
  0x5e:['findproperty','m'],0x60:['getlex','m'],0x61:['setproperty','m'],0x62:['getlocal','u'],0x63:['setlocal','u'],0x64:['getglobalscope'],
  0x65:['getscopeobject','b'],0x66:['getproperty','m'],0x68:['initproperty','m'],0x6a:['deleteproperty','m'],0x6c:['getslot','u'],
  0x6d:['setslot','u'],0x70:['convert_s'],0x71:['esc_xelem'],0x72:['esc_xattr'],0x73:['convert_i'],0x74:['convert_u'],0x75:['convert_d'],
  0x76:['convert_b'],0x77:['convert_o'],0x78:['checkfilter'],0x80:['coerce','m'],0x82:['coerce_a'],0x85:['coerce_s'],0x86:['astype','m'],
  0x87:['astypelate'],0x90:['negate'],0x91:['increment'],0x92:['inclocal','u'],0x93:['decrement'],0x94:['declocal','u'],0x95:['typeof'],
  0x96:['not'],0x97:['bitnot'],0xa0:['add'],0xa1:['subtract'],0xa2:['multiply'],0xa3:['divide'],0xa4:['modulo'],0xa5:['lshift'],
  0xa6:['rshift'],0xa7:['urshift'],0xa8:['bitand'],0xa9:['bitor'],0xaa:['bitxor'],0xab:['equals'],0xac:['strictequals'],0xad:['lessthan'],
  0xae:['lessequals'],0xaf:['greaterthan'],0xb0:['greaterequals'],0xb1:['instanceof'],0xb2:['istype','m'],0xb3:['istypelate'],0xb4:['in'],
  0xc0:['increment_i'],0xc1:['decrement_i'],0xc2:['inclocal_i','u'],0xc3:['declocal_i','u'],0xc4:['negate_i'],0xc5:['add_i'],
  0xc6:['subtract_i'],0xc7:['multiply_i'],0xd0:['getlocal_0'],0xd1:['getlocal_1'],0xd2:['getlocal_2'],0xd3:['getlocal_3'],
  0xd4:['setlocal_0'],0xd5:['setlocal_1'],0xd6:['setlocal_2'],0xd7:['setlocal_3'],0xef:['debug','bubu'],0xf0:['debugline','u'],0xf1:['debugfile','S'],0xf2:['bkptline','u'],
};
function disasm(m) {
  const code = bodies[m]?.code; if (!code) return '    (no body)';
  const lines = []; let q = 0;
  const ru = () => { let r = 0, s = 0, b; do { b = code[q++]; r |= (b & 0x7f) << s; s += 7; } while (b & 0x80 && s < 35); return r >>> 0; };
  const rs = () => { let r = 0, s = 0, b; do { b = code[q++]; r |= (b & 0x7f) << s; s += 7; } while (b & 0x80 && s < 35); return r | 0; };
  const r24 = () => { const v = code[q] | (code[q + 1] << 8) | (code[q + 2] << 16); q += 3; return (v << 8) >> 8; };
  while (q < code.length) {
    const at = q; const op = code[q++]; const d = OP[op];
    if (!d) { lines.push(`${at}: ?0x${op.toString(16)}`); continue; }
    let a = [];
    for (const k of d[1] || '') {
      if (k === 'u') a.push(ru());
      else if (k === 'b') { a.push(code[q] > 127 ? code[q] - 256 : code[q]); q++; }
      else if (k === 'm') a.push(mnName(ru()));
      else if (k === 'S') a.push(JSON.stringify(strs[ru()]));
      else if (k === 'I') a.push(ints[ru()]);
      else if (k === 'U') a.push(uints[ru()]);
      else if (k === 'D') a.push(dbls[ru()]);
      else if (k === 'j') { const o = r24(); a.push('->' + (q + o)); }
      else if (k === 'L') { r24(); const c = ru(); for (let i = 0; i <= c; i++) r24(); a.push('...'); }
    }
    if (op === 0xef) { /* debug has 4 operands: u8? handled loosely */ }
    if (op === 0xef) { lines.push(`${at}: debug`); continue; }
    if (op === 0xf0 || op === 0xf1) continue; // skip debug noise
    lines.push(`${at}: ${d[0]} ${a.join(' ')}`.trimEnd());
  }
  return lines.map((l) => '    ' + l).join('\n');
}
// fix: debug opcode operand layout is (u8 type, u30 idx, u8 reg, u30 extra)
const out = [];
for (const c of insts) {
  if (only && !c.name.includes(only)) continue;
  out.push(`\n=== class ${c.name} extends ${c.sup}`);
  out.push(`  ctor (method ${c.iinit}):\n${disasm(c.iinit)}`);
  for (const t of c.traits) {
    if (t.method !== undefined) { const kind = ['', '', 'method', 'getter', 'setter'][t.kind] || 'fn'; out.push(`  ${kind} ${t.name} (method ${t.method}):\n${disasm(t.method)}`); }
    else out.push(`  var ${t.name}: ${t.type}${t.value !== undefined ? ' = ' + t.value : ''}`);
  }
}
console.log(out.join('\n'));
