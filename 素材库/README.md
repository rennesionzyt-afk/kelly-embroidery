# 静丝 Still Thread · 素材库

> 沈绣海外独立站 · 占位素材与设计元素
>
> **2026-11-22 图片修订：** `沈绣海外独立站01.html` 已切换至下列图册图片与明确标注的原创插图。旧 `img/` 中的古画原作和程序占位图保留备查，当前首页不再将其作为商品图片。
>
> | 目录 | 当前用途 | 来源 / 重建 |
> |---|---|---|
> | `catalogue/` | 首屏荷塘、作品与绣屏、圆形座屏、服饰导航、图册陈列图 | 项目内凯利英文产品图册；页码、对应关系与限制见 `catalogue/source-index.csv` |
> | `editorial/` | 五个历史节点与三位绣工的技艺专题插图 | 原创 SVG；`node 素材库/editorial/generate.cjs` |
> | `atlas/` | 针路示意、五代工具小图、五种礼赠纹样、玉兰纹样与期刊插图 | 原创 SVG；`node 素材库/tools/build-needle-atlas.js` |
>
> 图册中的荷花四扇屏不是《玉兰花地屏》：已改为荷花屏名称；玉兰故事只用明确标注的植物纹样插图。圆形座屏不据图认定红木、双面工艺或具体款号。三位绣工图是技艺专题插图，不是肖像或其本人作品的证据。原页面的商品 A/B/C 级别仍为设计演示，不能据图片确认制作规格。
>
> 本地资源校验：`node tools/check-image-assets.cjs`。所有新增图片均从本地加载，不依赖外部图床。
>
> 以下原始说明主要针对 `t1-*` 质感与装饰资产。
>
> 配套：`../PRD-沈绣海外独立站.md` §4.5 静谧美学规范 · §7.3 占位素材策略 · 附录 G 动效规格总表
> 设计哲学：`00-设计哲学-静丝.md`

---

## 一、这是什么

一套**程序化生成**的中式质感素材：丝、纸、墨、朱。
全部由本目录 `tools/` 下的两个 Node 脚本产出，无第三方依赖、无 AI 出图、无版权来源问题。

**它们是氛围，不是证据。**

| ✅ 用途 | ❌ 禁止用途 |
|---|---|
| 页面背景层、章节过渡底纹 | 商品主图 |
| 装饰性印章、线稿图形 | 人物肖像（任何形态） |
| 呼吸屏的底纹与留白陪衬 | 任何带价格的场景 |
| 3D 场景的贴图（如绣绷绢面） | 暗示为"凯利作品"的画面 |
| 卡片/抽屉的空位占位 | 代替真实工艺特写证据 |

> **红线**：AI 或程序生成的图像**不得**被用作商品照片或人物肖像。真实商品的证据只能来自实拍（见 PRD §7.1 三铁律）。

---

## 二、素材清单

### 2.1 矢量交付（**网页实际使用**）

| 文件 | 尺寸 | 说明 | 建议用法 |
|---|---|---|---|
| `t1-silk-navy.svg` | 1600×900 | 深藏青丝面：细密经线 + 缓慢张力摆动 + 暗角 | 深色叙事段背景层，`opacity .35–.6`，`background-size: cover` |
| `t1-silk-cream.svg` | 1600×900 | 米白丝面：同构，暖白底 | 纸底 section 的极淡底纹，`opacity .25–.4` |
| `t1-thread-field.svg` | 1600×900 | **46 条流动丝线**（含描金高光），26s 循环 | Tier 1 静态背景 / Hero 层；`prefers-reduced-motion` 下自动静止 |
| `t1-stitch-grid.svg` | 1600×900 | 平针走向的针脚网格（隔行错位 9px） | 工艺段底纹，`opacity .5`（自身已含低透明度） |
| `t1-paper-grain.svg` | 1600×900 | `feTurbulence` 纸纹，opacity .045 | 全局 `body::after` 叠加层，`position:fixed; pointer-events:none` |
| `t1-thread-line.svg` | 1200×120 | **生长金线**：`stroke-dashoffset` 1800ms `cubic-bezier(.16,1,.3,1)` | 镜 01 Hero / 镜 03·08·10 的贯穿线 |
| `t1-hoop-line.svg` | 800×800 | **绣绷线稿**：双环 + 48 根张力线 + 绢面径向光 | 镜 05「匠·三针」CSS 3D 绷架贴图 |
| `t1-seal-square-4ch.svg` | 200×200 | 朱砂方印「展场示景」（右起竖读） | 分区页角标；与公司英文图册 P7/P11 同款 |
| `t1-seal-square-2ch.svg` | 200×200 | 朱砂方印「非遗」 | 非遗徽章、Heritage 页 |
| `t1-seal-round.svg` | 200×200 | 朱砂圆章「繁花似锦」（环形排字） | 与公司英文图册 P6 同款；章节起首 |

