import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import * as site from '../assets/site.mjs';

const {
  activateFactoryChapter,
  activateChoice,
  clampComparison,
  nextPublishStep,
  resolveWallpaperPlayback,
  supportReply,
  toggleWallpaperState,
  WALLPAPER_PLAYBACK_TIMEOUT_MS,
  wallpaperMediaCommand,
} = site;

const root = new URL('../', import.meta.url);
const styleFiles = [
  'assets/base.css',
  'assets/production.css',
  'assets/commercial.css',
  'assets/responsive.css',
];

async function readStyles() {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match => match[1]);
  const normalized = links.map(link => link.split('?')[0]);
  for (const file of styleFiles) assert.ok(normalized.includes(file), `首页缺少 ${file}`);
  return Promise.all(styleFiles.map(file => readFile(new URL(file, root), 'utf8')));
}

test('首页与工厂子页面各自承担清晰的叙事职责', async () => {
  const home = await readFile(new URL('index.html', root), 'utf8');
  const factory = await readFile(new URL('factory.html', root), 'utf8').catch(() => '');
  for (const id of ['hero', 'factory', 'factory-entry', 'moat', 'vision']) {
    assert.match(home, new RegExp(`id=["']${id}["']`), `首页缺少 #${id}`);
  }
  for (const id of ['production', 'publishing', 'operations']) {
    assert.doesNotMatch(home, new RegExp(`id=["']${id}["']`), `首页仍包含 #${id}`);
    assert.match(factory, new RegExp(`id=["']${id}["']`), `工厂页缺少 #${id}`);
  }
});

test('首屏以 AI 原生品牌和内容生产力作为核心定位', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /class="eyebrow"[\s\S]*data-hotyume-wordmark[\s\S]*AI-NATIVE CONTENT BRAND<\/p>/);
  assert.match(html, /一个品牌[，,]/);
  assert.match(html, /AI 内容生产力/);
  assert.match(html, /持续运转的[\s\S]*AIGC 内容工厂/);
  assert.doesNotMatch(html, /把一张图/);
});

test('首屏提供六张可操作的壁纸唤醒卡', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const cards = html.match(/data-wallpaper-card/g) ?? [];
  assert.equal(cards.length, 6);
  assert.match(html, /aria-pressed=/);
});

test('壁纸互动提示使用品牌化的唤醒文案', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /轻触屏幕，唤醒一场梦。/);
  assert.doesNotMatch(html, /点击屏幕，独立切换 LIVE \/ STILL/);
});

test('壁纸互动提示居中并靠近手机阵列', async () => {
  const css = await readFile(new URL('assets/base.css', root), 'utf8');
  const responsive = await readFile(new URL('assets/responsive.css', root), 'utf8');
  const stageHint = css.match(/\.stage-hint\s*\{([^}]*)\}/s)?.[1] ?? '';
  assert.match(stageHint, /width:\s*min\(760px,\s*100%\)/);
  assert.match(stageHint, /justify-content:\s*center/);
  assert.match(stageHint, /margin:\s*0 auto 20px/);
  assert.match(stageHint, /transform:\s*translateY\(36px\)/);
  assert.match(responsive, /@media \(max-width:760px\)[\s\S]*\.stage-hint\s*\{[^}]*transform:\s*translateY\(8px\)/s);
});

test('首屏突出 AIGC 内容工厂并删除装饰性数字和状态轨道', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /data-factory-highlight[^>]*>AIGC 内容工厂</);
  assert.doesNotMatch(html, /class="hero-proof"/);
  assert.doesNotMatch(html, /class="pulse-rail"/);
  assert.doesNotMatch(html, /stage pipeline|production agents|livp experiments/i);
});

test('首页提供三个可深链到工厂子页面的入口', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  for (const chapter of ['production', 'publishing', 'operations']) {
    assert.match(html, new RegExp(`href=["']factory\\.html#${chapter}["']`));
  }
});

