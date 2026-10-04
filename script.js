/* =========================================================
   磐石伺服器 — Deep Survival
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------- Pages ---------- */
  const pages = $$('.page');
  const pageById = new Map(pages.map(p => [p.id, p]));
  const PAGE_LABELS = {
    hero: '首頁', about: '關於我們', team: '管理團隊', join: '如何加入', features: '玩家須知',
    rules: '伺服器規範', store: '磐石商城', devops: '技術架構', history: '歷史沿革', faq: '常見問題',
  };
  const TINTS = { surface: '217, 174, 74', deep: '150, 162, 196', diamond: '79, 227, 208', bedrock: '170, 160, 150' };
  const tintFor = y => (y <= -64 ? TINTS.bedrock : y <= -59 ? TINTS.diamond : y < 0 ? TINTS.deep : TINTS.surface);

  /* ---------- Split headings into animated glyphs ---------- */
  $$('[data-split]').forEach(el => {
    const text = el.textContent.trim();
    el.innerHTML = `<span class="sr-only">${text}</span>` + [...text].map((ch, i) =>
      `<span class="ch" aria-hidden="true"><span style="--ci:${i}">${ch === ' ' ? '&nbsp;' : ch}</span></span>`).join('');
    el.classList.add('is-split');
  });

  /* ---------- Giant depth mark behind each page head ---------- */
  pages.forEach(p => {
    const c = $(':scope > .container', p);
    if (!c) return;
    const mark = document.createElement('div');
    mark.className = 'page-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = `<span class="pm-n"><small>Y</small>${p.dataset.y}</span><span class="pm-l">${p.dataset.layerEn}</span>`;
    c.prepend(mark);
  });

  /* ---------- Reveal on view ---------- */
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--rd', `${Math.min(sibs.indexOf(el), 6) * 0.07}s`);
  });
  $$('.hero .reveal-line').forEach((el, i) => el.style.setProperty('--rd', `${0.45 + i * 0.09}s`));

  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-in'); });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* ---------- Header ---------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-solid', scrollY > 8 || menuOpen);
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu (mobile / tablet) ---------- */
  const menu = $('#menu');
  const menuBtn = $('#menuBtn');
  const menuList = $('#menuList');
  let menuOpen = false;

  menuList.innerHTML = pages.map((p, i) => `
    <li><a href="#${p.id}" data-page-link style="--i:${i}">
      <span class="m-no">${String(i + 1).padStart(2, '0')}</span>
      <span class="m-label">${PAGE_LABELS[p.id] || p.id}</span>
      <span class="m-y">Y ${p.dataset.y}</span>
    </a></li>`).join('');
  menu.inert = true;

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.menu-btn-label', menuBtn).textContent = open ? '關閉' : '選單';
    document.body.classList.toggle('is-locked', open);
    onScroll();
    if (open) setTimeout(() => $('a[aria-current="page"], a', menuList)?.focus({ preventScroll: true }), 250);
  }
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
  matchMedia('(min-width: 1281px)').addEventListener('change', e => { if (e.matches && menuOpen) setMenu(false); });

  /* ---------- Depth gauge ---------- */
  const gaugeTrack = $('#gaugeTrack');
  const gaugeFill = $('#gaugeFill');
  const gaugeNum = $('#gaugeNum');
  const gaugeLayer = $('#gaugeLayer');
  const depthChip = $('#depthChip b');
  const ticks = pages.map((p, i) => {
    const t = document.createElement('span');
    t.className = 'gauge-tick';
    t.style.top = `${(i / (pages.length - 1)) * 100}%`;
    t.innerHTML = `<span class="tip">${PAGE_LABELS[p.id]} · Y ${p.dataset.y}</span>`;
    t.addEventListener('click', () => navigate(p.id));
    gaugeTrack.appendChild(t);
    return t;
  });
  let shownY = 64;
  let yAnim = 0;
  function setDepth(page) {
    const idx = pages.indexOf(page);
    const target = Number(page.dataset.y);
    ticks.forEach((t, i) => {
      t.classList.toggle('is-current', i === idx);
      t.classList.toggle('is-passed', i < idx);
    });
    gaugeFill.style.height = `${(idx / (pages.length - 1)) * 100}%`;
    gaugeLayer.textContent = page.dataset.layer;
    root.style.setProperty('--tint', tintFor(target));
    cancelAnimationFrame(yAnim);
    const from = shownY;
    const t0 = performance.now();
    const dur = reduceMotion ? 0 : 900;
    const step = now => {
      const k = dur ? clamp((now - t0) / dur, 0, 1) : 1;
      shownY = Math.round(from + (target - from) * easeOut(k));
      gaugeNum.textContent = shownY;
      depthChip.textContent = shownY;
      if (k < 1) yAnim = requestAnimationFrame(step);
    };
    yAnim = requestAnimationFrame(step);
  }

  /* ---------- Block-mining page transition ---------- */
  const wipe = $('#wipe');
  const wctx = wipe.getContext('2d');
  const PALETTES = {
    stone: ['#1d1914', '#16130f', '#241f19', '#110e0b', '#1a1611'],
    deep: ['#1a1a1f', '#232329', '#141418', '#2a2a31', '#1e1e24'],
  };
  const ORES = ['#f6d77a', '#4fe3d0', '#e3533f', '#8cc152'];

  function runWipe(toY, onCovered) {
    return new Promise(resolve => {
      const w = innerWidth, h = innerHeight;
      wipe.width = w; wipe.height = h;
      const bs = w < 700 ? 40 : 64;
      const cols = Math.ceil(w / bs), rows = Math.ceil(h / bs);
      const pal = toY < 0 ? PALETTES.deep : PALETTES.stone;
      const blocks = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          blocks.push({
            x: c * bs, y: r * bs,
            d: (r / rows) * 0.6 + Math.random() * 0.4,
            col: pal[(Math.random() * pal.length) | 0],
            ore: Math.random() < 0.05 ? ORES[(Math.random() * ORES.length) | 0] : null,
          });
        }
      }
      const SPREAD = 240, BLOCK = 170, T = SPREAD + BLOCK;
      let phase = 0, t0 = performance.now();

      const frame = now => {
        const t = now - t0;
        wctx.clearRect(0, 0, w, h);
        for (const b of blocks) {
          const d = phase === 0 ? b.d : 1 - b.d;
          let p = clamp((t - d * SPREAD) / BLOCK, 0, 1);
          p = easeOut(p);
          const s = phase === 0 ? p : 1 - p;
          if (s <= 0) continue;
          const size = bs * s;
          const off = (bs - size) / 2;
          wctx.fillStyle = b.col;
          wctx.fillRect(b.x + off, b.y + off, size + 0.5, size + 0.5);
          if (s > 0.92) {
            wctx.fillStyle = 'rgba(255,255,255,0.025)';
            wctx.fillRect(b.x, b.y, bs, 2);
            if (b.ore) {
              const u = bs / 8;
              wctx.fillStyle = b.ore;
              wctx.fillRect(b.x + u * 2, b.y + u * 2, u, u);
              wctx.fillRect(b.x + u * 5, b.y + u * 3, u, u);
              wctx.fillRect(b.x + u * 3, b.y + u * 5, u, u);
            }
          }
        }
        if (t < T) return requestAnimationFrame(frame);
        if (phase === 0) {
          phase = 1;
          onCovered();
          // let layout settle under the cover before revealing
          requestAnimationFrame(() => { t0 = performance.now(); requestAnimationFrame(frame); });
        } else {
          wctx.clearRect(0, 0, w, h);
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  /* ---------- Router ---------- */
  let current = null;
  let busy = false;
  let queued = null;

  function resolveTarget(hash) {
    const id = decodeURIComponent((hash || '').replace(/^#/, ''));
    if (!id) return { page: 'hero' };
    if (pageById.has(id)) return { page: id };
    const el = document.getElementById(id);
    const host = el?.closest('.page');
    if (host) return { page: host.id, anchor: el };
    return { page: 'hero' };
  }

  function activate(id, { focus = false, anchor = null, reveal = true } = {}) {
    const page = pageById.get(id);
    const prev = current;
    pages.forEach(p => {
      if (p !== page) {
        p.classList.remove('is-active', 'is-shown');
        $$('.reveal.is-in', p).forEach(r => r.classList.remove('is-in'));
      }
    });
    page.classList.add('is-active');
    $('#bootPage')?.remove();
    current = id;
    document.title = page.dataset.title;

    $$('[data-page-link]').forEach(a => {
      if (a.closest('#navList, #menuList')) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
    });
    setDepth(page);

    if (anchor) {
      anchor.scrollIntoView({ block: 'start' });
      document.fonts?.ready.then(() => { if (current === id) anchor.scrollIntoView({ block: 'start' }); });
    } else scrollTo(0, 0);

    void page.offsetWidth; // commit display before transitions
    if (reveal) requestAnimationFrame(() => requestAnimationFrame(() => showPage(page)));

    if (focus) {
      const h = $('.page-title, .hero-title', page);
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }

    // page-specific lifecycles
    if (id === 'hero') embers.start(); else embers.stop();
    if (id === 'team') skins.start(); else if (prev === 'team') skins.pause();
    if (id === 'rules') spy.refresh();
    onScroll();
  }

  function showPage(page) {
    page.classList.add('is-shown');
    if (page.id === 'hero') countUp(page);
  }

  async function navigate(id, { push = true, anchor = null } = {}) {
    if (!pageById.has(id)) id = 'hero';
    if (menuOpen) setMenu(false);
    if (push) {
      const url = id === 'hero' && !anchor ? location.pathname + location.search : '#' + (anchor?.id || id);
      history.pushState({ page: id }, '', url);
    }
    if (id === current) {
      if (anchor) anchor.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      else scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    if (busy) { queued = { id, anchor }; return; }
    busy = true;
    if (reduceMotion) activate(id, { focus: true, anchor });
    else await runWipe(Number(pageById.get(id).dataset.y), () => activate(id, { focus: true, anchor }));
    busy = false;
    if (queued) { const q = queued; queued = null; if (q.id !== current) navigate(q.id, { push: false, anchor: q.anchor }); }
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const hash = a.getAttribute('href');
    if (hash === '#main' || a.hasAttribute('data-toc')) return; // skip link / rules TOC handle themselves
    const { page, anchor } = resolveTarget(hash);
    e.preventDefault();
    navigate(page, { anchor });
  });

  const syncFromLocation = () => {
    const { page, anchor } = resolveTarget(location.hash);
    if (page !== current) navigate(page, { push: false, anchor });
    else if (anchor) anchor.scrollIntoView({ block: 'start' });
  };
  addEventListener('popstate', syncFromLocation);
  addEventListener('hashchange', syncFromLocation);

  /* ---------- Count-up stats ---------- */
  function countUp(scope) {
    $$('[data-count]', scope).forEach(el => {
      const to = Number(el.dataset.count);
      if (reduceMotion) { el.textContent = to; return; }
      const from = to > 1000 ? to - 60 : 0;
      const t0 = performance.now() + 500;
      const tick = now => {
        const k = clamp((now - t0) / 1600, 0, 1);
        el.textContent = Math.round(from + (to - from) * easeOutExpo(k));
        if (k < 1) requestAnimationFrame(tick);
      };
      el.textContent = from;
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Copy to clipboard ---------- */
  const toast = $('#toast');
  const toastText = $('#toastText');
  let toastTimer;
  function showToast(msg) {
    toastText.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const text = btn.dataset.copy;
    await copy(text);
    btn.classList.add('is-copied');
    setTimeout(() => btn.classList.remove('is-copied'), 1400);
    showToast(`已複製：${text.trim()}`);
  });

  /* ---------- Hero embers ---------- */
  const embers = (() => {
    const canvas = $('#embers');
    if (!canvas || reduceMotion) return { start() {}, stop() {} };
    const ctx = canvas.getContext('2d');
    const COLORS = ['255, 196, 92', '255, 140, 60', '246, 215, 122', '79, 227, 208', '227, 83, 63'];
    let parts = [], raf = 0, running = false, w = 0, h = 0, dpr = 1;
    const mouse = { x: -999, y: -999 };

    const spawn = (anywhere) => {
      const r = Math.random();
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        s: (Math.random() * 2.2 + 1) * dpr,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.5 + 0.18),
        life: Math.random() * Math.PI * 2,
        c: COLORS[r < 0.55 ? 0 : r < 0.8 ? 1 : r < 0.9 ? 2 : r < 0.96 ? 3 : 4],
      };
    };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = canvas.offsetWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
      const n = Math.round(clamp((canvas.offsetWidth * canvas.offsetHeight) / 14000, 24, 70));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        p.life += 0.03;
        const dx = p.x - mouse.x * dpr, dy = p.y - mouse.y * dpr;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 * dpr) { p.vx += (dx / dist) * 0.04; p.vy += (dy / dist) * 0.02; }
        p.vx *= 0.985;
        p.x += p.vx + Math.sin(p.life * 0.7) * 0.15;
        p.y += p.vy * dpr;
        if (p.y < -10 || p.x < -10 || p.x > w + 10) Object.assign(p, spawn(false));
        const fade = clamp(p.y / h, 0, 1);
        const a = (0.35 + Math.sin(p.life) * 0.25) * (0.3 + fade * 0.7);
        ctx.fillStyle = `rgba(${p.c}, ${a})`;
        ctx.fillRect(p.x, p.y, p.s, p.s);
        ctx.fillStyle = `rgba(${p.c}, ${a * 0.12})`;
        ctx.fillRect(p.x - p.s * 1.5, p.y - p.s * 1.5, p.s * 4, p.s * 4);
      }
      raf = requestAnimationFrame(loop);
    };
    canvas.parentElement.parentElement.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    addEventListener('resize', () => { if (running) resize(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    });
    return {
      start() { if (running) return; running = true; resize(); raf = requestAnimationFrame(loop); },
      stop() { running = false; cancelAnimationFrame(raf); },
    };
  })();

  /* ---------- Torchlight + hero parallax ---------- */
  if (finePointer && !reduceMotion) {
    root.classList.add('has-pointer');
    const heroArt = $('#heroArt img');
    let mx = innerWidth / 2, my = innerHeight / 2, pending = false;
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        root.style.setProperty('--mx', mx + 'px');
        root.style.setProperty('--my', my + 'px');
        if (current === 'hero' && heroArt) {
          const nx = mx / innerWidth - 0.5, ny = my / innerHeight - 0.5;
          heroArt.style.setProperty('--px', (nx * -22).toFixed(1) + 'px');
          heroArt.style.setProperty('--py', (ny * -14).toFixed(1) + 'px');
        }
      });
    }, { passive: true });

    $$('.guide').forEach(g => g.addEventListener('pointermove', e => {
      const r = g.getBoundingClientRect();
      g.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    }));
  }

  /* ---------- Rules: search + scroll-spy ---------- */
  const spy = (() => {
    const toc = $('#lawToc');
    const body = $('#lawBody');
    if (!toc || !body) return { refresh() {} };
    const links = $$('a[data-toc]', toc);
    const chapters = links.map(a => document.getElementById(a.getAttribute('href').slice(1)));
    const offset = () => (innerWidth <= 1100 ? header.offsetHeight + toc.offsetHeight + 12 : header.offsetHeight + 24);

    links.forEach((a, i) => a.addEventListener('click', e => {
      e.preventDefault();
      const y = chapters[i].getBoundingClientRect().top + scrollY - offset() + 4;
      scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState({ page: 'rules' }, '', '#' + chapters[i].id);
    }));

    let ticking = false;
    const update = () => {
      ticking = false;
      if (current !== 'rules') return;
      const line = offset() + innerHeight * 0.18;
      let idx = 0;
      chapters.forEach((ch, i) => { if (!ch.classList.contains('is-hidden') && ch.getBoundingClientRect().top <= line) idx = i; });
      links.forEach((a, i) => a.classList.toggle('is-current', i === idx));
      const cur = links[idx];
      if (innerWidth <= 1100 && cur) {
        const strip = toc;
        const left = cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2;
        strip.scrollTo({ left, behavior: 'smooth' });
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });

    // Search
    const input = $('#lawSearch');
    const count = $('#lawCount');
    const empty = $('#lawEmpty');
    const divider = $('.law-divider', body);
    const items = $$('.chapter li', body);
    // keep each rule's text in one grid cell so <mark> splits never reflow the row
    items.forEach(li => {
      const txt = document.createElement('span');
      txt.className = 'txt';
      [...li.childNodes].filter(n => !(n.nodeType === 1 && n.classList.contains('art'))).forEach(n => txt.appendChild(n));
      li.appendChild(txt);
    });
    const originals = new Map(items.map(li => [li, li.innerHTML]));
    const extras = $$('.chapter .ch-desc, .chapter .ch-sub', body);
    const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    function highlight(el, re) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const parts = node.nodeValue.split(re);
        if (parts.length < 2) return;
        const frag = document.createDocumentFragment();
        parts.forEach((part, i) => {
          if (!part) return;
          if (i % 2) { const m = document.createElement('mark'); m.textContent = part; frag.appendChild(m); }
          else frag.appendChild(document.createTextNode(part));
        });
        node.replaceWith(frag);
      });
    }

    function search(q) {
      q = q.trim();
      items.forEach(li => { li.innerHTML = originals.get(li); li.classList.remove('is-hidden'); });
      chapters.forEach(ch => ch.classList.remove('is-hidden'));
      extras.forEach(x => x.classList.remove('is-hidden'));
      links.forEach(a => a.classList.remove('is-dim'));
      divider.classList.remove('is-hidden');
      empty.hidden = true;
      if (!q) { count.textContent = ''; update(); return; }

      const re = new RegExp(`(${escapeRe(q)})`, 'gi');
      const lower = q.toLowerCase();
      let total = 0;
      chapters.forEach((ch, i) => {
        const titleHit = $('h3', ch).textContent.toLowerCase().includes(lower);
        let hits = 0;
        $$('li', ch).forEach(li => {
          const hit = titleHit || li.textContent.toLowerCase().includes(lower);
          li.classList.toggle('is-hidden', !hit);
          if (hit) { hits++; highlight(li, re); }
        });
        $$('.ch-desc, .ch-sub', ch).forEach(x => x.classList.toggle('is-hidden', !titleHit && !x.textContent.toLowerCase().includes(lower)));
        ch.classList.toggle('is-hidden', hits === 0);
        links[i].classList.toggle('is-dim', hits === 0);
        total += hits;
      });
      divider.classList.toggle('is-hidden', !chapters.some(ch => ch.id.startsWith('build') && !ch.classList.contains('is-hidden')));
      empty.hidden = total > 0;
      count.textContent = total ? `找到 ${total} 條相符條文` : '沒有相符條文';
      update();
    }

    let deb;
    input.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(() => search(input.value), 120); });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { input.value = ''; search(''); } });
    addEventListener('keydown', e => {
      if (e.key !== '/' || current !== 'rules') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      input.focus();
    });

    return { refresh: () => requestAnimationFrame(update) };
  })();

  /* ---------- Team: 3D skins (lazy) ---------- */
  const skins = (() => {
    const cards = $$('.team-card[data-skin]');
    const viewers = [];
    let lib = null;
    const loadLib = () => {
      if (window.skinview3d) return Promise.resolve();
      return (lib ||= new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/skinview3d@3.1.0/bundles/skinview3d.bundle.js';
        s.async = true;
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      }));
    };
    const fallback = () => cards.forEach(c => c.classList.add('is-fallback'));

    async function start() {
      if (viewers.length) { viewers.forEach(v => { v.renderPaused = false; }); return; }
      try { await loadLib(); } catch { fallback(); return; }
      if (current !== 'team' || viewers.length) return;
      const sv = window.skinview3d;
      cards.forEach(card => {
        const canvas = $('canvas', card);
        let viewer;
        try {
          viewer = new sv.SkinViewer({
            canvas,
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            pixelRatio: Math.min(devicePixelRatio || 1, 2),
          });
        } catch { card.classList.add('is-fallback'); return; }
        viewer.renderer.setClearColor(0x000000, 0);
        viewer.zoom = 0.82;
        viewer.fov = 38;
        viewer.camera.position.y += 2;
        viewer.controls.enableZoom = false;
        viewer.controls.enablePan = false;
        viewer.autoRotate = !reduceMotion;
        viewer.autoRotateSpeed = 0.7;
        const idle = new sv.IdleAnimation();
        idle.speed = 0.6;
        viewer.animation = reduceMotion ? null : idle;
        viewer.loadSkin(`https://mineskin.eu/skin/${encodeURIComponent(card.dataset.skin)}`)
          .catch(() => card.classList.add('is-fallback'));
        if (!reduceMotion && sv.WaveAnimation) {
          card.addEventListener('pointerenter', () => { const wave = new sv.WaveAnimation(); wave.speed = 1.2; viewer.animation = wave; });
          card.addEventListener('pointerleave', () => { viewer.animation = idle; });
        }
        viewers.push(viewer);
      });
    }
    return {
      start,
      pause() { viewers.forEach(v => { v.renderPaused = true; }); },
    };
  })();
  document.addEventListener('visibilitychange', () => { if (document.hidden) skins.pause(); else if (current === 'team') skins.start(); });

  /* ---------- Easter egg: ↑↑↓↓←→←→BA rains diamonds ---------- */
  (() => {
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let pos = 0;
    addEventListener('keydown', e => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
      if (pos < code.length) return;
      pos = 0;
      showToast('你挖到了隱藏的鑽石礦！');
      if (reduceMotion || busy) return;
      const w = wipe.width = innerWidth, h = wipe.height = innerHeight;
      const u = 4;
      const gem = ['..cccc..', '.cCCcCc.', 'cCcCcCce', 'cccccccc', '.cCcccce', '..cccce.', '...ce...'];
      const pal = { c: '#3fcfbd', C: '#a8fff2', e: '#1f8f84' };
      const drops = Array.from({ length: 90 }, () => ({ x: Math.random() * w, y: -Math.random() * h - 40, v: 3 + Math.random() * 5, r: (Math.random() - 0.5) * 0.4 }));
      const t0 = performance.now();
      const fall = now => {
        wctx.clearRect(0, 0, w, h);
        let alive = false;
        for (const d of drops) {
          d.y += d.v; d.x += d.r;
          if (d.y < h + 40) alive = true;
          gem.forEach((row, ry) => [...row].forEach((ch, rx) => {
            if (ch === '.') return;
            wctx.fillStyle = pal[ch];
            wctx.fillRect(Math.round(d.x + rx * u), Math.round(d.y + ry * u), u, u);
          }));
        }
        if (alive && now - t0 < 6000) requestAnimationFrame(fall);
        else wctx.clearRect(0, 0, w, h);
      };
      requestAnimationFrame(fall);
    });
  })();

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- World-loading intro ---------- */
  function boot() {
    const { page, anchor } = resolveTarget(location.hash);
    history.replaceState({ page }, '', location.href);
    // hold the reveal of the first page until the loader is gone
    const firstPage = pageById.get(page);
    const loader = $('#loader');
    const withLoader = root.classList.contains('show-loader');
    activate(page, { anchor, reveal: !withLoader });
    if (!withLoader) { loader.remove(); return; }
    try { sessionStorage.setItem('rock-loaded', '1'); } catch {}

    const grid = $('#loaderGrid');
    const N = 11, cells = [];
    for (let i = 0; i < N * N; i++) { const c = document.createElement('i'); grid.appendChild(c); cells.push(c); }
    // spiral order from the centre, like Minecraft's chunk loading map
    const order = [];
    let x = 5, y = 5, dx = 1, dy = 0, len = 1;
    order.push(y * N + x);
    while (order.length < N * N) {
      for (let k = 0; k < 2; k++) {
        for (let s = 0; s < len; s++) {
          x += dx; y += dy;
          if (x >= 0 && x < N && y >= 0 && y < N) order.push(y * N + x);
        }
        [dx, dy] = [-dy, dx];
      }
      len++;
    }
    const tones = ['#5fa83a', '#6fb844', '#4f9330', '#8cc152', '#3f7fbf', '#8d8a83', '#c9b77a'];
    const pct = $('#loaderPct');
    const dur = 1050;
    const t0 = performance.now();
    let lit = 0;
    let fontsReady = false;
    (document.fonts?.ready || Promise.resolve()).then(() => { fontsReady = true; });

    const step = now => {
      const k = clamp((now - t0) / dur, 0, 1);
      const target = Math.floor(easeOut(k) * order.length);
      while (lit < target) {
        const c = cells[order[lit]];
        c.style.setProperty('--c', tones[(Math.random() * tones.length) | 0]);
        c.classList.add('on');
        lit++;
      }
      pct.textContent = Math.round(k * 100) + '%';
      if (k < 1 || (!fontsReady && now - t0 < 2600)) return requestAnimationFrame(step);
      loader.classList.add('is-done');
      setTimeout(() => showPage(firstPage), 260);
      setTimeout(() => { root.classList.remove('show-loader'); loader.remove(); }, 1000);
    };
    requestAnimationFrame(step);
  }

  boot();
})();
