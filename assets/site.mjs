export function toggleWallpaperState(states, activeIndex) {
  return states.map((state, index) => {
    if (index !== activeIndex) return state;
    return state === 'live' ? 'still' : 'live';
  });
}

// Slots reserve the full width of playing screens; idle cards may remain layered behind them.
export function layoutWallpaperRow(active, width, cardWidth, gap) {
  const count = active.length;
  const liveCount = active.filter(Boolean).length;
  const idleCount = count - liveCount;
  const available = width - gap * (count - 1);
  const liveWidth = Math.min(cardWidth, available / count + idleCount * (available / count - cardWidth * 0.4) / Math.max(1, liveCount));
  const idleWidth = idleCount ? (available - liveCount * liveWidth) / idleCount : 0;
  let left = 0;
  return active.map(live => {
    const slotWidth = live ? liveWidth : idleWidth;
    const result = { center: left + slotWidth / 2, width: live ? liveWidth : Math.min(cardWidth * 0.84, slotWidth + cardWidth * 0.35) };
    left += slotWidth + gap;
    return result;
  });
}

export function wallpaperMediaCommand(state) {
  return state === 'live'
    ? { play: true, reset: false }
    : { play: false, reset: true };
}

export const WALLPAPER_PLAYBACK_TIMEOUT_MS = 2500;

export function resolveWallpaperPlayback(requestedState, mediaEvent, isVisible = true) {
  if (requestedState !== 'live') return 'still';
  if (mediaEvent === 'playing') return 'live';
  if (mediaEvent === 'pause') return isVisible ? 'retry' : 'waiting';
  if (mediaEvent === 'error') return 'still';
  return 'loading';
}

export function activateFactoryChapter(chapters, activeChapter) {
  return chapters.map(chapter => chapter === activeChapter);
}

export function clampComparison(value) {
  return Math.min(95, Math.max(5, Number(value)));
}

export function nextPublishStep(step) {
  const sequence = ['product', 'copy', 'publish', 'result'];
  const index = sequence.indexOf(step);
  return sequence[(index + 1 + sequence.length) % sequence.length];
}

export function activateChoice(count, activeIndex) {
  return Array.from({ length: count }, (_, index) => index === activeIndex);
}

export function supportReply(choice) {
  const replies = {
    iPhone: '打开“设置 → 墙纸 → 添加新墙纸”，从相册选择带有“实况”标志的文件，并确认实况按钮已经开启。',
    Android: 'Android 机型请使用交付包中的 MP4，通过系统动态壁纸入口设置；不同品牌的入口会略有差异。',
    重新获取: '我会重新生成一次专属下载链接，并附上静态图、动态文件与安装说明。',
  };
  return replies[choice] ?? '请选择设备或重新获取文件，我会给出对应步骤。';
}

const publishLabels = {
  product: ['READY', '生成发布内容'],
  copy: ['COPY READY', '通过 MCP 发布'],
  publish: ['SENDING', '查看发布结果'],
  result: ['PUBLISHED', '重新演示'],
};