test('首页工厂入口只保留三张章节卡', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.equal((html.match(/class="factory-entry-grid/g) ?? []).length, 1);
  assert.doesNotMatch(html, /factory-entry-cta|查看完整生产系统|OPEN THE FACTORY/);
});

test('愿景以动态壁纸为起点并高亮内容供给网络', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const css = await readFile(new URL('assets/commercial.css', root), 'utf8');
  assert.match(html, /以动态壁纸为起点，<br>构建<em>内容供给网络。<\/em>/);
  assert.match(css, /\.vision h2 em\s*\{[^}]*color:\s*var\(--hot-coral\)/s);
});

test('愿景以纯代码实验图呈现正在形成的内容判断力', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const css = await readFile(new URL('assets/commercial.css', root), 'utf8');
  const start = html.indexOf('<article class="judgment-lab');
  const end = html.indexOf('</article>', start);
  const lab = start >= 0 && end >= 0 ? html.slice(start, end) : '';

  assert.match(lab, /IN PROGRESS \/ JUDGMENT LOOP/);
  assert.match(lab, /当生成不再稀缺，<em>判断才是壁垒。<\/em>/);
  assert.match(lab, /AIGC 把内容生产从稀缺变成过剩。/);
  assert.match(lab, /模型的能力终会拉平/);
  assert.doesNotMatch(lab, /模型能力人人都能获得/);
  assert.match(lab, /真正拉开差距的，不是谁生成得更多，而是谁更早知道什么值得做。/);
  assert.match(lab, /IP、构图、人物占比、画风与动效/);
  assert.match(lab, /每一次发布，都让真实反馈回到下一轮选题、生成与分发。/);
  assert.match(lab, /积累的不是更多图片，而是一套关于「什么能吸引注意力」的判断。/);
  assert.match(lab, /class="judgment-story"/);
  for (const label of ['IP', 'COMPOSITION', 'SCALE', 'STYLE', 'MOTION']) {
    assert.match(lab, new RegExp(`>${label}<`));
  }
  assert.match(lab, /GENERATE/);
  assert.match(lab, /PUBLISH/);
  assert.match(lab, /LEARN/);
  assert.match(lab, /CHOOSE/);
  assert.doesNotMatch(lab, /<img\b|data-asset-slot|\d+%/);
  assert.match(css, /\.judgment-lab\s*\{/);
  assert.match(css, /\.judgment-visual\s*\{/);
});

test('判断力实验图在手机端保留横向变量轨道与双行结论', async () => {
  const css = await readFile(new URL('assets/responsive.css', root), 'utf8');
  assert.match(css, /@media \(max-width:760px\)[\s\S]*\.judgment-visual__body\s*\{[^}]*grid-template-columns:\s*minmax\(112px,\s*0\.72fr\)\s+minmax\(36px,\s*0\.22fr\)\s+minmax\(174px,\s*1\.06fr\)/s);
  assert.match(css, /@media \(max-width:760px\)[\s\S]*\.judgment-result strong\s*\{[^}]*font-size:\s*32px/s);
  assert.match(css, /@media \(max-width:760px\)[\s\S]*\.judgment-variables span::after\s*\{[^}]*width:\s*36px/s);
});

test('结尾命题只高亮持续生产分发和学习', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /而是一套<em>持续生产、分发和学习<\/em>的内容供给系统。/);
  assert.doesNotMatch(html, /<em>而是一套持续生产、分发和学习的内容供给系统。<\/em>/);
});

test('所有可见 HotYume 统一使用无商标符号的品牌字标', async () => {
  const home = await readFile(new URL('index.html', root), 'utf8');
  const factory = await readFile(new URL('factory.html', root), 'utf8');
  const css = await readFile(new URL('assets/base.css', root), 'utf8');
  const productionCss = await readFile(new URL('assets/production.css', root), 'utf8');
  assert.equal((home.match(/data-hotyume-wordmark/g) ?? []).length, 7);
  assert.equal((factory.match(/data-hotyume-wordmark/g) ?? []).length, 3);
  assert.match(css, /\.hotyume-wordmark--logo/);
  assert.match(css, /\.hotyume-wordmark--inline/);
  assert.match(css, /\.hotyume-wordmark--utility/);
  assert.match(productionCss, /\.browser-bar\s*>\s*span/);
  assert.doesNotMatch(`${home}\n${factory}`, /[®™]/);
});

