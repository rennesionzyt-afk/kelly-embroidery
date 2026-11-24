/* 静丝 · 针法母题生成器 —— SDF 形状 + 自动针迹铺排
   每个母题只需定义：距离场 shape(x,y)、配色 palette(d)、底色。
   针迹方向自动取等值线切向（绣线永远沿形状走向）。
   纯 Node（zlib），无依赖。输出到 素材库/img/
*/
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const DIR = path.join(__dirname, '..', 'img');

/* ── PNG 编码（同 gen-textures） ── */
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = b => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function png(w, h, rgb) {
  const raw = Buffer.alloc(h * (1 + w * 3)); let o = 0;
  for (let y = 0; y < h; y++) { raw[o++] = 0; for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; raw[o++] = rgb[i]; raw[o++] = rgb[i + 1]; raw[o++] = rgb[i + 2]; } }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); };
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw, { level: 9 })), ch('IEND', Buffer.alloc(0))]);
}

/* ── SDF 原语 ── */
const len = (x, y) => Math.hypot(x, y);
const sdCircle = (px, py, cx, cy, r) => len(px - cx, py - cy) - r;
const sdEllipse = (px, py, cx, cy, rx, ry, rot = 0) => { const c = Math.cos(-rot), s = Math.sin(-rot); const dx = px - cx, dy = py - cy; const x = dx * c - dy * s, y = dx * s + dy * c; const k = Math.min(rx / ry, ry / rx); return (Math.hypot(x / rx, y / ry) - 1) * Math.min(rx, ry) * k; };
const sdSeg = (px, py, ax, ay, bx, by, r) => { const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay; const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay))); return len(pax - bax * h, pay - bay * h) - r; };
const smin = (a, b, k = 18) => { const h = Math.max(0, Math.min(1, .5 + .5 * (b - a) / k)); return b + (a - b) * h - k * h * (1 - h); };
const smax = (a, b, k = 18) => -smin(-a, -b, k);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ── 渲染器：绢底 + 针迹铺排 + 暗角 ── */
function render(name, W, H, opt) {
  const { ground, shape, palette, threadLen = 13, step = 3.6, jitter = .34, vignette = .16, seed = 5 } = opt;
  const buf = Buffer.alloc(W * H * 3);
  const hash = (x, y) => { let h = x * 374761393 + y * 668265263 + seed * 1442695; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
  const g = hex(ground);
  // 绢底：极淡经纬
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wv = (Math.sin(Math.PI * ((x / 3.1) % 1)) - .5) * 4;
    const i = (y * W + x) * 3;
    buf[i] = g[0] + wv; buf[i + 1] = g[1] + wv; buf[i + 2] = g[2] + wv;
  }
  // 针迹：步进网格，mask 内沿等值线切向落针
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
    const d = shape(x, y);
    if (d > 1.2) continue;
    const e = .9; // 梯度→切向
    const gx = shape(x + e, y) - shape(x - e, y);
    const gy = shape(x, y + e) - shape(x, y - e);
    const nl = Math.hypot(gx, gy) || 1;
    let tx = -gy / nl, ty = gx / nl;
    const hsh = (hash(x | 0, y | 0) - .5);
    const L = threadLen * (1 + jitter * hsh);
    const ang = Math.atan2(ty, tx) + (hash(y | 0, x | 0) - .5) * .14;
    const x0 = x - Math.cos(ang) * L / 2, y0 = y - Math.sin(ang) * L / 2;
    const steps = 7;
    const col = palette(d, x / W, y / H);
    for (let s2 = 0; s2 <= steps; s2++) {
      const t = s2 / steps;
      const px = Math.round(x0 + Math.cos(ang) * L * t), py = Math.round(y0 + Math.sin(ang) * L * t);
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      if (shape(px, py) > 1.2) continue;
      // 丝光：针的中段更亮
      const sheen = .72 + .55 * Math.sin(Math.PI * t) * (0.75 + 0.25 * hash(px, py));
      const i2 = (py * W + px) * 3;
      buf[i2] = clamp(col[0] * sheen, 0, 255);
      buf[i2 + 1] = clamp(col[1] * sheen, 0, 255);
      buf[i2 + 2] = clamp(col[2] * sheen, 0, 255);
    }
  }
  // 暗角
  const cx = W / 2, cy = H / 2, md = Math.hypot(cx, cy);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dd = Math.hypot(x - cx, y - cy) / md; const v = 1 - vignette * dd * dd;
    const i = (y * W + x) * 3;
    buf[i] = clamp(buf[i] * v, 0, 255); buf[i + 1] = clamp(buf[i + 1] * v, 0, 255); buf[i + 2] = clamp(buf[i + 2] * v, 0, 255);
  }
  fs.writeFileSync(path.join(DIR, name), png(W, H, buf));
  console.log('✓', name, (fs.statSync(path.join(DIR, name)).size / 1024).toFixed(0) + 'KB');
}

