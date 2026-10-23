/* ==========================================================================
   Santiago's Clean · interações
   GSAP + ScrollTrigger + SplitText para as animações e Lenis para a rolagem
   suave. Tudo local, roda estático no GitHub Pages.
   ========================================================================== */
(() => {
  const d = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WHATSAPP = '5535999103461';

  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  const hasGSAP = !!(window.gsap && window.ScrollTrigger && window.SplitText);
  const motion = hasGSAP && d.classList.contains('motion');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!motion) d.classList.remove('motion');
  if (!hasGSAP) {
    d.classList.add('ready', 'intro-done');
    basics(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });

  /* ---------- rolagem suave ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const startHash = location.hash;
  window.scrollTo(0, 0);

  basics(lenis);

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 2500))
  ]);

  fontsReady.then(() => {
    if (!motion) {
      d.classList.add('ready', 'intro-done');
      return;
    }
    const heroTl = setupHero();
    setupBand();
    setupAgua();
    setupTitles();
    setupStack();
    setupCompare(true);
    setupReveals();
    setupGallery();
    setupFooter();
    setupHeader();
    if (finePointer) { setupServiceFloat(); setupTrail(); setupMagnetic(); setupCursor(); }
    ScrollTrigger.refresh();
    d.classList.add('ready');
    runIntro(heroTl);
  });

  /* ======================================================================
     Abertura: o bico do extrator passa e deixa o tecido limpo.
     ====================================================================== */
  function runIntro(heroTl) {
    const seen = d.classList.contains('intro-seen');
    const finish = () => {
      d.classList.add('intro-done');
      lenis && lenis.start();
      if (startHash && startHash.length > 1 && $(startHash)) goTo(startHash, true);
    };
    if (seen) {
      heroTl.play(0.25);
      finish();
      return;
    }
    try { sessionStorage.setItem('sc-intro', '1'); } catch (e) {}
    lenis && lenis.stop();

    const intro = $('.intro');
    const tl = gsap.timeline({ onComplete: () => { intro.remove(); finish(); } });
    tl.from('.intro-word', { yPercent: 18, opacity: 0, duration: 0.9, stagger: 0 }, 0.1)
      .to('.intro-nozzle', { x: () => window.innerWidth + 40, xPercent: 0, duration: 1.25, ease: 'power2.inOut' }, 0.55)
      .to('.intro-clean', { clipPath: 'inset(0 0% 0 0)', duration: 1.25, ease: 'power2.inOut' }, 0.55)
      .to(intro, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, 2)
      .add(() => heroTl.play(0), 2.35);
  }

  /* ======================================================================
     Hero: título sobe linha a linha (SplitText, React Bits), a moldura do
     vídeo abre como uma passada e o grifo amarelo corre sob a palavra.
     ====================================================================== */
  function setupHero() {
    const title = $('.hero-title');
    const split = SplitText.create(title.querySelectorAll('.line'), { type: 'lines', mask: 'lines', linesClass: 'ln' });
    roomForAccents(split);
    const tl = gsap.timeline({ paused: true });
    tl.set('.hero-title .line, .hero-lead, .hero-actions, .hero-copy .eyebrow', { opacity: 1 })
      .from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.12 }, 0)
      .fromTo('.hero-frame', { clipPath: 'inset(0 100% 0 0 round 14px)' }, { clipPath: 'inset(0 0% 0 0 round 14px)', duration: 1.4, ease: 'expo.inOut' }, 0.05)
      .from('.hero-video', { scale: 1.25, duration: 1.8 }, 0.05)
      .fromTo('.mark', { '--mark': 0 }, { '--mark': 1, duration: 0.9, ease: 'power3.inOut' }, 0.75)
      .from('.hero-copy .eyebrow, .hero-lead, .hero-actions', { y: 24, opacity: 0, stagger: 0.08 }, 0.35)
      .from('.bubble', { scale: 0, opacity: 0, stagger: 0.12, duration: 1.2, ease: 'elastic.out(1, 0.6)' }, 0.9)
      .from('.hero-facts li', { y: 20, opacity: 0, stagger: 0.06 }, 0.6);

    // as bolhas flutuam e se afastam com a rolagem
    $$('.bubble').forEach((b, i) => {
      gsap.to(b, { y: -10 - i * 6, x: i % 2 ? 6 : -6, duration: 2.6 + i * 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to(b, { yPercent: -160 - i * 80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.to('.hero-frame', { yPercent: -6, rotate: -1.5, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    return tl;
  }

  /* ======================================================================
     Faixa: corre sozinha e acelera com a rolagem (ScrollVelocity, React Bits)
     ====================================================================== */
  function setupBand() {
    const track = $('.band-track');
    const base = track.innerHTML;
    track.innerHTML = base + base + base;
    let x = 0, dir = -1, extra = 0;
    const width = () => track.scrollWidth / 3;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        const v = self.getVelocity();
        dir = v < 0 ? 1 : -1;
        extra = Math.min(Math.abs(v) / 120, 14);
      }
    });
    gsap.ticker.add((t, delta) => {
      const w = width();
      x += dir * (0.6 + extra) * (delta / 16.7);
      extra *= 0.92;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  /* ======================================================================
     A água: as palavras acendem conforme a rolagem (ScrollReveal, React Bits;
     revelação por faixa de luz, Unlumen Dia Text Reveal)
     ====================================================================== */
  function setupAgua() {
    const p = $('.agua-text');
    const split = SplitText.create(p, { type: 'words', wordsClass: 'w' });
    gsap.set(split.words, { opacity: 0.18 });
    gsap.to(split.words, {
      opacity: 1, ease: 'none',
      stagger: { each: 0.1 },
      scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 40%', scrub: 0.6 }
    });
    gsap.from('.pill', { width: 0, duration: 1, scrollTrigger: { trigger: '.pill', start: 'top 80%' } });
  }

  /* a máscara das linhas cortava acentos (ê, ã) e o itálico: abre uma folga */
  function roomForAccents(split) {
    gsap.set(split.masks, { paddingTop: '0.16em', marginTop: '-0.16em', paddingBottom: '0.08em', marginBottom: '-0.08em', paddingRight: '0.08em', marginRight: '-0.08em' });
  }

  /* títulos das seções: linhas subindo de dentro de uma máscara */
  function setupTitles() {
    $$('[data-split]').forEach(el => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
      roomForAccents(split);
      gsap.from(split.lines, {
        yPercent: 105, duration: 1.2, stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    $$('.sec-lead, .empresas-copy > p, .quem-copy > p, .contato-copy > p, .contato-info > div').forEach(el => {
      gsap.from(el, { y: 26, opacity: 0, duration: 1.1, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  }

  /* ======================================================================
     Processo: cartões que se empilham e encolhem (ScrollStack, React Bits)
     ====================================================================== */
  function setupStack() {
    const cards = $$('.stack-card');
    cards.forEach((card, i) => {
      card.style.top = `calc(var(--header) + env(safe-area-inset-top, 0px) + ${14 + i * 14}px)`;
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.94 - (cards.length - 2 - i) * 0.02, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true }
      });
    });
  }

  /* ======================================================================
     Antes e depois: arrastar para comparar; ao entrar na tela, a divisória
     corre sozinha uma vez, como a passada do extrator.
     ====================================================================== */
  function setupCompare(animate) {
    $$('.compare').forEach(fig => {
      const box = $('.compare-box', fig);
      const range = $('.compare-range', fig);
      let touched = false;
      const set = v => {
        v = Math.max(0, Math.min(100, v));
        fig.style.setProperty('--pos', v + '%');
        range.value = Math.round(v);
      };
      const fromEvent = e => {
        const r = box.getBoundingClientRect();
        set(((e.clientX - r.left) / r.width) * 100);
      };
      let dragging = false;
      box.addEventListener('pointerdown', e => {
        touched = true; dragging = true;
        box.setPointerCapture(e.pointerId);
        fromEvent(e);
      });
      box.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
      const stop = () => { dragging = false; };
      box.addEventListener('pointerup', stop);
      box.addEventListener('pointercancel', stop);
      range.addEventListener('input', () => { touched = true; set(+range.value); });

      if (animate) {
        const state = { v: 100 };
        set(100);
        gsap.to(state, {
          v: 50, ease: 'none',
          onUpdate: () => { if (!touched) set(state.v); },
          scrollTrigger: { trigger: fig, start: 'top 85%', end: 'top 30%', scrub: 0.8 }
        });
      }
    });
  }

  /* fotos que abrem por recorte, de baixo para cima (Details, Parallax Images) */
  function setupReveals() {
    $$('.reveal-clip').forEach(fig => {
      const img = $('img', fig);
      gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0% round 14px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.5, ease: 'expo.inOut',
        scrollTrigger: { trigger: fig, start: 'top 88%' }
      });
      gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.9, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 88%' } });
    });
    gsap.to('.em-b', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.empresas', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('.svc-list li').forEach((li, i) => {
      gsap.from(li, { y: 40, opacity: 0, duration: 1, delay: (i % 3) * 0.05, scrollTrigger: { trigger: li, start: 'top 92%' } });
    });
    gsap.from('.pedido', { y: 60, opacity: 0, duration: 1.3, scrollTrigger: { trigger: '.pedido', start: 'top 88%' } });
  }

  /* galeria: colunas em velocidades diferentes */
  function setupGallery() {
    const cols = $$('.gal-col');
    const speeds = [-6, -16, -4, -12];
    cols.forEach((c, i) => {
      gsap.to(c, { yPercent: speeds[i % speeds.length], ease: 'none', scrollTrigger: { trigger: '.gal', start: 'top bottom', end: 'bottom top', scrub: true } });
      $$('img', c).forEach(img => {
        gsap.fromTo(img, { clipPath: 'inset(100% 0 0 0 round 14px)' }, {
          clipPath: 'inset(0% 0 0 0 round 14px)', duration: 1.4, ease: 'expo.inOut',
          scrollTrigger: { trigger: img, start: 'top 92%' }
        });
      });
    });
  }

  /* o nome no rodapé ocupa a largura exata */
  function setupFooter() {
    const el = $('.footer-name');
    const span = $('span', el);
    const fit = () => {
      el.style.fontSize = '100px';
      const w = el.clientWidth;
      el.style.fontSize = (100 * w / span.offsetWidth) + 'px';
    };
    fit();
    window.addEventListener('resize', fit);
    gsap.from(span, { yPercent: 60, opacity: 0, duration: 1.4, scrollTrigger: { trigger: el, start: 'top 95%' } });
  }

  /* ======================================================================
     Cabeçalho: barra de progresso e pílula que desliza até a seção ativa
     (Unlumen, Motion Navigation)
     ====================================================================== */
  function setupHeader() {
    const header = $('#header');
    const nav = $('.nav');
    const indicator = $('.nav-indicator');
    const links = $$('.nav a');
    let active = null;

    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate(self) {
        header.classList.toggle('is-scrolled', self.scroll() > 30);
        gsap.set('.header-progress span', { scaleX: self.progress });
      }
    });

    const moveTo = a => {
      if (!a) { indicator.style.opacity = 0; return; }
      indicator.style.opacity = 1;
      indicator.style.width = a.offsetWidth + 'px';
      indicator.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    const setActive = a => {
      active = a;
      links.forEach(l => l.classList.toggle('is-active', l === a));
      moveTo(a);
    };
    links.forEach(a => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: self => {
          if (self.isActive) setActive(a);
          else if (active === a) setActive(null);
        }
      });
    });
    nav.addEventListener('mouseleave', () => moveTo(active));
    window.addEventListener('resize', () => moveTo(active));
  }

  /* serviços: a foto segue o cursor (Unlumen Hover Image List, Skiper) */
  function setupServiceFloat() {
    const box = $('.svc-float');
    const img = $('img', box);
    const xTo = gsap.quickTo(box, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(box, 'y', { duration: 0.6, ease: 'power3' });
    const rTo = gsap.quickTo(box, 'rotate', { duration: 0.8, ease: 'power3' });
    let lastX = 0;
    $$('.svc').forEach(a => {
      a.addEventListener('pointerenter', e => {
        img.src = a.dataset.img;
        gsap.set(box, { x: e.clientX - 120, y: e.clientY - 150 });
        gsap.to(box, { opacity: 1, scale: 1, duration: 0.5, overwrite: 'auto' });
      });
      a.addEventListener('pointermove', e => {
        xTo(e.clientX + 30); yTo(e.clientY - 150);
        rTo(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.6)));
        lastX = e.clientX;
      });
      a.addEventListener('pointerleave', () => gsap.to(box, { opacity: 0, scale: 0.6, duration: 0.4, overwrite: 'auto' }));
    });
  }

  /* orçamento: rastro de fotos atrás do cursor (Unlumen Cursor Image Trail) */
  function setupTrail() {
    const sec = $('.contato');
    const trail = $('.trail');
    const srcs = ['g-floral', 'sv-poltronas', 'g-tapete', 'sv-sofa', 'g-colchao', 'ad-poltrona-depois', 'sv-cadeiras', 'g-retratil'];
    const imgs = srcs.map(s => {
      const im = new Image();
      im.alt = '';
      im.src = `assets/media/${s}.webp`;
      trail.appendChild(im);
      return im;
    });
    let i = 0, lx = 0, ly = 0;
    sec.addEventListener('pointermove', e => {
      if (e.target.closest('.pedido')) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.hypot(dx, dy) < 110) return;
      lx = e.clientX; ly = e.clientY;
      const r = sec.getBoundingClientRect();
      const im = imgs[i++ % imgs.length];
      gsap.killTweensOf(im);
      gsap.set(im, { x: e.clientX - r.left - 75, y: e.clientY - r.top - 94, opacity: 1, scale: 0.6, rotate: gsap.utils.random(-10, 10), zIndex: i });
      gsap.to(im, { scale: 1, duration: 0.5, ease: 'expo.out' });
      gsap.to(im, { opacity: 0, y: '+=60', scale: 0.85, duration: 0.9, delay: 0.45, ease: 'power2.in' });
    });
  }

  /* botões magnéticos (MicroKit, Magnetic Fill Button) */
  function setupMagnetic() {
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  function setupCursor() {
    const cursor = $('.cursor');
    const label = $('.cursor-label');
    d.classList.add('has-cursor');
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });
    let on = false;
    window.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', e => {
        label.textContent = el.dataset.cursor;
        if (!on) gsap.set(cursor, { x: e.clientX, y: e.clientY });
        on = true;
        gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.5, overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', () => {
        on = false;
        gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.35, ease: 'power2.in', overwrite: 'auto' });
      });
    });
  }

  /* ======================================================================
     O que precisa funcionar mesmo sem animação: âncoras, menu, vídeos,
     comparador e o formulário do WhatsApp.
     ====================================================================== */
  function goTo(hash, instant) {
    const target = hash === '#inicio' ? 0 : $(hash);
    if (target === null) return;
    if (lenis) lenis.scrollTo(target, { duration: instant ? 0 : 1.4, immediate: !!instant, offset: hash === '#inicio' ? 0 : -8 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
  }

  function basics(lenis) {
    /* âncoras; um serviço clicado já vem marcado no orçamento */
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute('href');
      if (hash.length < 2) return;
      if (hash !== '#inicio' && !$(hash)) return;
      e.preventDefault();
      if (a.dataset.item) {
        const box = $(`.chips input[value="${a.dataset.item}"]`);
        if (box) box.checked = true;
      }
      if (d.classList.contains('menu-open')) toggleMenu(false);
      goTo(hash);
      if (hash === '#principal') $('#principal').focus({ preventScroll: true });
    });

    /* menu do celular: camadas entram em sequência (StaggeredMenu, React Bits) */
    const toggle = $('.menu-toggle');
    const menu = $('#menu');
    let menuTl = null;
    function toggleMenu(open) {
      d.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      menu.setAttribute('aria-hidden', !open);
      menu.inert = !open;
      if (lenis) open ? lenis.stop() : lenis.start();
      const parts = $$('.menu-layer, .menu-panel', menu);
      const links = $$('.menu-panel nav a, .menu-foot', menu);
      if (menuTl) menuTl.kill();
      if (!window.gsap) {
        parts.forEach(p => { p.style.transform = open ? 'none' : ''; });
        return;
      }
      if (open) {
        menuTl = gsap.timeline()
          .to(parts, { xPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07 })
          .from(links, { y: 40, opacity: 0, duration: 0.8, stagger: 0.05 }, 0.25);
      } else {
        menuTl = gsap.timeline().to(parts.slice().reverse(), { xPercent: 100, duration: 0.5, ease: 'expo.in', stagger: 0.05 });
      }
    }
    if (window.gsap) gsap.set($$('.menu-layer, .menu-panel', menu), { x: 0, xPercent: 100 });
    toggle.addEventListener('click', () => toggleMenu(!d.classList.contains('menu-open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && d.classList.contains('menu-open')) toggleMenu(false); });

    /* vídeos: só tocam quando aparecem na tela */
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vids = $$('video');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          const v = en.target;
          if (en.isIntersecting) {
            if (v.preload === 'none') v.preload = 'auto';
            if (!reduce) { const p = v.play(); if (p) p.catch(() => {}); }
          } else v.pause();
        });
      }, { rootMargin: '200px 0px' });
      vids.forEach(v => io.observe(v));
    }
    if (reduce) vids.forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

    /* comparador funciona mesmo sem GSAP */
    if (!window.gsap || !d.classList.contains('motion')) setupCompare(false);

    /* bolhas de sabão no clique (ClickSpark, React Bits) */
    if (!reduce && window.gsap) {
      document.addEventListener('pointerdown', e => {
        if (e.target.closest('input, label, .compare-box, .menu')) return;
        for (let i = 0; i < 5; i++) {
          const b = document.createElement('span');
          b.className = 'pop';
          const s = gsap.utils.random(10, 24);
          Object.assign(b.style, { width: s + 'px', height: s + 'px', left: e.clientX - s / 2 + 'px', top: e.clientY - s / 2 + 'px' });
          document.body.appendChild(b);
          const ang = gsap.utils.random(-Math.PI, 0);
          const dist = gsap.utils.random(30, 70);
          gsap.fromTo(b, { scale: 0.2, opacity: 1 }, {
            x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - 20, scale: 1, opacity: 0,
            duration: gsap.utils.random(0.7, 1.1), ease: 'power2.out', onComplete: () => b.remove()
          });
        }
      });
    }

    /* formulário: monta a mensagem e abre o WhatsApp */
    const form = $('#pedido');
    const erro = $('#pedido-erro');
    form.addEventListener('change', () => { erro.hidden = true; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const itens = data.getAll('itens');
      if (!itens.length) { erro.hidden = false; $('.chips input').focus(); return; }
      const nome = (data.get('nome') || '').trim();
      const detalhe = (data.get('detalhe') || '').trim();
      const bairro = (data.get('bairro') || '').trim();
      const linhas = [
        `Olá, Santiago!${nome ? ` Aqui é ${nome}.` : ''} Vim pelo site e quero um orçamento.`,
        `Quero lavar: ${itens.join(', ')}.`
      ];
      if (detalhe) linhas.push(`Detalhes: ${detalhe}.`);
      if (bairro) linhas.push(`Bairro/cidade: ${bairro}.`);
      linhas.push('Vou mandar uma foto em seguida.');
      const link = document.createElement('a');
      link.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(linhas.join('\n'))}`;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }
})();