test('HotYume 品牌字标使用网站内置的真实像素字体', async () => {
  const css = await readFile(new URL('assets/base.css', root), 'utf8');
  const font = await readFile(new URL('assets/fonts/silkscreen-bold.woff2', root)).catch(() => Buffer.alloc(0));
  assert.ok(font.byteLength > 1000, '缺少随网站加载的像素字体文件');
  assert.match(css, /@font-face\s*\{[^}]*font-family:\s*"HotYume Pixel"[^}]*url\("fonts\/silkscreen-bold\.woff2"\)/s);
  assert.match(css, /--font-brand-pixel:\s*"HotYume Pixel"/);
  assert.match(css, /\.hotyume-wordmark__hot,\s*\.hotyume-wordmark__yume\s*\{[^}]*font-family:\s*var\(--font-brand-pixel\)/s);
});

test('HotYume 字标尺寸更醒目且像素字形保持挺拔', async () => {
  const css = await readFile(new URL('assets/base.css', root), 'utf8');
  const responsive = await readFile(new URL('assets/responsive.css', root), 'utf8');
  assert.match(css, /\.hotyume-wordmark__hot,\s*\.hotyume-wordmark__yume\s*\{[^}]*transform:\s*scaleY\(1\.12\)/s);
  assert.match(css, /\.hotyume-wordmark--logo \.hotyume-wordmark__hot,\s*\.hotyume-wordmark--logo \.hotyume-wordmark__yume\s*\{[^}]*font-size:\s*26px/s);
  assert.match(css, /\.hotyume-wordmark--inline[\s\S]*font-size:\s*0\.92em/);
  assert.match(responsive, /\.hotyume-wordmark--logo \.hotyume-wordmark__hot,\s*\.hotyume-wordmark--logo \.hotyume-wordmark__yume\s*\{[^}]*font-size:\s*22px/s);
});

test('首页后半段四组命题使用克制的展示字号', async () => {
  const base = await readFile(new URL('assets/base.css', root), 'utf8');
  const commercial = await readFile(new URL('assets/commercial.css', root), 'utf8');
  const responsive = await readFile(new URL('assets/responsive.css', root), 'utf8');
  assert.match(base, /\.thesis h2\s*\{[^}]*font-size:\s*clamp\(54px,\s*6vw,\s*104px\)/s);
  assert.match(base, /\.thesis-body \.lead\s*\{[^}]*font-size:\s*clamp\(20px,\s*1\.8vw,\s*30px\)/s);
  assert.match(commercial, /\.moat-head h2\s*\{[^}]*font-size:\s*clamp\(48px,\s*5\.4vw,\s*88px\)/s);
  assert.match(commercial, /\.vision h2\s*\{[^}]*font-size:\s*clamp\(48px,\s*5vw,\s*84px\)/s);
  assert.match(commercial, /\.closing-thesis\s*\{[^}]*font-size:\s*clamp\(36px,\s*4vw,\s*68px\)/s);
  assert.match(responsive, /\.thesis h2,[\s\S]*\.vision h2\s*\{[^}]*font-size:\s*clamp\(42px,\s*13vw,\s*60px\)/s);
  assert.match(responsive, /\.closing-thesis\s*\{[^}]*font-size:\s*36px/s);
});

test('首页用紧凑闭环解释内容工厂且不展示个人履历信息', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /审美形成壁垒，品牌积累价值，系统复制规模。/);
  assert.equal((html.match(/data-system-step/g) ?? []).length, 5);
  for (const label of ['内容发现', 'Agent 生产', '商品化交付', '分发运营', '数据反馈']) {
    assert.match(html, new RegExp(label));
  }
  assert.doesNotMatch(html, /class=["']role-strip["']/);
  assert.doesNotMatch(html, /INDEPENDENT PROJECT|产品策略 · Agent 工作流|2026\.03 — NOW/);
});

test('素材占位槽包含可替换标识与规格', async () => {
  const html = [
    await readFile(new URL('index.html', root), 'utf8'),
    await readFile(new URL('factory.html', root), 'utf8'),
  ].join('\n');
  const slots = html.match(/data-asset-slot=/g) ?? [];
  assert.ok(slots.length >= 12, `素材槽数量不足：${slots.length}`);
  assert.match(html, /data-asset-ratio=/);
});

test('每台壁纸独立切换且不关闭其他动态项', () => {
  assert.equal(typeof toggleWallpaperState, 'function');
  assert.deepEqual(toggleWallpaperState(['still', 'live', 'still'], 0), ['live', 'live', 'still']);
  assert.deepEqual(toggleWallpaperState(['live', 'live', 'still'], 1), ['live', 'still', 'still']);
});