> **印章的字形依赖系统 CJK 字体**，SVG 中已指定 `Songti SC / STSong / SimSun / Noto Serif SC` 回退链。
> 若需完全一致的字形，需由公司提供篆体字库后重制（见 §五 待办）。

### 2.2 位图母版（**供设计参考 / 需要位图时转换**）

| 文件 | 尺寸 | 说明 |
|---|---|---|
| `t1-silk-navy.png` | 1600×900 | 深藏青丝面母版（含胶片颗粒与暗角） |
| `t1-silk-cream.png` | 1600×900 | 米白丝面母版 |
| `t1-ink-wash.png` | 1600×900 | 水墨晕染：4 处墨团，fbm 扰动轮廓 + 水痕边 |
| `t1-paper-grain.png` | 1600×900 RGBA | 纸纹叠加层（alpha ≤ .03） |

> ⚠️ **PNG 是母版，不是网页交付物。** 噪点会击穿 PNG 压缩率（1.1–1.7MB）。
> **上线前必须转 WebP/AVIF**（PRD §14.1 已规定 `<picture>` + 三格式）。本机无 cwebp/ffmpeg，
> 转换命令供你在有工具的环境执行：
> ```bash
> cwebp -q 82 -m 6 -resize 1600 0 t1-silk-navy.png -o t1-silk-navy.webp
> avifenc --min 20 --max 40 t1-silk-navy.png t1-silk-navy.avif
> ```
> 或直接**只用 SVG 版本**（推荐：1.5KB vs 1.1MB，且矢量在高分屏不糊）。

---

## 三、使用示例

```html
<!-- 1. 纸纹：全站叠加 -->
<style>
  body::after{
    content:""; position:fixed; inset:0; z-index:9999; pointer-events:none;
    background:url("/assets/t1-paper-grain.svg") repeat; opacity:.5;
  }
</style>

<!-- 2. 深色叙事段丝面底 -->
.shot-dark{
  background:
    linear-gradient(180deg, rgba(19,30,44,.92), rgba(10,17,27,.97)),
    url("/assets/t1-silk-navy.svg") center/cover;
}

<!-- 3. 镜 01 生长金线 -->
<svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 74 C210 74 300 46 470 46 C660 46 720 78 900 78 C1050 78 1110 62 1200 62"
        fill="none" stroke="#BF8A54" stroke-width="2" stroke-linecap="round"
        pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000"
        style="animation:grow 1800ms cubic-bezier(.16,1,.3,1) forwards"/>
</style>
<style>@keyframes grow{to{stroke-dashoffset:0}}
       @media (prefers-reduced-motion:reduce){path{animation:none;stroke-dashoffset:0}}</style>

<!-- 4. 印章（章节起首） -->
<img src="/assets/t1-seal-round.svg" width="40" height="40" alt="">
```

**颜色变量**（与 PRD §4.1 一致）
```
--c-navy:#131E2C  --c-night:#0A111B  --c-gold:#BF8A54  --c-gold-soft:#C18D5A
--c-bronze:#95785E --c-paper:#F7F4EE --c-cream:#E2D8D3 --c-cinnabar:#A8352A
```

---

## 四、重新生成

```bash
cd 素材库/tools
node gen-textures.js   # → 4 个 PNG 母版
node gen-svg.js        # → 10 个 SVG 交付物
```
仅用 Node 内置模块（`fs` / `zlib` / `path`），**无 npm 依赖**，无网络请求。

参数集中在脚本顶部：
- `gen-textures.js` → `silk()` 的 `thread / sheen / weft / warpAmt / grain / vignette / seed`
- `gen-svg.js` → 顶部的 `C` 色板常量；丝线场的 `46` 条线与 `26s` 循环在 `t1-thread-field.svg` 段

---

## 五、待办（需公司提供）

| # | 事项 | 影响 |
|---|---|---|
| 1 | **篆体字库**（或授权字形） | 印章字形目前依赖系统字体，跨平台不一致 |
| 2 | **T2 公有领域历史绣品** | 顾绣《顾绣三酸图镜片》局部（4361×5024）、韩希孟《花卉虫鱼册》等（Wikimedia Commons，PD-old-100），**必须带图注出处** |
| 3 | **T3 商品位空位卡** | 带完整规格文字的"待拍"卡，待实拍到位即替换 |
| 4 | **T4 人物线稿占位** | 剪影/线稿 + 姓名，**不得拟人化**（PRD §7.3.1 红线） |
| 5 | **实拍替换清单** | 见 PRD 附录 B；本套素材仅在实拍到位前承担背景与装饰职责 |

---

## 六、占位标识要求

素材未替换前，页面上出现占位素材的地方**必须**带：

```
12px  铜色 #95785E  小标签   "PLACEHOLDER"
```

正式上线前逐项清除。此规则已写入 PRD §13.3（状态设计）与 §16.6（验收）。