function initWallpapers() {
  const cards = [...document.querySelectorAll('[data-wallpaper-card]')];
  const deck = document.querySelector('.phone-deck');
  if (!deck || !cards.length) return;
  const layoutCards = () => {
    const expanded = cards.some(card => card.dataset.requestedState === 'live');
    deck.dataset.expanded = String(expanded);
    if (!expanded) return;
    const columns = matchMedia('(max-width: 760px)').matches ? 3 : 6;
    const width = deck.clientWidth;
    for (let start = 0; start < cards.length; start += columns) {
      const row = cards.slice(start, start + columns);
      const layout = layoutWallpaperRow(row.map(card => card.dataset.requestedState === 'live'), width, row[0].offsetWidth, columns === 3 ? 8 : 12);
      row.forEach((card, index) => {
        card.style.setProperty('--spread-x', `${layout[index].center - width * (index + 0.5) / columns}px`);
        card.style.setProperty('--spread-scale', String(layout[index].width / card.offsetWidth));
      });
    }
  };
  new ResizeObserver(layoutCards).observe(deck);
  const retryTimers = new WeakMap();
  const startupTimers = new WeakMap();
  const playbackAttempts = new WeakMap();

  const render = (card, visualState) => {
    const requestedLive = card.dataset.requestedState === 'live';
    card.dataset.state = visualState;
    card.classList.toggle('is-live', visualState === 'live');
    card.classList.toggle('is-loading', visualState === 'loading');
    card.classList.toggle('is-waiting', visualState === 'waiting');
    card.setAttribute('aria-pressed', String(requestedLive));
    layoutCards();
    card.querySelector('.phone-state').textContent = {
      live: 'LIVE',
      loading: 'LOADING',
      waiting: 'PAUSED',
      still: 'STILL',
    }[visualState] ?? 'STILL';
  };

  const clearRetry = card => {
    clearTimeout(retryTimers.get(card));
    retryTimers.delete(card);
  };

  const clearStartup = card => {
    clearTimeout(startupTimers.get(card));
    startupTimers.delete(card);
  };

  const stopPlayback = card => {
    playbackAttempts.delete(card);
    const video = card.querySelector('[data-wallpaper-video]');
    card.dataset.requestedState = 'still';
    card.dataset.playRetries = '0';
    clearRetry(card);
    clearStartup(card);
    render(card, 'still');
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  const failPlayback = card => {
    clearStartup(card);
    if (document.visibilityState !== 'visible') {
      render(card, 'waiting');
      return;
    }
    stopPlayback(card);
  };

  const requestPlayback = card => {
    const video = card.querySelector('[data-wallpaper-video]');
    if (card.dataset.requestedState !== 'live') return;
    if (!video) {
      render(card, 'live');
      return;
    }
    render(card, 'loading');
    clearStartup(card);
    startupTimers.set(card, setTimeout(() => {
      if (card.dataset.requestedState === 'live' && card.dataset.state === 'loading') {
        failPlayback(card);
      }
    }, WALLPAPER_PLAYBACK_TIMEOUT_MS));
    const attempt = {};
    playbackAttempts.set(card, attempt);
    const playRequest = video.play();
    if (playRequest?.catch) playRequest.catch(() => {
      // A cancelled earlier play must not cancel a newer user request.
      if (playbackAttempts.get(card) === attempt) failPlayback(card);
    });
  };

  const retryPlayback = card => {
    if (card.dataset.requestedState !== 'live') return;
    if (document.visibilityState !== 'visible') {
      render(card, 'waiting');
      return;
    }
    const retries = Number(card.dataset.playRetries || 0);
    if (retries >= 2) {
      stopPlayback(card);
      return;
    }
    card.dataset.playRetries = String(retries + 1);
    clearRetry(card);
    retryTimers.set(card, setTimeout(() => requestPlayback(card), 120));
  };

  const resumeRequestedVideos = () => {
    if (document.visibilityState !== 'visible') return;
    cards.forEach(card => {
      const video = card.querySelector('[data-wallpaper-video]');
      if (card.dataset.requestedState !== 'live' || !video) return;
      if (!video.paused) {
        render(card, 'live');
        return;
      }
      card.dataset.playRetries = '0';
      requestPlayback(card);
    });
  };

  cards.forEach(card => {
    card.dataset.requestedState = card.dataset.state === 'live' ? 'live' : 'still';
    card.dataset.playRetries = '0';
    const video = card.querySelector('[data-wallpaper-video]');

    if (video) {
      video.addEventListener('playing', () => {
        if (card.dataset.requestedState !== 'live') {
          stopPlayback(card);
          return;
        }
        card.dataset.playRetries = '0';
        clearRetry(card);
        clearStartup(card);
        render(card, resolveWallpaperPlayback('live', 'playing', true));
      });
      video.addEventListener('pause', () => {
        if (!video.paused) return;
        clearStartup(card);
        const next = resolveWallpaperPlayback(
          card.dataset.requestedState,
          'pause',
          document.visibilityState === 'visible',
        );
        if (next === 'retry') retryPlayback(card);
        else render(card, next);
      });
      video.addEventListener('error', () => failPlayback(card));
    }

    card.addEventListener('click', () => {
      const next = card.dataset.requestedState === 'live' ? 'still' : 'live';
      if (next === 'still') stopPlayback(card);
      else {
        card.dataset.requestedState = 'live';
        requestPlayback(card);
      }
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resumeRequestedVideos();
    else cards
      .filter(card => card.dataset.requestedState === 'live')
      .forEach(card => render(card, 'waiting'));
  });
  window.addEventListener('pageshow', resumeRequestedVideos);
}

function initFactoryTabs() {
  const tablist = document.querySelector('[data-factory-tabs]');
  const scroller = document.querySelector('[data-factory-scroll]');
  const buttons = [...document.querySelectorAll('[data-factory-target]')];
  const panels = [...document.querySelectorAll('[data-factory-panel]')];
  if (!tablist || !scroller || buttons.length !== panels.length) return;

  const chapters = panels.map(panel => panel.dataset.factoryPanel);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let transitionTimer;

  const render = (target, updateHash = true, animate = true) => {
    if (!chapters.includes(target)) return;
    clearTimeout(transitionTimer);
    if (animate && !reducedMotion) scroller.classList.add('is-switching');

    const commit = () => {
      const states = activateFactoryChapter(chapters, target);
      panels.forEach((panel, index) => {
        panel.hidden = !states[index];
        panel.classList.toggle('is-active', states[index]);
        panel.setAttribute('aria-hidden', String(!states[index]));
      });
      buttons.forEach((button, index) => {
        button.classList.toggle('is-active', states[index]);
        button.setAttribute('aria-selected', String(states[index]));
        button.tabIndex = states[index] ? 0 : -1;
      });
      scroller.scrollTop = 0;
      if (updateHash) history.replaceState(null, '', `#${target}`);
      requestAnimationFrame(() => scroller.classList.remove('is-switching'));
    };

    if (animate && !reducedMotion) transitionTimer = setTimeout(commit, 150);
    else commit();
  };

  buttons.forEach(button => {
    button.addEventListener('click', () => render(button.dataset.factoryTarget));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = buttons.indexOf(button);
      const next = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      render(buttons[next].dataset.factoryTarget);
    });
  });

  const initial = location.hash.slice(1);
  render(chapters.includes(initial) ? initial : chapters[0], false, false);
}

function initComparison() {
  const comparison = document.querySelector('[data-comparison]');
  const range = document.querySelector('[data-comparison-range]');
  if (!comparison || !range) return;
  range.addEventListener('input', () => {
    comparison.style.setProperty('--split', `${clampComparison(range.value)}%`);
  });
}

function initComparisonCases() {
  const buttons = [...document.querySelectorAll('.comparison-thumbs button')];
  const canvas = document.querySelector('.compare-canvas');
  if (!buttons.length || !canvas) return;
  const copy = [
    ['固定规则覆盖结果', '主体精准覆盖结果'],
    ['固定角度放置结果', '角度自适配结果'],
    ['区域互相干扰结果', '多区域协同结果'],
  ];
  buttons.forEach((button, activeIndex) => {
    button.addEventListener('click', () => {
      const states = activateChoice(buttons.length, activeIndex);
      buttons.forEach((item, index) => {
        item.classList.toggle('is-active', states[index]);
        item.setAttribute('aria-pressed', String(states[index]));
      });
      canvas.dataset.assetSlot = button.dataset.assetSlot;
      canvas.querySelector('.compare-before small').textContent = copy[activeIndex][0];
      canvas.querySelector('.compare-after small').textContent = copy[activeIndex][1];
    });
  });
}

function initPublishDemo() {
  const demo = document.querySelector('[data-publish-demo]');
  const action = document.querySelector('[data-publish-action]');
  if (!demo || !action) return;
  action.addEventListener('click', () => {
    const step = nextPublishStep(demo.dataset.step);
    demo.dataset.step = step;
    demo.querySelectorAll('[data-publish-panel]').forEach(panel => {
      panel.hidden = panel.dataset.publishPanel !== step;
    });
    const [status, label] = publishLabels[step];
    demo.querySelector('[data-publish-status]').textContent = status;
    action.textContent = label;
  });
}

function initSupportDemo() {
  const buttons = [...document.querySelectorAll('[data-support-reply]')];
  const answer = document.querySelector('[data-support-answer]');
  if (!buttons.length || !answer) return;
  buttons.forEach((button, activeIndex) => {
    button.addEventListener('click', () => {
      answer.textContent = supportReply(button.textContent.trim());
      const states = activateChoice(buttons.length, activeIndex);
      buttons.forEach((item, index) => item.setAttribute('aria-pressed', String(states[index])));
    });
  });
}

function initReveals() {
  const items = [...document.querySelectorAll('.reveal')];
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8%', threshold: 0.12 });
  items.forEach(item => observer.observe(item));
}

if (typeof document !== 'undefined') {
  initWallpapers();
  initFactoryTabs();
  initComparison();
  initComparisonCases();
  initPublishDemo();
  initSupportDemo();
  initReveals();
}