/* ═══ 母题 ═══ */
const NAVY = '#16222F', PAPER = '#F1ECE2', CREAM = '#E4D9C8';

/* 1. 玉兰屏（镜08 主作） 900×675 */
render('motif-magnolia.png', 900, 675, {
  ground: NAVY, seed: 11,
  shape: (x, y) => {
    // 枝
    let d = sdSeg(x, y, 120, 620, 480, 300, 7);
    d = smin(d, sdSeg(x, y, 480, 300, 700, 210, 4.5), 14);
    d = smin(d, sdSeg(x, y, 480, 300, 620, 480, 4), 12);
    // 花苞群（玉兰：直立杯状多瓣）
    const bloom = (bx, by, s) => {
      let b = sdEllipse(x, y, bx, by, 62 * s, 86 * s, -.25);
      b = smin(b, sdEllipse(x, y, bx - 55 * s, by + 30 * s, 46 * s, 78 * s, .32), 16 * s);
      b = smin(b, sdEllipse(x, y, bx + 52 * s, by + 26 * s, 44 * s, 74 * s, -.18), 15 * s);
      b = smin(b, sdEllipse(x, y, bx, by - 70 * s, 30 * s, 46 * s, 0), 20 * s);
      return b;
    };
    d = smin(d, bloom(560, 190, 1), 10);
    d = smin(d, bloom(660, 420, .78), 10);
    d = smin(d, bloom(360, 235, .62), 8);
    return d;
  },
  palette: (d, u, v) => {
    if (d < -14) return mix(hex('#F5EFE3'), hex('#C9BBA4'), clamp((d + 60) / 60, 0, 1)); // 瓣心暖白
    if (d < -4) return mix(hex('#D8CBB4'), hex('#B8A98E'), .5);
    return mix(hex('#8A7A5E'), hex('#6B5E46'), u); // 枝
  }
});

/* 2. 翠鸟荷花（商品卡） 760×950 */
render('motif-kingfisher.png', 760, 950, {
  ground: '#101A22', seed: 21,
  shape: (x, y) => {
    // 荷叶（大圆缺口）
    let d = sdCircle(x, y, 350, 760, 235);
    d = smax(d, -sdSeg(x, y, 350, 760, 560, 900, 42), 40); // 楔形缺口
    // 立荷
    d = smin(d, sdEllipse(x, y, 300, 620, 150, 52, -.3), 24);
    // 荷花
    let f = sdEllipse(x, y, 540, 470, 58, 96, .18);
    f = smin(f, sdEllipse(x, y, 470, 520, 50, 84, .5), 14);
    f = smin(f, sdEllipse(x, y, 605, 525, 48, 82, -.35), 14);
    d = smin(d, f, 16);
    // 翠鸟：栖于上方枝
    let bird = sdEllipse(x, y, 330, 300, 58, 44, -.15);          // 身
    bird = smin(bird, sdCircle(x, y, 398, 262, 25), 12);         // 头
    bird = smin(bird, sdSeg(x, y, 418, 262, 545, 300, 7), 8);    // 喙
    bird = smin(bird, sdSeg(x, y, 330, 342, 322, 428, 4), 6);    // 爪枝
    bird = smin(bird, sdSeg(x, y, 322, 428, 240, 560, 3.5), 5);  // 栖枝
    return smin(d, bird, 10);
  },
  palette: (d, u, v) => {
    // 按区域:用 y 位置区分鸟（上）与花草（下）
    if (v < .52) return mix(hex('#2E7F9E'), hex('#48B3C9'), clamp(1 + d / 40, 0, 1)); // 翠鸟青
    if (u > .58 && v < .62) return mix(hex('#D9A0B4'), hex('#C4839C'), clamp(1 + d / 50, 0, 1)); // 荷花粉
    if (u > .55) return mix(hex('#4E6E52'), hex('#3A5740'), u); // 立荷
    return mix(hex('#3E5C48'), hex('#2C4433'), clamp((d + 80) / 80, 0, 1)); // 荷叶
  }
});