test('六台首页壁纸全部使用真实的静态图和网页动态预览', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  for (const id of ['729', '816', '005', '009', '011', '002']) {
    assert.match(html, new RegExp(`assets/media/wallpapers/${id}-still\\.webp`));
    assert.match(html, new RegExp(`assets/media/wallpapers/${id}-live\\.mp4`));
  }
  assert.equal((html.match(/data-wallpaper-video/g) ?? []).length, 6);
  assert.match(html, /muted loop playsinline/);
  assert.match(html, /phone-card-c[\s\S]*?切换 009 壁纸[\s\S]*?009-still\.webp/);
  assert.match(html, /phone-card-d[\s\S]*?切换 005 壁纸[\s\S]*?005-still\.webp/);
});

test('真实壁纸进入 LIVE 后不叠加人工扫光', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  for (const id of ['729', '816', '005', '009', '011', '002']) {
    const card = html.match(new RegExp(`<button[^>]+切换 ${id} 壁纸[\\s\\S]+?</button>`))?.[0] ?? '';
    assert.doesNotMatch(card, /live-wave/);
  }
  assert.equal((html.match(/class="live-wave"/g) ?? []).length, 0);
});

test('六台手机屏幕不显示编号与媒体规格文字', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.doesNotMatch(html, /class="asset-index"/);
  assert.doesNotMatch(html, /class="asset-spec"/);
  assert.doesNotMatch(html, /WALLPAPER 0[1-6]|PREVIEW|STATIC \+ [45]/);
});

test('壁纸媒体指令在 LIVE 时播放，在 STILL 时暂停并复位', () => {
  assert.equal(typeof wallpaperMediaCommand, 'function');
  assert.deepEqual(wallpaperMediaCommand('live'), { play: true, reset: false });
  assert.deepEqual(wallpaperMediaCommand('still'), { play: false, reset: true });
});

test('真实视频只有开始播放后才显示 LIVE', () => {
  assert.equal(typeof resolveWallpaperPlayback, 'function');
  assert.equal(resolveWallpaperPlayback('live', 'request', true), 'loading');
  assert.equal(resolveWallpaperPlayback('live', 'playing', true), 'live');
  assert.equal(resolveWallpaperPlayback('live', 'pause', false), 'waiting');
  assert.equal(resolveWallpaperPlayback('live', 'pause', true), 'retry');
  assert.equal(resolveWallpaperPlayback('live', 'error', true), 'still');
  assert.equal(resolveWallpaperPlayback('still', 'playing', true), 'still');
});

