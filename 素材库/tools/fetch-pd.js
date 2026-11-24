/* 从维基共享资源抓取公有领域绣品/名画，校验许可并下载缩略图。
   仅接受 PD / CC0 许可（CC BY-SA 一律跳过，避免署名纠纷）。
   用法: node 素材库/tools/fetch-pd.js
*/
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'img');
fs.mkdirSync(OUT, { recursive: true });

const UA = 'ShenEmbroideryDemo/1.0 (educational demo; contact: studio demo)';

const WANTED = [
  // [保存名, 精确文件名（File: 前缀省略）, 用途]
  ['gu-sansuan.jpg',   '顾绣三酸图镜片 局部.jpg',      'Heritage 历史镜：顾绣真迹局部'],
  ['gu-shouxing.jpg',  '顾绣寿星图 局部.jpg',          'Heritage：顾绣寿星'],
  ['han-huahui.jpg',   '韩希孟绣花卉虫鱼册 2.jpg',     '花鸟参考：韩希孟册页'],
  ['qianli.jpg',       '千里江山图.jpg',               '古画系列：王希孟原作'],
  ['daolian.jpg',      '捣练图.jpg',                   '古画系列：张萱原作'],
  ['guoguo.jpg',       '虢国夫人游春图.jpg',           '古画系列：原作'],
];

async function api(title) {
  const q = new URLSearchParams({
    action: 'query', titles: 'File:' + title, prop: 'imageinfo',
    iiprop: 'url|extmetadata|size', iiurlwidth: '1400', format: 'json'
  });
  const r = await fetch('https://commons.wikimedia.org/w/api.php?' + q, { headers: { 'User-Agent': UA } });
  return r.json();
}

(async () => {
  const credits = [];
  for (const [save, title, use] of WANTED) {
    try {
      const j = await api(title);
      const page = Object.values(j.query.pages)[0];
      if (page.missing !== undefined) { console.log('✗ 未找到:', title); continue; }
      const ii = page.imageinfo[0];
      const em = ii.extmetadata || {};
      const lic = (em.LicenseShortName || {}).value || '?';
      if (!/^pd|cc0|public domain/i.test(lic)) { console.log('跳过(许可):', title, '→', lic); continue; }
      const url = ii.thumburl || ii.url;
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) { console.log('✗ 下载失败:', title, r.status); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(path.join(OUT, save), buf);
      const artist = ((em.Artist || {}).value || '').replace(/<[^>]+>/g, '').trim().slice(0, 60);
      const credit = ((em.Credit || {}).value || '').replace(/<[^>]+>/g, '').trim().slice(0, 60);
      credits.push({ save, title, lic, artist, credit, use, w: ii.width, h: ii.height });
      console.log(`✓ ${save}  ${(buf.length / 1024).toFixed(0)}KB  [${lic}]  ${artist}`);
    } catch (e) { console.log('✗', title, e.message); }
  }
  fs.writeFileSync(path.join(OUT, 'credits.json'), JSON.stringify(credits, null, 2));
  console.log('\ncredits.json 已写入，共', credits.length, '张');
})();
