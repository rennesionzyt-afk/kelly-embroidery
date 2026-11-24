/* 静丝 Still Thread — 矢量素材生成器
   纯 Node（fs 即可），输出 SVG。SVG 是本套素材的实际交付格式：
   体积小、可无限缩放、浏览器原生渲染、支持内联 CSS 动画。
*/
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');

const C = {
  navy: '#131E2C', night: '#0A111B', gold: '#BF8A54', goldSoft: '#C18D5A',
  bronze: '#95785E', paper: '#F7F4EE', cream: '#E2D8D3', cinnabar: '#A8352A',
  ink: '#1A1A1A'
};
const W = 1600, H = 900;
const w = (name, body) => fs.writeFileSync(path.join(DIR, name), body.trim() + '\n');

/* ─────────── 1. 丝纹（pattern 版，网页实际使用） ─────────── */
function silkPattern(file, base, threadHi, threadLo, seed) {
  w(file, `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="presentation">
  <defs>
    <linearGradient id="thr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"   stop-color="${threadLo}" stop-opacity="0.55"/>
      <stop offset="0.42" stop-color="${threadHi}" stop-opacity="0.30"/>
      <stop offset="0.58" stop-color="${threadHi}" stop-opacity="0.30"/>
      <stop offset="1"   stop-color="${threadLo}" stop-opacity="0.55"/>
    </linearGradient>
    <pattern id="weave" width="7" height="9" patternUnits="userSpaceOnUse">
      <rect width="7" height="9" fill="${base}"/>
      <rect width="7" height="9" fill="url(#thr)"/>
      <rect y="0" width="7" height="1" fill="${threadLo}" opacity="0.30"/>
      <rect y="4.5" width="7" height="0.8" fill="${threadHi}" opacity="0.10"/>
    </pattern>
    <filter id="warp" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.0012 0.0035" numOctaves="3" seed="${seed}" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="13" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <radialGradient id="vig" cx="0.5" cy="0.42" r="0.78">
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.22"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${base}"/>
  <g filter="url(#warp)" opacity="0.85">
    <rect width="${W}" height="${H}" fill="url(#weave)"/>
  </g>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`);
}
silkPattern('t1-silk-navy.svg', C.navy, C.gold, '#05090F', 7);
silkPattern('t1-silk-cream.svg', C.paper, '#FFFFFF', C.cream, 19);

/* ─────────── 2. 丝线场（动画 · Tier 1 静态替代 / Tier 2 增强） ─────────── */
{
  const lines = [];
  for (let i = 0; i < 46; i++) {
    const y = (i + 0.5) * (H / 46);
    const amp = 16 + (i % 7) * 9;
    const ph = i * 0.37;
    const d = `M -40 ${y.toFixed(1)} C ${(W * .25).toFixed(0)} ${(y - amp).toFixed(1)} ${(W * .55).toFixed(0)} ${(y + amp).toFixed(1)} ${(W + 40).toFixed(0)} ${(y - amp * .4).toFixed(1)}`;
    lines.push(`<path d="${d}" fill="none" stroke="${i % 9 === 0 ? C.gold : C.bronze}" stroke-width="${i % 9 === 0 ? 0.9 : 0.6}" opacity="${(0.05 + (i % 5) * 0.014).toFixed(3)}"/>`);
  }
  w('t1-thread-field.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="presentation" preserveAspectRatio="xMidYMid slice">
  <defs>
    <style>
      .field { animation: drift 26s linear infinite; }
      .field2 { animation: drift 26s linear infinite; animation-delay: -13s; }
      @keyframes drift { from { transform: translateY(0); } to { transform: translateY(-50%); } }
      @media (prefers-reduced-motion: reduce) { .field, .field2 { animation: none; } }
    </style>
    <clipPath id="cp"><rect width="${W}" height="${H}"/></clipPath>
    <g id="half">${lines.join('\n      ')}</g>
  </defs>
  <g clip-path="url(#cp)">
    <g class="field"><use href="#half"/><use href="#half" y="${H / 2}"/></g>
  </g>
</svg>`);
}

/* ─────────── 3. 针脚网格（平针走向） ─────────── */
{
  const rows = [];
  for (let r = 0; r < 22; r++) {
    const y = 40 + r * 38;
    const off = (r % 2) * 9;
    let d = '';
    for (let x = -10 + off; x < W + 10; x += 18) d += `M ${x} ${y} L ${x + 13} ${y}`;
    rows.push(`<path d="${d}" stroke="${C.bronze}" stroke-width="0.8" fill="none" opacity="${(0.05 + (r % 4) * 0.012).toFixed(3)}"/>`);
  }
  w('t1-stitch-grid.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="presentation" preserveAspectRatio="xMidYMid slice">
  <rect width="${W}" height="${H}" fill="none"/>
  <g>${rows.join('\n  ')}</g>
</svg>`);
}

