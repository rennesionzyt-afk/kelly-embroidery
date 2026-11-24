/* 静丝 Still Thread — 纹理素材生成器
   纯 Node（仅内置 zlib），无第三方依赖。
   输出：t1-silk-navy / t1-silk-cream / t1-ink-wash / t1-paper-grain
   手法：正弦扭曲的丝缕 + fbm 噪声 + 暗角 + 胶片颗粒
*/
const fs = require('fs'), zlib = require('zlib'), path = require('path');

/* ---------- PNG 编码 ---------- */
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = b => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, rgb, alpha) {
  const ch = alpha ? 4 : 3;
  const raw = Buffer.alloc(h * (1 + w * ch));
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      raw[o++] = rgb[i]; raw[o++] = rgb[i + 1]; raw[o++] = rgb[i + 2];
      if (alpha) raw[o++] = rgb[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = ch === 4 ? 6 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- 噪声 ---------- */
const hash = (x, y, s) => { let h = x * 374761393 + y * 668265263 + s * 1442695040; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
const smooth = t => t * t * (3 - 2 * t);
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf;
}
function fbm(x, y, s, oct = 5) { let v = 0, amp = .5, f = 1; for (let i = 0; i < oct; i++) { v += amp * vnoise(x * f, y * f, s + i * 17); f *= 2; amp *= .5; } return v; }

/* ---------- 工具 ---------- */
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ---------- 1. 丝缕纹理 ---------- */
function silk(w, h, baseHex, warpHex, opts) {
  const { thread = 3.15, sheen = 0.30, weft = 0.055, warpAmt = 2.6, grain = 1.7, vignette = 0.10, seed = 7 } = opts || {};
  const base = hex(baseHex), warpC = hex(warpHex);
  const out = Buffer.alloc(w * h * 3);
  const cx = w / 2, cy = h / 2, maxD = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // 丝缕走向：随 y 缓慢摆动（正弦 + 噪声），模拟经线张力
      const warp = Math.sin(y / (h * 0.9) * Math.PI * 2) * warpAmt + (fbm(x / 420, y / 420, seed, 3) - .5) * warpAmt * 2.4;
      const u = (x + warp) / thread;
      const f = u - Math.floor(u);              // 0..1 在一根丝线内的位置
      // 丝的圆柱截面：中心亮、边缘暗
      const cyl = Math.sin(Math.PI * clamp(f, 0, 1));
      const th = Math.pow(cyl, 1.65);
      // 经纬交织：横向纬线极淡
      const v = (y + (fbm(x / 300, y / 300, seed + 3, 2) - .5) * 1.6) / 4.05;
      const wf = Math.pow(Math.sin(Math.PI * (v - Math.floor(v))), 3.2);
      // 大尺度明度起伏（绸面受光不匀）
      const macro = (fbm(x / 260, y / 260, seed + 9, 4) - .5) * 2;
      // 暗角
      const d = Math.hypot(x - cx, y - cy) / maxD;
      const vig = 1 - vignette * d * d;
      // 颗粒：低频 + 量化（量化让 PNG 压缩率可用；高频噪点交给纸纹叠加层）
      const g = Math.round(((fbm(x / 9, y / 9, seed + 77, 2) - .5) * grain) / 1.6) * 1.6;

      let lum = 1 + (th - .5) * sheen + (wf - .5) * weft + macro * .045;
      lum *= vig;
      let c = [base[0] * lum + g, base[1] * lum + g, base[2] * lum + g];
      // 丝缕顶端的暖高光（描金倾向）
      const hi = Math.pow(th, 5.5) * .55;
      c = mix(c, warpC, hi);
      const i = (y * w + x) * 3;
      out[i] = clamp(c[0], 0, 255); out[i + 1] = clamp(c[1], 0, 255); out[i + 2] = clamp(c[2], 0, 255);
    }
  }
  return out;
}

/* ---------- 2. 水墨晕 ---------- */
function inkWash(w, h, paperHex, inkHex) {
  const paper = hex(paperHex), ink = hex(inkHex);
  const out = Buffer.alloc(w * h * 3);
  const blooms = [
    { x: .30, y: .34, r: .46, a: .30, s: 3, edge: .30 },
    { x: .68, y: .62, r: .38, a: .21, s: 11, edge: .26 },
    { x: .50, y: .16, r: .30, a: .15, s: 23, edge: .20 },
    { x: .16, y: .74, r: .26, a: .11, s: 31, edge: .16 }
  ];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w, ny = y / h;
      let amt = 0;
      for (const b of blooms) {
        // 半径被 fbm 扰动 → 不规则墨形
        const ang = Math.atan2(ny - b.y, nx - b.x);
        const wob = 1 + (fbm(Math.cos(ang) * 2.2 + 5, Math.sin(ang) * 2.2 + 5, b.s, 4) - .5) * .85;
        const dx = (nx - b.x) * (w / h), dy = ny - b.y;
        const dd = Math.hypot(dx, dy) / (b.r * wob);
        const fall = Math.exp(-dd * dd * 2.15);
        // 水痕：墨在纸上的干涸边（wet edge）—— 中间淡、边缘略深
        const wet = fall * (1 + b.edge * (Math.exp(-Math.pow((dd - .92) * 7, 2)) - .35));
        amt += wet * b.a;
      }
      // 纸的云斑（低频，量化以利压缩）
      const grain = Math.round(((fbm(x / 46, y / 46, 41, 3) - .5) * .026) / .0013) * .0013;
      const t = clamp(amt, 0, 1) + grain;
      const i = (y * w + x) * 3;
      const c = mix(paper, ink, t);
      out[i] = clamp(c[0], 0, 255); out[i + 1] = clamp(c[1], 0, 255); out[i + 2] = clamp(c[2], 0, 255);
    }
  }
  return out;
}

/* ---------- 3. 纸纹（RGBA 叠加层） ---------- */
function paperGrain(w, h, maxA) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x / 2.4, y / 2.4, 5, 3) * .62 + hash(x, y, 3) * .38;
      const a = clamp((n - .45) * maxA * 2, 0, maxA);
      const i = (y * w + x) * 4;
      out[i] = 26; out[i + 1] = 24; out[i + 2] = 24; out[i + 3] = Math.round(a * 255);
    }
  }
  return out;
}

/* ---------- 输出 ---------- */
const DIR = path.join(__dirname, '..');
const W = 1600, H = 900;
const jobs = [
  ['t1-silk-navy.png', () => encodePNG(W, H, silk(W, H, '#131E2C', '#BF8A54', { thread: 3.2, sheen: .34, weft: .06, seed: 7 }))],
  ['t1-silk-cream.png', () => encodePNG(W, H, silk(W, H, '#F7F4EE', '#E2D8D3', { thread: 3.05, sheen: .26, weft: .05, seed: 19 }))],
  ['t1-ink-wash.png', () => encodePNG(W, H, inkWash(W, H, '#F7F4EE', '#39414B'))],
  ['t1-paper-grain.png', () => encodePNG(W, H, paperGrain(W, H, .030), true)]
];
for (const [name, fn] of jobs) {
  const buf = fn();
  fs.writeFileSync(path.join(DIR, name), buf);
  console.log('✓', name, (buf.length / 1024).toFixed(0) + 'KB');
}
