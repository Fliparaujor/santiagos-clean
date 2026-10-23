/* ==========================================================================
   Santiago's Clean · interações
   GSAP + ScrollTrigger para as animações e Lenis para a rolagem suave.
   Tudo local, roda estático no GitHub Pages.
   O gesto da página é a passada do bico extrator: da esquerda para a direita.
   ========================================================================== */
(() => {
  const d = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WHATSAPP = '5535999103461';

  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* sem viúvas: a última palavra de cada bloco de texto desce junto com a
     penúltima (espaço que não quebra entre as duas) */
  $$('p, li, h1, h2, h3, figcaption, .svc-desc, .etapa-nome').forEach(el => {
    if (el.querySelector('p, li, h2, h3')) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const t = nodes[i].nodeValue;
      const trimmed = t.replace(/\s+$/, '');
      if (!trimmed.trim()) continue;
      const k = trimmed.lastIndexOf(' ');
      if (k > 0 && trimmed.slice(0, k).trim()) {
        nodes[i].nodeValue = trimmed.slice(0, k) + ' ' + trimmed.slice(k + 1) + t.slice(trimmed.length);
      } else if (i > 0 && / $/.test(nodes[i - 1].nodeValue)) {
        nodes[i - 1].nodeValue = nodes[i - 1].nodeValue.replace(/ $/, ' ');
      }
      break;
    }
  });

  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGSAP && d.classList.contains('motion');

  if (!motion) d.classList.remove('motion');
  basics();
  if (!hasGSAP) { d.classList.add('ready'); return; }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'power3.out', duration: 1 });

  /* ---------- rolagem suave ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.__lenis = lenis;

  setupHeader();
  setupCompare(motion);
  setupComo(motion);

  if (!motion) { d.classList.add('ready'); return; }

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 2000))
  ]);
  fontsReady.then(() => {
    setupWipes();
    setupReveals();
    setupParallax();
    ScrollTrigger.refresh();
    d.classList.add('ready');
    heroIntro();
  });

  /* ======================================================================
     Abertura: o bico passa na poltrona inteira, da sujeira para o limpo,
     e volta para o meio. O título entra junto, na mesma direção.
     ====================================================================== */
  function heroIntro() {
    const fig = $('.compare-hero');
    const st = { v: 100 };
    fig._set(100);
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo('.hero-title', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power2.inOut' }, 0)
      .to(st, { v: 0, duration: 1.5, ease: 'power2.inOut', onUpdate: () => fig._set(st.v) }, 0.1)
      .to(st, { v: 50, duration: 0.9, ease: 'power3.out', onUpdate: () => fig._set(st.v) }, 1.7)
      .from('.hero-lead, .hero-actions, .hero-who', { opacity: 0, y: 12, stagger: 0.08, duration: 0.7 }, 0.7);
  }

  /* títulos entram com a passada, da esquerda para a direita */
  function setupWipes() {
    $$('[data-wipe]').forEach(el => {
      if (el.classList.contains('hero-title')) return;
      gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power2.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  }

  /* fotos abrem pela mesma passada; a foto assenta enquanto abre */
  function setupReveals() {
    $$('[data-reveal]').forEach(fig => {
      const img = $('img', fig);
      gsap.fromTo(fig, { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power2.inOut',
        scrollTrigger: { trigger: fig, start: 'top 85%' }
      });
      gsap.fromTo(img, { scale: 1.15, xPercent: -4 }, {
        scale: 1, xPercent: 0, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: fig, start: 'top 85%' }
      });
    });
  }

  /* movimentos que acompanham a rolagem */
  function setupParallax() {
    gsap.to('.em-b', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.empresas', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.agua-video', { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.agua', start: 'top bottom', end: 'center center', scrub: true } });
    $$('.svc-list li').forEach(li => {
      gsap.fromTo(li, { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut',
        scrollTrigger: { trigger: li, start: 'top 92%' }
      });
    });
  }

  /* ======================================================================
     Cabeçalho: barra de progresso amarela e a seção ativa sublinhada
     ====================================================================== */
  function setupHeader() {
    const header = $('#header');
    const links = $$('.nav a');
    const zap = $('.zap-fixo');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate(self) {
        header.classList.toggle('is-scrolled', self.scroll() > 10);
        gsap.set('.header-progress span', { scaleX: self.progress });
      }
    });
    // o botão fixo aparece depois do topo e some no orçamento, onde já há um botão
    ScrollTrigger.create({
      trigger: '.hero', start: 'bottom 70%', endTrigger: '#orcamento', end: 'top 80%',
      onToggle: self => zap.classList.toggle('is-visible', self.isActive)
    });
    links.forEach(a => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: self => a.classList.toggle('is-active', self.isActive)
      });
    });
  }

  /* ======================================================================
     Antes e depois: arrastar o bico; nas comparações de baixo, o bico corre
     sozinho uma vez quando a foto entra na tela.
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
      fig._set = v => { if (!touched) set(v); };
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

      if (animate && !fig.classList.contains('compare-hero')) {
        const st = { v: 100 };
        set(100);
        gsap.to(st, {
          v: 50, ease: 'none',
          onUpdate: () => fig._set(st.v),
          scrollTrigger: { trigger: fig, start: 'top 85%', end: 'top 35%', scrub: 0.6 }
        });
      }
    });
  }

  /* ======================================================================
     Como é feito: a rolagem anda pelas 4 etapas; a barra de cada etapa
     enche e o vídeo troca. Clicar numa etapa leva até ela.
     ====================================================================== */
  function setupComo(animate) {
    const items = $$('.etapa');
    const btns = $$('.etapa-btn');
    const vids = $$('.como-media video');
    const bars = $$('.etapa-barra span');
    let current = -1;
    const show = i => {
      if (i === current) return;
      current = i;
      items.forEach((li, k) => li.classList.toggle('is-active', k === i));
      vids.forEach((v, k) => {
        v.classList.toggle('is-active', k === i);
        if (k === i) { if (v.preload === 'none') v.preload = 'auto'; const p = v.play(); if (p) p.catch(() => {}); }
        else v.pause();
      });
    };
    show(0);

    if (!animate) {
      btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
      return;
    }
    const st = ScrollTrigger.create({
      trigger: '.como-track', start: 'top top', end: 'bottom bottom',
      onUpdate(self) {
        const p = self.progress * items.length;
        const i = Math.min(items.length - 1, Math.floor(p));
        show(i);
        bars.forEach((b, k) => gsap.set(b, { scaleX: k < i ? 1 : k === i ? Math.min(1, p - i) : 0 }));
      },
      onLeave: () => vids.forEach(v => v.pause()),
      onLeaveBack: () => vids.forEach(v => v.pause()),
      onEnter: () => vids[current] && vids[current].play().catch(() => {}),
      onEnterBack: () => vids[current] && vids[current].play().catch(() => {})
    });
    btns.forEach((b, i) => b.addEventListener('click', () => {
      const y = st.start + (st.end - st.start) * ((i + 0.35) / items.length);
      if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    }));
  }

  /* ======================================================================
     O que precisa funcionar mesmo sem animação: âncoras, menu, vídeos,
     galeria e o formulário do WhatsApp.
     ====================================================================== */
  function goTo(hash) {
    const target = hash === '#inicio' ? 0 : $(hash);
    if (target === null) return;
    const l = window.__lenis;
    if (l) l.scrollTo(target, { duration: 1.3, offset: hash === '#inicio' ? 0 : -64 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
  }

  function basics() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    /* menu do celular: folha que sobe de baixo */
    const toggle = $('.menu-toggle');
    const menu = $('#menu');
    function toggleMenu(open) {
      d.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open);
      menu.setAttribute('aria-hidden', !open);
      menu.inert = !open;
      const l = window.__lenis;
      if (l) open ? l.stop() : l.start();
      if (open) $('nav a', menu).focus({ preventScroll: true });
      else toggle.focus({ preventScroll: true });
    }
    toggle.addEventListener('click', () => toggleMenu(!d.classList.contains('menu-open')));
    $$('[data-close]', menu).forEach(el => el.addEventListener('click', () => toggleMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && d.classList.contains('menu-open')) toggleMenu(false); });

    /* vídeos fora das etapas: tocam só quando aparecem */
    const vids = $$('video').filter(v => !v.closest('.como-media'));
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          const v = en.target;
          if (en.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; const p = v.play(); if (p) p.catch(() => {}); }
          else v.pause();
        });
      }, { rootMargin: '150px 0px' });
      vids.forEach(v => io.observe(v));
    }

    /* botão fixo sem GSAP: aparece depois do topo */
    if (!window.ScrollTrigger) {
      const zap = $('.zap-fixo');
      const onScroll = () => zap.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* galeria: setas e arrastar com o mouse */
    const gal = $('.gal');
    $$('.gal-btn').forEach(b => b.addEventListener('click', () => {
      const item = $('li', gal);
      const step = item ? item.getBoundingClientRect().width + 16 : 300;
      gal.scrollBy({ left: step * +b.dataset.dir, behavior: reduce ? 'auto' : 'smooth' });
    }));
    let down = false, sx = 0, sl = 0, moved = false;
    gal.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = gal.scrollLeft;
      gal.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) moved = true;
      gal.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      gal.classList.remove('is-dragging');
    });
    gal.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);

    /* formulário: monta a mensagem, abre o WhatsApp e solta as bolhas */
    const form = $('#pedido');
    const erro = $('#pedido-erro');
    const ok = $('#pedido-ok');
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
      ok.hidden = false;
      if (!reduce && window.gsap) bolhas($('.ficha-enviar'));
    });
  }

  /* bolhas de sabão saindo do botão, como na marca */
  function bolhas(el) {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const b = document.createElement('span');
      b.className = 'pop';
      const s = gsap.utils.random(10, 34);
      Object.assign(b.style, {
        width: s + 'px', height: s + 'px',
        left: (r.left + gsap.utils.random(0, r.width)) - s / 2 + 'px',
        top: (r.top + r.height / 2) - s / 2 + 'px'
      });
      document.body.appendChild(b);
      gsap.fromTo(b, { scale: 0.3, opacity: 1 }, {
        y: -gsap.utils.random(80, 220), x: gsap.utils.random(-40, 40), scale: 1,
        duration: gsap.utils.random(1.1, 1.8), ease: 'power1.out', delay: i * 0.03
      });
      gsap.to(b, { opacity: 0, duration: 0.3, delay: gsap.utils.random(0.9, 1.6), onComplete: () => b.remove() });
    }
  }
})();