/* ─────────── 4. 纸纹 ─────────── */
w('t1-paper-grain.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="presentation" preserveAspectRatio="none">
  <filter id="g" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="5" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="${W}" height="${H}" filter="url(#g)" opacity="0.045"/>
</svg>`);

/* ─────────── 5. 印章（朱文 · 手工残缺） ─────────── */
function sealSquare(file, chars, seed) {
  const S = 200, pad = 10, inner = S - pad * 2;
  const ch4 = Array.from(chars).slice(0, 4);
  // 印文右起竖读：右上 → 右下 → 左上 → 左下
  const slots = [[1, 0], [1, 1], [0, 0], [0, 1]];
  const body = ch4.map((ch, i) => {
    if (ch4.length === 4) {
      const [cx, cy] = slots[i];
      const x = pad + inner * (cx ? 0.73 : 0.27);
      const y = pad + inner * (cy ? 0.73 : 0.27);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="'Songti SC','STSong','SimSun','Noto Serif SC',serif" font-size="76" fill="${C.cinnabar}" text-anchor="middle" dominant-baseline="central">${ch}</text>`;
    }
    const x = S / 2;
    const y = ch4.length === 1 ? S / 2 : (i === 0 ? S * 0.34 : S * 0.68);
    const fs = ch4.length === 1 ? 108 : 84;
    return `<text x="${x}" y="${y}" font-family="'Songti SC','STSong','SimSun','Noto Serif SC',serif" font-size="${fs}" fill="${C.cinnabar}" text-anchor="middle" dominant-baseline="central">${ch}</text>`;
  }).join('');
  w(file, `
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img" aria-label="${ch4.join('')} 印章">
  <defs>
    <filter id="rough${seed}" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="speck${seed}" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed + 4}" result="s"/>
      <feColorMatrix in="s" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.9 1.06" result="sp"/>
      <feComposite in="SourceGraphic" in2="sp" operator="out"/>
    </filter>
  </defs>
  <g filter="url(#rough${seed})">
    <rect x="6" y="6" width="${S - 12}" height="${S - 12}" rx="3" fill="none" stroke="${C.cinnabar}" stroke-width="7"/>
    ${body}
  </g>
  <g filter="url(#speck${seed})" opacity="0.85">
    <rect x="6" y="6" width="${S - 12}" height="${S - 12}" rx="3" fill="none" stroke="${C.cinnabar}" stroke-width="7"/>
    ${body}
  </g>
</svg>`);
}
sealSquare('t1-seal-square-4ch.svg', '展场示景', 3);
sealSquare('t1-seal-square-2ch.svg', '非遗', 8);

