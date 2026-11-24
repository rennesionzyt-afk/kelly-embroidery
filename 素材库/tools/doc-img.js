// 把 img/ 目录文档写入素材库 README
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('img/ 目录')) { console.log('已存在，跳过'); process.exit(0); }
const ins = [
  '## 四点五、img/ 目录（demo 用图，2026-11-20 新增）',
  '',
  '**公有领域真品（维基共享资源，Public Domain；页面上必须带图注）**',
  '',
  '| 文件 | 作品 | 用途 |',
  '|---|---|---|',
  '| gu-sansuan.jpg | 顾绣《三酸图》镜片局部（清） | Hero 右图、1914 历史卡 |',
  '| gu-shouxing.jpg | 顾绣《寿星图》局部（清） | 1921 历史卡 |',
  '| han-huahui.jpg | 韩希孟《花卉虫鱼册》2（17 世纪） | 1915 历史卡 |',
  '| guoguo.jpg | 张萱《虢国夫人游春图》（唐） | 古画系列商品卡 |',
  '| daolian.jpg | 张萱《捣练图》（唐） | 古画系列商品卡 |',
  '| qianli.jpg | 王希孟《千里江山图》（宋） | 千里江山卡、2025 历史卡 |',
  '',
  '> 许可与来源元数据见 `img/credits.json`；抓取脚本 `tools/fetch-pd.js`（只接受 PD/CC0）。',
  '',
  '**程序化"针法母题"（SDF+自动针迹生成，非照片、非 AI 出图）——插画占位，带 PLACEHOLDER 标签**',
  '',
  '| 文件 | 母题 | 用途 |',
  '|---|---|---|',
  '| motif-magnolia.png | 玉兰屏（藏青绢底） | 镜08 主作、商品卡 |',
  '| motif-kingfisher.png | 翠鸟荷花 | 商品卡 |',
  '| motif-round.png | 圆形摆件（圆窗花卉） | 商品卡 |',
  '| motif-sheen.png | 丝与光 | Journal 缩略 |',
  '| swatch-rotating/santanua/gold.png | 旋转针/散套/盘金 技法样张 | 镜05 技法卡 |',
  '| tile-crane/pair/koi/guard/plum.png | 松鹤/双鹊/锦鲤/云雷/白梅 | 镜10 礼赠瓷砖 |',
  '',
  '> 生成器 `tools/gen-motifs.js`（纯 Node，零依赖）。**这些是插画不是商品照**——上线前由实拍替换（PRD §7.3.1 红线）。',
  '',
  '---',
  '',
  ''].join('\n');
const a = '## 五、待办（需公司提供）';
if (!s.includes(a)) { console.log('!! anchor missing'); process.exit(1); }
s = s.replace(a, ins + a);
fs.writeFileSync(p, s);
console.log('✓ README 已更新');