test('首页监听真实媒体状态并在页面重新可见时续播', async () => {
  const script = await readFile(new URL('assets/site.mjs', root), 'utf8');
  assert.match(script, /addEventListener\(['"]playing['"]/);
  assert.match(script, /addEventListener\(['"]pause['"]/);
  assert.match(script, /addEventListener\(['"]visibilitychange['"]/);
  assert.match(script, /addEventListener\(['"]pageshow['"]/);
});

test('视频启动等待有明确超时，不会永久停在 LOADING', () => {
  assert.equal(typeof WALLPAPER_PLAYBACK_TIMEOUT_MS, 'number');
  assert.ok(WALLPAPER_PLAYBACK_TIMEOUT_MS >= 1000 && WALLPAPER_PLAYBACK_TIMEOUT_MS <= 5000);
});

test('直接双击首页时立即转到本地服务地址', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /location\.protocol\s*===\s*['"]file:['"]/);
  assert.match(html, /http:\/\/127\.0\.0\.1:8911\//);
  assert.match(html, /location\.replace\(/);
});

test('工厂页三个章节使用同屏面板而不是锚点滚动', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8').catch(() => '');
  assert.equal((html.match(/data-factory-target=/g) ?? []).length, 3);
  assert.equal((html.match(/data-factory-panel=/g) ?? []).length, 3);
  assert.match(html, /data-factory-scroll/);
  assert.doesNotMatch(await readFile(new URL('assets/site.mjs', root), 'utf8'), /window\.scrollTo|scrollIntoView/);
});

test('工厂三幕主标题使用克制字号并高亮叙事关键词', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  const css = await readFile(new URL('assets/production.css', root), 'utf8');
  for (const copy of ['动态资产', '商品', '持续关系']) {
    assert.match(html, new RegExp(`<span class="title-accent">${copy}</span>`));
  }
  assert.match(css, /\.chapter-head h2\s*\{[^}]*font-size:\s*clamp\(48px,\s*5vw,\s*82px\)/s);
  assert.match(css, /\.title-accent\s*\{[^}]*color:\s*var\(--hot-coral\)/s);
});

test('工厂页章节标签同时显示中英文名称', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  const css = await readFile(new URL('assets/factory.css', root), 'utf8');
  for (const [english, chinese] of [
    ['Content Production', '内容生产'],
    ['Publishing', '商品发布'],
    ['Operations', '运营与售后'],
  ]) {
    assert.match(html, new RegExp(`<strong>${english}<\\/strong>\\s*<small>${chinese}<\\/small>`));
  }
  assert.match(css, /\.factory-tabs small\s*\{[^}]*display:\s*block/s);
  assert.match(css, /\.factory-tabs strong,[\s\S]*\.factory-tabs small\s*\{[^}]*font-size:\s*12px/s);
  assert.match(css, /\.factory-tabs small\s*\{[^}]*font-size:\s*14px[^}]*font-weight:\s*600/s);
  assert.match(css, /\.factory-tabs small\s*\{[^}]*color:\s*rgba\(245,\s*244,\s*247,\s*0\.72\)/s);
  assert.match(css, /\.factory-tabs button\s*\{[^}]*color:\s*rgba\(245,\s*244,\s*247,\s*0\.78\)/s);
});

test('内容生产章节使用四张真实工作台实机截图', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  for (const asset of [
    'workbench-overview.webp',
    'crawler-agent.webp',
    'image-agent.webp',
    'motion-agent.webp',
  ]) {
    assert.match(html, new RegExp(`assets/media/factory/${asset}`));
    const image = await readFile(new URL(`assets/media/factory/${asset}`, root)).catch(() => Buffer.alloc(0));
    assert.ok(image.byteLength > 20_000, `${asset} 不是有效的实机截图`);
  }
  assert.equal((html.match(/class="factory-real-shot"/g) ?? []).length, 4);
  assert.equal((html.match(/class="factory-real-shot"[^>]+width="1920" height="1200"/g) ?? []).length, 4);
});

test('打码模块使用最新的样本规模、双 Agent 迭代与可用率指标', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  assert.match(html, /<b>100<\/b>人工标注样本/);
  assert.match(html, /<b>双 Agent<\/b>持续迭代/);
  assert.match(html, /<b>50%<\/b>打码可用率提高/);
  assert.doesNotMatch(html, /V9 → V12|10 \/ 10/);
});

test('打码模块改为 HotYume 风格双 Agent 流程图且暂不展示案例', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  const css = await readFile(new URL('assets/mask-flow.css', root), 'utf8');
  for (const copy of ['多模型检测', 'SAM2 分割', '打码 Agent', '评价 Agent', '未达标', '100 张标准答案']) {
    assert.match(html, new RegExp(copy));
  }
  assert.match(html, /class="mask-flow"/);
  assert.match(css, /\.mask-flow\s*\{/);
  assert.doesNotMatch(html, /data-comparison|compliance-case-0[123]|三组合规处理案例|精准处理结果占位图/);
});

test('LIVP 模块使用逆向工程实验台而不是截图占位', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  const css = await readFile(new URL('assets/livp-lab.css', root), 'utf8').catch(() => '');
  for (const copy of ['48 NAMED EXPERIMENTS', 'ZIP_STORED', '56-BYTE COMMENT', 'CONTENT IDENTIFIER', '17-DIGIT NAME', 'iOS 相册', 'LIVE']) {
    assert.match(html, new RegExp(copy));
  }
  assert.match(html, /没有现成 Know-how，[\s\S]*48 次实验，[\s\S]*跑通一条交付链路。/);
  assert.match(html, /48 次可复验实验/);
  assert.match(html, /class="livp-lab"/);
  assert.match(css, /\.livp-lab\s*\{/);
  assert.doesNotMatch(html, /data-asset-slot="livp-experiment-evidence"|PLACEHOLDER \/ 实验记录/);
});

test('商品发布章节展示真实 HotYume 店铺与品牌视觉资产', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  const css = await readFile(new URL('assets/brand-store.css', root), 'utf8').catch(() => '');
  for (const asset of [
    'store.webp',
    'logo-neon.webp',
    'logo-black.webp',
    'sticker-oval.webp',
    'watermark-white.webp',
  ]) {
    assert.match(html, new RegExp(`assets/media/publishing/${asset}`));
    const image = await readFile(new URL(`assets/media/publishing/${asset}`, root)).catch(() => Buffer.alloc(0));
    assert.ok(image.byteLength > 10_000, `${asset} 不是有效的品牌视觉素材`);
  }
  assert.match(html, /class="store-intro/);
  assert.match(html, /class="brand-system/);
  assert.match(html, /\*由于平台监管加强，店铺暂时无法访问，正在申诉中/);
  assert.match(css, /\.store-intro\s*\{/);
  assert.match(css, /\.brand-system\s*\{/);
  assert.match(css, /\.brand-asset--sticker,[\s\S]*\.brand-asset--watermark\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s+auto/s);
  assert.match(css, /\.brand-asset--sticker figcaption,[\s\S]*\.brand-asset--watermark figcaption\s*\{[^}]*position:\s*relative[^}]*border-top:\s*0/s);
});

test('发布演示使用与帖子一致的娜美夏日原图、完整文案与真实发布结果', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  for (const asset of ['nami-summer-product.webp', 'nami-summer-post-result.webp']) {
    assert.match(html, new RegExp(`assets/media/publishing/${asset}`));
    const image = await readFile(new URL(`assets/media/publishing/${asset}`, root)).catch(() => Buffer.alloc(0));
    assert.ok(image.byteLength > 20_000, `${asset} 不是有效的发布素材`);
  }
  assert.doesNotMatch(html, /PRODUCT 001|INPUT \/ 001|娜美 001|nami-001-/);
  assert.match(html, /AI动态壁纸 · 娜美夏日版/);
  assert.match(html, /用 AI 给娜美做了一张夏日风格的动态锁屏壁纸🌊/);
  assert.match(html, /可灵 AI 生成，正放 \+ 倒放无缝循环，挂在锁屏上会一直动/);
  for (const tag of ['#AI动态壁纸', '#娜美', '#海贼王', '#iPhone壁纸', '#实况壁纸']) {
    assert.match(html, new RegExp(tag));
  }
  assert.doesNotMatch(html, /data-asset-slot="publish-product-card"|data-asset-slot="xiaohongshu-post-result"/);
});

test('推荐 Agent 使用纯代码决策实验台且不依赖真实素材', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  const css = await readFile(new URL('assets/recommendation-lab.css', root), 'utf8').catch(() => '');
  for (const copy of ['USER / 017', 'IP', 'STYLE', 'COLOR', 'MOTION', 'HISTORY', 'MATCH / 92%', 'TARGETED PUSH']) {
    assert.match(html, new RegExp(copy));
  }
  assert.match(html, /class="recommendation-lab"/);
  assert.match(css, /\.recommendation-lab\s*\{/);
  assert.doesNotMatch(html, /data-asset-slot="recommendation-agent-concept"|PLACEHOLDER \/ 推荐 Agent 概念图/);
  const start = html.indexOf('<div class="recommendation-lab"');
  const lab = html.slice(start, html.indexOf('</article>', start));
  assert.doesNotMatch(lab, /<img\b/);
});

test('运营章节使用自动回复与自动发货真实截图', async () => {
  const html = await readFile(new URL('factory.html', root), 'utf8');
  const css = await readFile(new URL('assets/commercial.css', root), 'utf8');
  for (const asset of ['auto-reply.webp', 'auto-delivery.webp']) {
    assert.match(html, new RegExp(`assets/media/operations/${asset}`));
    const image = await readFile(new URL(`assets/media/operations/${asset}`, root)).catch(() => Buffer.alloc(0));
    assert.ok(image.byteLength > 20_000, `${asset} 不是有效的运营截图`);
  }
  assert.match(html, /auto-reply\.webp\?v=20260824c/);
  assert.match(html, /用户头像已匿名处理/);
  assert.match(html, /<span>自动回复<\/span>/);
  assert.match(html, /<span>自动发货<\/span>/);
  assert.doesNotMatch(html, /<small>实机截图<\/small>/);
  assert.doesNotMatch(html, /class="faq-line"|class="delivery-meta"/);
  assert.match(css, /\.ops-top\s*>\s*span\s*\{[^}]*font-size:\s*clamp\(/s);
  assert.equal((html.match(/class="ops-real-shot"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /data-asset-slot="customer-support-demo"|data-asset-slot="order-delivery-demo"/);
  assert.doesNotMatch(html, /class="chat-window|class="delivery-visual/);
});

test('章节状态只激活指定的工厂面板', () => {
  assert.equal(typeof activateFactoryChapter, 'function');
  assert.deepEqual(
    activateFactoryChapter(['production', 'publishing', 'operations'], 'publishing'),
    [false, true, false],
  );
});

test('对比分界线限制在可读范围', () => {
  assert.equal(clampComparison(-20), 5);
  assert.equal(clampComparison(52), 52);
  assert.equal(clampComparison(180), 95);
});

test('发布演示按生成文案、发布、结果循环推进', () => {
  assert.equal(nextPublishStep('product'), 'copy');
  assert.equal(nextPublishStep('copy'), 'publish');
  assert.equal(nextPublishStep('publish'), 'result');
  assert.equal(nextPublishStep('result'), 'product');
});

test('案例选择只激活指定选项', () => {
  assert.equal(typeof activateChoice, 'function');
  assert.deepEqual(activateChoice(3, 1), [false, true, false]);
});

test('客服快捷回复返回对应排查建议', () => {
  assert.equal(typeof supportReply, 'function');
  assert.match(supportReply('iPhone'), /设置.*墙纸/);
  assert.match(supportReply('Android'), /动态壁纸/);
  assert.match(supportReply('重新获取'), /下载链接/);
});

test('样式包含可访问性与响应式保护', async () => {
  const css = (await readStyles()).join('\n');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media[^{}]*max-width\s*:\s*760px/);
});

test('首屏文字栏为品牌口号保留足够的桌面宽度', async () => {
  const css = (await readStyles()).join('\n');
  assert.match(css, /\.hero-copy\s*\{[^}]*padding-right:\s*clamp\(20px,\s*3\.5vw,\s*60px\)/s);
});

test('首屏核心样式带版本标记以避免演示浏览器沿用旧缓存', async () => {
  const pages = [
    await readFile(new URL('index.html', root), 'utf8'),
    await readFile(new URL('factory.html', root), 'utf8'),
  ];
  for (const html of pages) {
    assert.match(html, /assets\/base\.css\?v=\d+[a-z]?/);
    assert.match(html, /assets\/production\.css\?v=20260824a/);
  }
  assert.match(pages[1], /assets\/mask-flow\.css\?v=20260823a/);
  assert.match(pages[1], /assets\/livp-lab\.css\?v=20260823a/);
  assert.match(pages[1], /assets\/brand-store\.css\?v=20260824c/);
  assert.match(pages[1], /assets\/recommendation-lab\.css\?v=20260824a/);
});

test('工厂入口为中英文品牌标题保留足够的主栏宽度', async () => {
  const css = await readFile(new URL('assets/factory.css', root), 'utf8');
  assert.match(css, /\.factory-entry-head\s*\{[^}]*grid-template-columns:\s*1\.05fr\s+0\.95fr/s);
  assert.match(css, /\.factory-entry-head h2\s*\{[^}]*font-size:\s*clamp\(60px,\s*6vw,\s*104px\)/s);
});

test('工厂页返回入口固定在页头右侧', async () => {
  const css = await readFile(new URL('assets/factory.css', root), 'utf8');
  assert.match(css, /\.factory-back\s*\{[^}]*grid-column:\s*3/s);
});

test('样式按职责拆分且每个文件保持可管理', async () => {
  const chunks = await readStyles();
  for (let index = 0; index < chunks.length; index += 1) {
    const lines = chunks[index].split('\n').length;
    assert.ok(lines <= 800, `${styleFiles[index]} 有 ${lines} 行`);
  }
});

test('页面内置图标避免本地演示产生 favicon 404', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /rel=["']icon["'][^>]+href=["']data:image\/svg\+xml/);
});