/* 3-5. 技法样张 ×3（16:9） */
render('swatch-rotating.png', 900, 506, {
  ground: CREAM, seed: 31, threadLen: 16, step: 3.2,
  shape: (x, y) => {
    const dx = x - 450, dy = y - 253;
    const a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
    return Math.abs(Math.sin(a * 5 + r / 26)) * 30 - 14; // 放射旋针
  },
  palette: d => mix(hex('#8A6B42'), hex('#C89A5E'), clamp(d / 24 + .6, 0, 1))
});
render('swatch-santanua.png', 900, 506, {
  ground: CREAM, seed: 37, threadLen: 11, step: 3.0,
  shape: (x, y) => {
    const w = Math.sin(x / 34) * 30 + Math.sin(y / 21 + x / 90) * 22;
    return Math.abs(w) - 13; // 长短交叠
  },
  palette: (d, u) => mix(hex('#9A7A50'), hex('#77573A'), u * .8 + clamp(d / 40, 0, .2))
});
render('swatch-gold.png', 900, 506, {
  ground: NAVY, seed: 43, threadLen: 15, step: 3.0,
  shape: (x, y) => {
    const dx = x - 450, dy = y - 253;
    const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    return Math.abs(Math.sin(r / 20 - a * .5)) * 26 - 12; // 盘金回曲
  },
  palette: (d, u, v) => mix(hex('#D9A55F'), hex('#A97C3F'), clamp(.5 + d / 30, 0, 1))
});

/* 6. 圆形摆件（商品卡） 760×950 */
render('motif-round.png', 760, 950, {
  ground: PAPER, seed: 51,
  shape: (x, y) => {
    const ring = Math.abs(sdCircle(x, y, 380, 475, 300)) - 26; // 圆窗
    let fl = sdCircle(x, y, 380, 520, 96);                     // 花心
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2;
      fl = smin(fl, sdEllipse(x, y, 380 + Math.cos(a) * 150, 520 + Math.sin(a) * 150, 62, 40, a), 18); }
    let leaf = sdEllipse(x, y, 300, 340, 120, 34, -.5);
    leaf = smin(leaf, sdEllipse(x, y, 480, 350, 100, 30, .4), 16);
    return smax(ring, smin(fl, leaf, 12), 14);
  },
  palette: (d, u, v) => {
    if (v < .42) return mix(hex('#7E8F6E'), hex('#5E7052'), u);       // 叶
    return mix(hex('#C98A9A'), hex('#B06A7E'), clamp((d + 60) / 60, 0, 1)); // 瓣
  }
});

/* 7-11. 礼赠瓷砖 ×5（3:4 竖） */
const tile = (name, shape, palette, ground, seed) => render(name, 690, 920, {
  ground, seed, threadLen: 12, step: 3.4, ...(shape && {}), shape, palette
});
/* 松鹤 · 福寿 */
tile('tile-crane.png', (x, y) => {
  let d = sdSeg(x, y, 130, 260, 420, 180, 8);                      // 松横枝
  d = smin(d, sdSeg(x, y, 240, 225, 260, 130, 5), 12);             // 小枝
  for (let i = 0; i < 5; i++) d = smin(d, sdSeg(x, y, 150 + i * 52, 245 - i * 8, 168 + i * 52, 205 - i * 8, 2.6), 9); // 松针束
  let bird = sdEllipse(x, y, 470, 560, 96, 74, .08);               // 鹤身
  bird = smin(bird, sdSeg(x, y, 470, 500, 480, 340, 14), 18);      // 颈
  bird = smin(bird, sdSeg(x, y, 480, 340, 545, 315, 9), 10);       // 头喙
  bird = smin(bird, sdSeg(x, y, 470, 620, 470, 760, 5), 8);        // 腿
  bird = smin(bird, sdSeg(x, y, 430, 660, 520, 800, 4), 7);        // 尾羽
  return smin(d, bird, 10);
}, (d, u, v) => v < .40 ? mix(hex('#5C5240'), hex('#423A2C'), u)   // 松
  : u > .44 ? mix(hex('#EFEAE0'), hex('#CFC7B8'), clamp(1 + d / 50, 0, 1)) // 鹤白
  : hex('#8A2F28'), PAPER, 61);
