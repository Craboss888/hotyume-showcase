# HotYume 展示网页

这是一个独立、无第三方运行依赖的双页面作品集网站。首页负责品牌叙事，并在愿景区用纯代码实验图说明 HotYume 正在把内容变量与真实发布反馈连接成判断力闭环；`factory.html` 负责内容生产、商品发布与运营售后三套系统的同屏展示。首屏六组已经全部接入真实静态 / 动态壁纸；内容生产章已接入四张工作台实机截图，商品发布章已接入真实店铺主页、品牌视觉素材及娜美夏日版发布演示，运营章已接入自动回复与自动发货实机截图；尚未提供的其他素材继续使用设计占位槽。

在线展示：<https://craboss888.github.io/hotyume-showcase/>

## 本地预览

在本目录运行：

```bash
python3 -m http.server 8911 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:8911`。

页面脚本和视频必须通过本地服务加载。服务运行时可以直接双击 `index.html`，页面会立即转到 `http://127.0.0.1:8911/`；如果服务尚未运行，先执行上面的启动命令。

## 文件

- `index.html`：品牌首页、六台壁纸阵列、工厂入口、护城河与未来愿景。
- `factory.html`：AIGC 内容工厂子页面；三章在固定控制台视窗内切换。
- `assets/base.css`：设计 token、全局规则、导航、首屏与项目命题。
- `assets/production.css`：章节导航、生产流水线、Agent、合规与 LIVP。
- `assets/brand-store.css`：店铺介绍与品牌视觉系统。
- `assets/recommendation-lab.css`：推荐 Agent 的合成数据决策实验台。
- `assets/commercial.css`：发布、运营、竞争力、未来愿景与页脚。
- `assets/factory.css`：首页工厂入口、子页面控制台、章节切换与专属响应式规则。
- `assets/responsive.css`：动效、桌面/平板/手机布局与 reduced-motion。
- `assets/site.mjs`：六台壁纸独立切换、工厂章节切换、对比、发布与客服演示。
- `tests/site.test.mjs`：结构与纯交互逻辑测试。

## 素材替换清单

页面中的 `data-asset-slot` 是稳定素材标识。推荐按以下规格准备：

| 素材槽 | 内容 | 建议规格 |
|---|---|---|
| `hero-wallpaper-01` 至 `hero-wallpaper-06` | 六组静态壁纸 + 对应短视频 | 静态 1206×2622；视频 1080×1920，5–8 秒 |
| `workbench-overview` | 工作台全景截图或录屏 | 1920×1200；录屏 8–12 秒 |
| `crawler-agent-ui` | 抓取 Agent 界面 | 4:3 或 16:10 |
| `image-agent-before-after` | AI 加工前后或首尾帧 | 两张同尺寸竖图，或 4:3 界面截图 |
| `motion-agent-ui` | 三档动画方案与参数 | 4:3 界面截图 |
| `compliance-case-01/02/03` | 三组合规处理 Before/After | 每组两张同尺寸 3:2 图片 |
| `livp-experiment-evidence` | 实验记录、文件结构、真机证据拼图 | 16:10 |

### 已接入的内容生产实机截图

| 素材槽 | 实机画面 | 网页资源 |
|---|---|---|
| `workbench-overview` | 工作台海选池总览 | `assets/media/factory/workbench-overview.webp` |
| `crawler-agent-ui` | 壁纸抓取 Agent | `assets/media/factory/crawler-agent.webp` |
| `image-agent-before-after` | 图像加工与首帧 Agent | `assets/media/factory/image-agent.webp` |
| `motion-agent-ui` | 二次元动画师三档方案 | `assets/media/factory/motion-agent.webp` |

以上均来自 `127.0.0.1:8899` 的真实运行界面，原始验收截图保留在项目 `output/playwright/`；网页副本统一为 1920×1200 WebP，并按完整工作区或完整弹窗边界取景。

### 已接入的发布与品牌素材