/* ─────────── 6. 圆章 ─────────── */
{
  const S = 200, R = 92;
  w('t1-seal-round.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img" aria-label="繁花似锦 圆印">
  <defs>
    <filter id="rr" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="12" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <path id="arcT" d="M ${S / 2 - 62} ${S / 2} a 62 62 0 0 1 124 0"/>
    <path id="arcB" d="M ${S / 2 - 62} ${S / 2} a 62 62 0 0 0 124 0"/>
  </defs>
  <g filter="url(#rr)" fill="${C.cinnabar}">
    <circle cx="${S / 2}" cy="${S / 2}" r="${R}" fill="none" stroke="${C.cinnabar}" stroke-width="6"/>
    <circle cx="${S / 2}" cy="${S / 2}" r="${R - 13}" fill="none" stroke="${C.cinnabar}" stroke-width="1.4" opacity="0.75"/>
    <text font-family="'Songti SC','STSong','SimSun','Noto Serif SC',serif" font-size="40" letter-spacing="9" text-anchor="middle">
      <textPath href="#arcT" startOffset="50%">繁花</textPath>
    </text>
    <text font-family="'Songti SC','STSong','SimSun','Noto Serif SC',serif" font-size="40" letter-spacing="9" text-anchor="middle">
      <textPath href="#arcB" startOffset="50%">似锦</textPath>
    </text>
  </g>
</svg>`);
}

/* ─────────── 7. 绣绷线稿（3D 场景用） ─────────── */
{
  const S = 800, c = S / 2;
  const spokes = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r1 = 214, r2 = 268;
    spokes.push(`<line x1="${(c + Math.cos(a) * r1).toFixed(1)}" y1="${(c + Math.sin(a) * r1).toFixed(1)}" x2="${(c + Math.cos(a) * r2).toFixed(1)}" y2="${(c + Math.sin(a) * r2).toFixed(1)}" stroke="${C.bronze}" stroke-width="1.1" opacity="0.42"/>`);
  }
  w('t1-hoop-line.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="presentation">
  <defs>
    <radialGradient id="silk" cx="0.42" cy="0.36" r="0.72">
      <stop offset="0" stop-color="${C.cream}" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="${C.bronze}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${C.bronze}" stop-opacity="0.30"/>
    </radialGradient>
    <clipPath id="inner"><circle cx="${c}" cy="${c}" r="206"/></clipPath>
  </defs>
  <g clip-path="url(#inner)"><rect width="${S}" height="${S}" fill="url(#silk)"/></g>
  <g>${spokes.join('\n  ')}</g>
  <circle cx="${c}" cy="${c}" r="214" fill="none" stroke="${C.gold}" stroke-width="3.4" opacity="0.85"/>
  <circle cx="${c}" cy="${c}" r="268" fill="none" stroke="${C.gold}" stroke-width="6" opacity="0.55"/>
  <circle cx="${c}" cy="${c}" r="279" fill="none" stroke="${C.gold}" stroke-width="1.6" opacity="0.35"/>
  <circle cx="${c}" cy="${c}" r="202" fill="none" stroke="${C.bronze}" stroke-width="1" opacity="0.4"/>
</svg>`);
}

/* ─────────── 8. 生长金线（Hero 专用，带 dash 动画） ─────────── */
w('t1-thread-line.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="120" viewBox="0 0 1200 120" role="presentation" preserveAspectRatio="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.bronze}" stop-opacity="0.15"/>
      <stop offset="0.35" stop-color="${C.gold}" stop-opacity="0.85"/>
      <stop offset="0.82" stop-color="${C.goldSoft}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${C.gold}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <path id="p" d="M 0 74 C 210 74 300 46 470 46 C 660 46 720 78 900 78 C 1050 78 1110 62 1200 62"
        fill="none" stroke="url(#g)" stroke-width="2" stroke-linecap="round"
        pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000"/>
  <style>
    #p { animation: grow 1800ms cubic-bezier(0.16,1,0.3,1) forwards; }
    @keyframes grow { to { stroke-dashoffset: 0; } }
    @media (prefers-reduced-motion: reduce) { #p { animation: none; stroke-dashoffset: 0; } }
  </style>
</svg>`);

console.log('✓ SVG 素材输出完成');
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.svg'))) {
  console.log('  ', f, (fs.statSync(path.join(DIR, f)).size / 1024).toFixed(1) + 'KB');
}