/* 双鹊 · 情缘 */
tile('tile-pair.png', (x, y) => {
  const magpie = (cx, cy, s, flip) => {
    let b = sdEllipse(x, y, cx, cy, 62 * s, 40 * s, flip * .12);
    b = smin(b, sdCircle(x, y, cx + flip * 52 * s, cy - 26 * s, 21 * s), 10 * s);
    b = smin(b, sdSeg(x, y, cx + flip * 66 * s, cy - 30 * s, cx + flip * 96 * s, cy - 18 * s, 4.5 * s), 7);
    b = smin(b, sdSeg(x, y, cx - flip * 40 * s, cy - 6 * s, cx - flip * 130 * s, cy + 26 * s, 6 * s), 8); // 长尾
    return b;
  };
  let d = magpie(300, 400, 1, 1);
  d = smin(d, magpie(430, 620, .92, -1), 12);
  d = smin(d, sdSeg(x, y, 120, 800, 600, 700, 4), 10); // 枝
  return d;
}, d => mix(hex('#2C3340'), hex('#4A5568'), clamp(1 + d / 40, 0, 1)), PAPER, 67);
/* 锦鲤 · 功名 */
tile('tile-koi.png', (x, y) => {
  const koi = (cx, cy, s, rot) => {
    let b = sdEllipse(x, y, cx, cy, 120 * s, 52 * s, rot);          // 身
    const tx = cx - Math.cos(rot) * 120 * s, ty = cy - Math.sin(rot) * 120 * s;
    b = smin(b, sdSeg(x, y, tx, ty, tx - Math.cos(rot - .5) * 80 * s, ty - Math.sin(rot - .5) * 80 * s, 8 * s), 12); // 尾
    b = smin(b, sdCircle(x, y, cx + Math.cos(rot) * 110 * s, cy + Math.sin(rot) * 110 * s, 18 * s), 14); // 头
    return b;
  };
  let d = koi(400, 380, 1, -.35);
  d = smin(d, koi(330, 640, .8, -1.15), 14);
  for (let i = 0; i < 3; i++) d = smin(d, sdCircle(x, y, 140 + i * 30, 220 + i * 40, 9), 8); // 水泡
  return d;
}, (d, u) => mix(hex('#D08A3E'), hex('#B2622A'), clamp(1 + d / 45, 0, 1)), '#132030', 71);
/* 云雷 · 护佑（抽象瑞纹） */
tile('tile-guard.png', (x, y) => {
  const dx = x - 345, dy = y - 460;
  const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  return Math.abs(Math.sin(r / 34 - a * .75) * 30) - 15; // 雷纹回旋
}, (d, u, v) => mix(hex('#C89A5E'), hex('#96703C'), clamp(.5 + d / 30, 0, 1)), NAVY, 77);
/* 白梅 · 清和 */
tile('tile-plum.png', (x, y) => {
  let d = sdSeg(x, y, 150, 850, 420, 480, 9);
  d = smin(d, sdSeg(x, y, 420, 480, 560, 260, 6), 16);
  d = smin(d, sdSeg(x, y, 320, 640, 210, 420, 5), 14);
  const blossom = (bx, by, s) => {
    let b = 1e9;
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2;
      b = smin(b, sdEllipse(x, y, bx + Math.cos(a) * 30 * s, by + Math.sin(a) * 30 * s, 30 * s, 22 * s, a), 10 * s); }
    return b;
  };
  d = smin(d, blossom(560, 230, 1), 8);
  d = smin(d, blossom(470, 430, .8), 8);
  d = smin(d, blossom(240, 470, .62), 7);
  d = smin(d, blossom(180, 660, .5), 6);
  return d;
}, (d, u, v) => v < .55 || d > -6 ? mix(hex('#4E4438'), hex('#372F26'), u) : hex('#EFEAE0'), PAPER, 83);

/* 12. Journal 缩略 ×1（丝与光） */
render('motif-sheen.png', 900, 600, {
  ground: '#F3EEE4', seed: 91, threadLen: 20, step: 4.2,
  shape: (x, y) => Math.abs(Math.sin(x / 52 + y / 30)) * 40 - 16,
  palette: (d, u) => mix(hex('#B99872'), hex('#8F7350'), u)
});

console.log('母题生成完成');