| 内容 | 网页资源 |
|---|---|
| HotYume 小红书店铺主页 | `assets/media/publishing/store.webp` |
| 娜美夏日版商品原图 | `assets/media/publishing/nami-summer-product.webp` |
| 娜美夏日版小红书发布结果 | `assets/media/publishing/nami-summer-post-result.webp` |
| 霓虹主标 | `assets/media/publishing/logo-neon.webp` |
| 单色标识 | `assets/media/publishing/logo-black.webp` |
| 蝴蝶结交付贴纸 | `assets/media/publishing/sticker-oval.webp` |
| 作品编号牌 | `assets/media/publishing/watermark-white.webp` |

以上素材来自既有作品集、成品资产与用户提供的发布截图，均已转换为网页 WebP 副本；原始文件不修改。发布演示的文案 Agent 输出已按「标题 / 正文 / 标签」完整呈现，并保留发布截图中已有的标题与前两句正文。

### 已接入的运营实机截图

| 内容 | 网页资源 |
|---|---|
| 运营 Agent 自动回复 | `assets/media/operations/auto-reply.webp` |
| 下单后自动发货 | `assets/media/operations/auto-delivery.webp` |

两张素材均完整保留原始纵向聊天记录，网页副本分别为 851×1687 与 851×1684 WebP；自动回复截图中的用户头像已匿名处理，页面不再显示对应的流程演示占位。

### 已接入的首屏样例

| 素材槽 | 来源 | 网页静态图 | 网页动态预览 |
|---|---|---|---|
| `hero-wallpaper-01` | `参考/竞品样品 729` | `assets/media/wallpapers/729-still.webp` | `assets/media/wallpapers/729-live.mp4` |
| `hero-wallpaper-02` | `参考/816` | `assets/media/wallpapers/816-still.webp` | `assets/media/wallpapers/816-live.mp4` |
| `hero-wallpaper-03` | `06 待打包/009 红衣少女吃掉你` | `assets/media/wallpapers/009-still.webp` | `assets/media/wallpapers/009-live.mp4` |
| `hero-wallpaper-04` | `06 待打包/005 阿尼亚 樱花树下` | `assets/media/wallpapers/005-still.webp` | `assets/media/wallpapers/005-live.mp4` |
| `hero-wallpaper-05` | `06 待打包/011` | `assets/media/wallpapers/011-still.webp` | `assets/media/wallpapers/011-live.mp4` |
| `hero-wallpaper-06` | `07 成品壁纸/002 Nami` | `assets/media/wallpapers/002-still.webp` | `assets/media/wallpapers/002-live.mp4` |

网页副本统一为 720×1566。静态图使用 WebP；动态预览使用 H.264、30fps、无声循环并带 fast-start。原始交付包不修改，也不直接作为网页资源加载。

## 运行测试

```bash
node --test tests/site.test.mjs
node --check assets/site.mjs
```

## 替换原则

- 六张首屏卡彼此独立；真实媒体只有收到视频的 `playing` 事件后才显示 LIVE，再次点击回到 STILL 并复位，多张可以同时播放。标签重新可见时恢复仍请求 LIVE 的视频；播放失败则回退 STILL，不允许只剩扫光的假 LIVE 状态。
- 真实视频启动最多等待 2.5 秒；超过时间自动回退，页面不得永久停在 LOADING。
- 六张真实媒体均不叠加 `.live-wave` 人工扫光；LIVE 的运动只允许来自视频本身。
- 六台手机屏幕内部不显示作品编号、PREVIEW、媒体类型或分辨率；只保留画面和手机下方的 STILL / LIVE 状态。
- 首页三个入口分别深链到 `factory.html#production`、`#publishing`、`#operations`；工厂页切换章节时只替换内部内容视窗，不滚动浏览器页面。
- 所有真实媒体应复制进本目录下新建的 `assets/media/`，不要引用项目外绝对路径。
- 截图替换后保留现有圆角、边框和说明位置，避免让不同来源的画面破坏整体节奏。
- 对外展示前压缩图片与视频，并再次检查桌面端、手机端和 reduced-motion。
