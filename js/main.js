/* ==========================================================================
   Santiago's Clean · interações
   GSAP + ScrollTrigger para as animações e Lenis para a rolagem suave.
   Tudo local, roda estático no GitHub Pages. Os componentes das referências
   (React Bits, 21st, Bencho, Skiper, MicroKit) foram reescritos em JS puro.
   ========================================================================== */
(() => {
  const d = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WHATSAPP = '5535999103461';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* sem viúvas: a última palavra de cada bloco de texto desce junto com a
     penúltima (espaço que não quebra entre as duas) */
  $$('p, li, h1, h2, h3, figcaption, .acc-desc, .etapa-nome').forEach(el => {
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
  if (!hasGSAP) { setupWidgets(); d.classList.add('ready'); return; }

  gsap.registerPlugin(ScrollTrigger);
  setupWidgets();
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
  setupComo(motion);
  setupOS(motion);
  setupAgua(motion);

  if (!motion) { d.classList.add('ready'); return; }

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 2000))
  ]);
  fontsReady.then(() => {
    setupHero();
    setupWipes();
    setupReveals();
    if (finePointer) { setupTilt(); setupPressao(); }
    ScrollTrigger.refresh();
    d.classList.add('ready');
  });

  // componentes que funcionam com ou sem GSAP
  function setupWidgets() {
    setupBolhas();
    setupSanfona();
    setupDesliza();
    setupGaleria();
  }

  /* ======================================================================
     Topo: a página trava e a rolagem passa o bico (21st, Scroll-locked
     video hero). Parado no topo, o vídeo do meio roda sozinho.
     ====================================================================== */
  function setupHero() {
    const scrub = $('.hero-scrub');
    const sides = $$('.tri-a video, .tri-c video');
    let target = 0, shown = -1, scrubbing = false;

    gsap.from('.hero-title', { clipPath: 'inset(0 100% 0 0)', duration: 1.3, ease: 'power2.inOut', delay: 0.1 });
    gsap.from('.hero-lead, .hero-actions', { opacity: 0, y: 14, stagger: 0.1, duration: 0.8, delay: 0.6 });
    gsap.from('.tri', { clipPath: 'inset(100% 0 0 0)', stagger: 0.12, duration: 1.2, ease: 'power3.inOut' });

    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: 'bottom bottom',
      onUpdate(self) {
        const p = self.progress;
        if (p > 0.01 && !scrubbing) { scrubbing = true; scrub.pause(); }
        if (p <= 0.01 && scrubbing) { scrubbing = false; const r = scrub.play(); if (r) r.catch(() => {}); }
        if (scrubbing && scrub.duration) target = p * (scrub.duration - 0.05);
        // o título se desfaz em desfoque enquanto o bico passa
        const q = clamp((p - 0.45) / 0.45, 0, 1);
        gsap.set('.hero-copy', { opacity: 1 - q, filter: `blur(${q * 10}px)`, y: -q * 30 });
        gsap.set('.hero-hint', { opacity: 1 - clamp(p * 4, 0, 1) });
        sides.forEach(v => gsap.set(v, { scale: 1 + p * 0.08 }));
      }
    });
    // acompanha o alvo sem engasgar: um ajuste de tempo por quadro
    gsap.ticker.add(() => {
      if (!scrubbing || !scrub.duration) return;
      if (Math.abs(target - shown) < 0.02) return;
      shown += (target - shown) * 0.35;
      if (!scrub.seeking) scrub.currentTime = shown;
    });
  }

  /* títulos entram com a passada, da esquerda para a direita */
  function setupWipes() {
    $$('[data-wipe]').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power2.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  }

  /* fotos abrem pela mesma passada */
  function setupReveals() {
    $$('[data-reveal]').forEach(fig => {
      const img = $('img', fig);
      gsap.fromTo(fig, { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power2.inOut',
        scrollTrigger: { trigger: fig, start: 'top 85%' }
      });
      gsap.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.6, scrollTrigger: { trigger: fig, start: 'top 85%' } });
    });
    gsap.to('.em-b', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.empresas', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ======================================================================
     Cabeçalho: barra de progresso e seção ativa
     ====================================================================== */
  function setupHeader() {
    const header = $('#header');
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
      trigger: '.hero', start: 'bottom 90%', endTrigger: '#orcamento', end: 'top 80%',
      onToggle: self => zap.classList.toggle('is-visible', self.isActive)
    });
    $$('.nav a').forEach(a => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: self => a.classList.toggle('is-active', self.isActive)
      });
    });
  }

  /* ======================================================================
     Como é feito: a rolagem anda pelas 4 etapas e a mangueira se desenha
     de uma etapa até a outra, com o bico na ponta (Skiper, SVG Follow Scroll)
     ====================================================================== */
  function setupComo(animate) {
    const items = $$('.etapa');
    const btns = $$('.etapa-btn');
    const vids = $$('.como-media video');
    const wrap = $('.etapas-wrap');
    const svg = $('.mangueira');
    const base = $('.mangueira-base');
    const agua = $('.mangueira-agua');
    const bico = $('.mangueira-bico');
    let current = -1, segs = [], total = 0, progress = 0, shown = 0, ang = 0;

    // desenha a mangueira em curvas, passando pelo número de cada etapa
    const buildPath = () => {
      const r0 = wrap.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 44 ${r0.height}`);
      const pts = $$('.etapa-num').map(n => {
        const r = n.getBoundingClientRect();
        return { x: 20, y: r.top - r0.top + r.height / 2 };
      });
      let dStr = `M ${pts[0].x} ${pts[0].y}`;
      pts.slice(1).forEach((p, i) => {
        const a = pts[i];
        const bend = i % 2 ? -16 : 16;
        const dy = p.y - a.y;
        dStr += ` C ${a.x + bend} ${a.y + dy * 0.35}, ${p.x - bend} ${a.y + dy * 0.65}, ${p.x} ${p.y}`;
      });
      base.setAttribute('d', dStr);
      agua.setAttribute('d', dStr);
      total = agua.getTotalLength();
      // comprimento acumulado até cada etapa
      segs = [0];
      const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let acc = `M ${pts[0].x} ${pts[0].y}`;
      pts.slice(1).forEach((p, i) => {
        const a = pts[i];
        const bend = i % 2 ? -16 : 16;
        const dy = p.y - a.y;
        acc += ` C ${a.x + bend} ${a.y + dy * 0.35}, ${p.x - bend} ${a.y + dy * 0.65}, ${p.x} ${p.y}`;
        tmp.setAttribute('d', acc);
        segs.push(tmp.getTotalLength());
      });
      agua.style.strokeDasharray = total;
      draw();
    };
    // a ponta chega no número de uma etapa no meio do trecho dela na rolagem
    const target = () => {
      const n = items.length;
      return animate ? clamp(progress * n - 0.5, 0, n - 1) : n - 1;
    };
    const draw = () => {
      if (!segs.length) return;
      const h = shown;
      const i = Math.min(segs.length - 2, Math.floor(h));
      const len = segs[i] + (segs[i + 1] - segs[i]) * (h - i);
      agua.style.strokeDashoffset = total - len;
      const pt = agua.getPointAtLength(Math.max(0.1, len));
      const pt2 = agua.getPointAtLength(Math.max(0, len - 6));
      const a = Math.atan2(pt.y - pt2.y, pt.x - pt2.x) * 180 / Math.PI - 90;
      ang += (a - ang) * 0.2;
      bico.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ang}deg)`;
    };
    // a mangueira persegue a rolagem com suavidade, quadro a quadro
    const follow = () => {
      const t = target();
      if (Math.abs(t - shown) < 0.001) return;
      shown += (t - shown) * 0.14;
      draw();
    };

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
    window.addEventListener('resize', () => requestAnimationFrame(buildPath));
    if (document.fonts) document.fonts.ready.then(buildPath);

    if (!animate) {
      shown = items.length - 1;
      btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
      return;
    }
    const st = ScrollTrigger.create({
      trigger: '.como-track', start: 'top top', end: 'bottom bottom',
      onUpdate(self) {
        progress = self.progress;
        show(Math.min(items.length - 1, Math.floor(self.progress * items.length)));
      },
      onLeave: () => vids.forEach(v => v.pause()),
      onLeaveBack: () => vids.forEach(v => v.pause()),
      onEnter: () => vids[current] && vids[current].play().catch(() => {}),
      onEnterBack: () => vids[current] && vids[current].play().catch(() => {})
    });
    gsap.ticker.add(follow);
    btns.forEach((b, i) => b.addEventListener('click', () => {
      const y = st.start + (st.end - st.start) * ((i + 0.35) / items.length);
      if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    }));
  }

  /* ======================================================================
     Empresas: ordem de serviço; a linha desce e cada etapa ganha o check
     (21st, Delivery Progress)
     ====================================================================== */
  function setupOS(animate) {
    const os = $('.os');
    const checks = $$('.os-check', os);
    const place = () => {
      const r0 = os.getBoundingClientRect();
      const a = checks[0].getBoundingClientRect(), b = checks[checks.length - 1].getBoundingClientRect();
      os.style.setProperty('--os-top', (a.top - r0.top + a.height / 2) + 'px');
      os.style.setProperty('--os-bottom', (r0.bottom - b.top - b.height / 2) + 'px');
    };
    place();
    window.addEventListener('resize', place);
    if (!animate) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: os, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 } });
    tl.fromTo('.os-linha span', { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: 1 }, 0);
    checks.forEach((c, i) => tl.fromTo(c, { scale: 0.2, backgroundColor: '#1d3a57' }, { scale: 1, backgroundColor: '#1f6fa8', duration: 0.12, ease: 'back.out(2)' }, i / (checks.length - 1) * 0.88));
    tl.fromTo('.os-status', { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.1 }, 0.92);
  }

  /* ======================================================================
     A água: o título mostra a própria água por dentro das letras e o vídeo
     ondula como água sob o dedo (React Bits, Masked Heading e Ripple Distortion)
     ====================================================================== */
  function setupAgua(animate) {
    const big = $('.agua-big');
    if (CSS.supports('background-clip', 'text') || CSS.supports('-webkit-background-clip', 'text')) {
      big.classList.add('is-masked');
      if (animate) {
        // palavra por palavra, e a água corre por dentro das letras com a rolagem
        const words = big.textContent.split(/(\s+)/).map(w => /\s+/.test(w) ? document.createTextNode(w) : Object.assign(document.createElement('span'), { textContent: w }));
        big.textContent = '';
        words.forEach(w => big.appendChild(w));
        const spans = $$('span', big);
        gsap.fromTo(spans, { opacity: 0.08 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: big, start: 'top 80%', end: 'bottom 50%', scrub: 0.5 } });
        gsap.fromTo(big, { backgroundPosition: '50% 0%' }, { backgroundPosition: '50% 100%', ease: 'none', scrollTrigger: { trigger: '.agua', start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    }
    if (reduce) return;
    ripple();
  }

  function ripple() {
    const box = $('.agua-media');
    const video = $('.agua-video');
    const canvas = $('.agua-canvas');
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!gl) return;
    const vs = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }`;
    const fs = `precision mediump float;
      varying vec2 uv; uniform sampler2D tex; uniform float t; uniform float aspect;
      uniform vec3 drops[12];
      void main(){
        vec2 q = uv; vec2 off = vec2(0.0);
        for (int i = 0; i < 12; i++) {
          vec3 dr = drops[i];
          float age = t - dr.z;
          if (dr.z < 0.0 || age > 3.0) continue;
          vec2 dv = (uv - dr.xy) * vec2(1.0, aspect);
          float dist = length(dv);
          float front = age * 0.32;
          float w = sin((dist - front) * 70.0) * exp(-abs(dist - front) * 16.0) * exp(-age * 1.4);
          off += normalize(dv + 1e-5) * w * 0.018;
        }
        vec4 c = texture2D(tex, q + off);
        float shine = clamp(length(off) * 18.0, 0.0, 1.0) * 0.18;
        gl_FragColor = vec4(c.rgb + shine, 1.0);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const uT = gl.getUniformLocation(prog, 't');
    const uA = gl.getUniformLocation(prog, 'aspect');
    const uD = gl.getUniformLocation(prog, 'drops');
    const drops = new Float32Array(36).fill(-1);
    let di = 0, visible = false, last = 0, ok = false;
    const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000;
    const addDrop = (x, y) => { drops.set([x, y, now()], di * 3); di = (di + 1) % 12; };

    const resize = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uA, r.height / r.width);
    };
    resize();
    window.addEventListener('resize', resize);

    const point = e => {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      const t = performance.now();
      if (t - last > 70) { last = t; addDrop(x, y); }
    };
    box.addEventListener('pointermove', point);
    box.addEventListener('pointerdown', e => { last = 0; point(e); });

    const frame = () => {
      if (!visible) return;
      if (video.readyState >= 2) {
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
          if (!ok) { ok = true; box.classList.add('is-gl'); }
        } catch (err) { return; }
        gl.uniform1f(uT, now());
        gl.uniform3fv(uD, drops);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(frame);
    };
    // uma gota de vez em quando, pra mostrar que a água responde
    setInterval(() => { if (visible && performance.now() - last > 2500) addDrop(0.3 + Math.random() * 0.4, 0.35 + Math.random() * 0.3); }, 2600);
    new IntersectionObserver(es => es.forEach(en => {
      visible = en.isIntersecting;
      if (visible) requestAnimationFrame(frame);
    })).observe(box);
  }

  /* ======================================================================
     Quem faz: a foto inclina com o cursor (React Bits, Tilted Card)
     ====================================================================== */
  function setupTilt() {
    const card = $('.quem-card');
    const tilt = $('.quem-tilt');
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.6, ease: 'power3' });
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      ry(x * 14); rx(-y * 14);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* ======================================================================
     Rodapé: o telefone reage ao cursor; as letras engrossam e alargam perto
     dele (React Bits, Text Pressure, com os eixos da Archivo)
     ====================================================================== */
  function setupPressao() {
    const phone = $('.footer-phone');
    const text = phone.textContent;
    phone.textContent = '';
    const chars = [...text].map(c => {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c; s.setAttribute('aria-hidden', 'true');
      phone.appendChild(s);
      return s;
    });
    const set = (s, t) => { s.style.fontVariationSettings = `"wght" ${Math.round(620 + 280 * t)}, "wdth" ${Math.round(104 + 21 * t)}`; };
    chars.forEach(s => set(s, 0));
    const foot = $('.footer');
    let raf = 0, px = -9999, py = -9999;
    const update = () => {
      raf = 0;
      chars.forEach(s => {
        const r = s.getBoundingClientRect();
        const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
        set(s, clamp(1 - Math.hypot(dx, dy) / 260, 0, 1));
      });
    };
    foot.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(update); });
    foot.addEventListener('pointerleave', () => { px = py = -9999; if (!raf) raf = requestAnimationFrame(update); });
  }

  /* ======================================================================
     Antes e depois: a bolha de sabão mostra o limpo por baixo; dá pra
     arrastar, tocar num ponto, usar as setas ou abrir o depois inteiro
     (Bencho, Glass Bubble)
     ====================================================================== */
  function setupBolhas() {
    $$('.bolha').forEach(fig => {
      const box = $('.bolha-box', fig);
      const btn = $('.bolha-ver', fig);
      const st = { x: 50, y: 50, r: 26 };
      let full = false, touched = false, drag = false;
      const apply = () => {
        fig.style.setProperty('--x', st.x + '%');
        fig.style.setProperty('--y', st.y + '%');
        fig.style.setProperty('--raio', st.r + '%');
      };
      apply();
      const moveTo = (e) => {
        const r = box.getBoundingClientRect();
        st.x = clamp((e.clientX - r.left) / r.width * 100, 0, 100);
        st.y = clamp((e.clientY - r.top) / r.height * 100, 0, 100);
        apply();
      };
      box.addEventListener('pointerdown', e => {
        touched = true; drag = true; box.classList.add('is-dragging');
        if (e.pointerType === 'mouse') box.setPointerCapture(e.pointerId);
        if (window.gsap) gsap.killTweensOf(st);
        moveTo(e);
      });
      box.addEventListener('pointermove', e => { if (drag || e.pointerType === 'mouse' && finePointer && touched) moveTo(e); });
      const stop = () => { drag = false; box.classList.remove('is-dragging'); };
      box.addEventListener('pointerup', stop);
      box.addEventListener('pointercancel', stop);
      box.addEventListener('pointerleave', stop);
      const toggle = () => {
        full = !full;
        fig.classList.toggle('is-full', full);
        btn.textContent = full ? 'Voltar pra bolha' : 'Ver depois inteiro';
        const to = full ? 80 : 26;
        if (window.gsap && !reduce) gsap.to(st, { r: to, duration: 0.8, ease: 'power2.inOut', onUpdate: apply });
        else { st.r = to; apply(); }
      };
      btn.addEventListener('click', toggle);
      box.addEventListener('keydown', e => {
        const k = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
        if (k) { e.preventDefault(); touched = true; st.x = clamp(st.x + k[0], 0, 100); st.y = clamp(st.y + k[1], 0, 100); apply(); }
        if (e.key === 'Enter') { e.preventDefault(); toggle(); }
      });
      // na primeira vez que aparece, a bolha atravessa a foto como uma passada
      if (window.gsap && window.ScrollTrigger && !reduce) {
        ScrollTrigger.create({
          trigger: fig, start: 'top 75%', once: true,
          onEnter: () => {
            if (touched) return;
            gsap.timeline({ onUpdate: apply })
              .fromTo(st, { x: 8, y: 30 }, { x: 92, y: 62, duration: 1.6, ease: 'power2.inOut' })
              .to(st, { x: 50, y: 50, duration: 0.9, ease: 'power3.out' });
          }
        });
      }
    });
  }

  /* ======================================================================
     Serviços: sanfona de fotos (React Bits, Accordion Gallery). No toque,
     o primeiro toque abre o painel e o segundo leva ao orçamento.
     ====================================================================== */
  function setupSanfona() {
    const items = $$('.acc-item');
    const open = it => items.forEach(i => i.classList.toggle('is-open', i === it));
    items.forEach(it => {
      const a = $('a', it);
      it.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') open(it); });
      a.addEventListener('focus', () => open(it));
      a.addEventListener('click', e => {
        if (!it.classList.contains('is-open')) { e.preventDefault(); e.stopPropagation(); open(it); }
      });
    });
  }

  /* ======================================================================
     Galeria: parede infinita que se arrasta pra qualquer lado
     (21st, Infinite Drag Scroll). No toque, só na horizontal.
     ====================================================================== */
  function setupGaleria() {
    const inf = $('.inf');
    const stage = $('.inf-stage');
    const fotos = $$('.gal-lista figure').map(f => ({ src: $('img', f).getAttribute('src'), cap: $('figcaption', f).textContent }));
    const n = fotos.length;
    let tw, th, cols, rows, tiles = [];
    let ox = 0, oy = 0, vx = reduce ? 0 : -0.35, vy = 0, visible = false;
    const build = () => {
      const w = inf.clientWidth, h = inf.clientHeight;
      const cw = clamp(w * 0.2, 170, 270);
      tw = cw + 24; th = cw * 1.25 + 34 + 24;
      cols = Math.ceil(w / tw) + 2; rows = Math.ceil(h / th) + 2;
      stage.textContent = '';
      tiles = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const fig = document.createElement('figure');
        fig.className = 'inf-tile'; fig.style.width = cw + 'px';
        const img = document.createElement('img'); img.alt = ''; img.loading = 'lazy'; img.width = 720; img.height = 900;
        const cap = document.createElement('figcaption');
        fig.append(img, cap); stage.appendChild(fig);
        tiles.push({ fig, img, cap, i, j, idx: -1 });
      }
      render();
    };
    const mod = (a, b) => ((a % b) + b) % b;
    const render = () => {
      const sx = mod(ox, tw), sy = mod(oy, th);
      const cx0 = Math.floor(ox / tw), cy0 = Math.floor(oy / th);
      tiles.forEach(t => {
        const x = t.i * tw + sx - tw, y = t.j * th + sy - th;
        const idx = mod((t.i - cx0) * 3 + (t.j - cy0) * 5, n);
        if (idx !== t.idx) { t.idx = idx; t.img.src = fotos[idx].src; t.cap.textContent = fotos[idx].cap; }
        t.fig.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    let down = false, axis = null, lx = 0, ly = 0, sx0 = 0, sy0 = 0, idle = 0;
    inf.addEventListener('pointerdown', e => {
      down = true; axis = e.pointerType === 'mouse' ? 'xy' : null;
      lx = sx0 = e.clientX; ly = sy0 = e.clientY; vx = vy = 0;
      if (axis) { inf.setPointerCapture(e.pointerId); inf.classList.add('is-dragging'); }
    });
    inf.addEventListener('pointermove', e => {
      if (!down) return;
      if (!axis) {
        const dx = Math.abs(e.clientX - sx0), dy = Math.abs(e.clientY - sy0);
        if (dx < 6 && dy < 6) return;
        if (dy > dx) { down = false; return; } // deixa a página rolar
        axis = 'x'; inf.setPointerCapture(e.pointerId); inf.classList.add('is-dragging');
      }
      const dx = e.clientX - lx, dy = axis === 'xy' ? e.clientY - ly : 0;
      lx = e.clientX; ly = e.clientY;
      ox += dx; oy += dy; vx = dx; vy = dy; idle = 0;
      render();
    });
    const up = () => { down = false; axis = null; inf.classList.remove('is-dragging'); };
    inf.addEventListener('pointerup', up);
    inf.addEventListener('pointercancel', up);
    const tick = () => {
      if (!visible) return;
      if (!down) {
        vx *= 0.94; vy *= 0.94; idle++;
        // parado, a parede volta a correr devagar
        if (!reduce && idle > 90 && Math.abs(vx) < 0.4) vx += (-0.35 - vx) * 0.05;
        if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) { ox += vx; oy += vy; render(); }
      }
      requestAnimationFrame(tick);
    };
    build();
    window.addEventListener('resize', build);
    new IntersectionObserver(es => es.forEach(en => { visible = en.isIntersecting; if (visible) requestAnimationFrame(tick); })).observe(inf);
  }

  /* ======================================================================
     Orçamento: arrastar o bico até o fim abre o WhatsApp
     (Bencho, Slide to Confirm). Clique, Enter ou espaço também enviam.
     ====================================================================== */
  function setupDesliza() {
    const track = $('.desliza');
    const handle = $('.desliza-bico');
    const form = $('#pedido');
    let x = 0, down = false, startX = 0, moved = false, max = 0;
    const set = v => { x = v; track.style.setProperty('--x', v + 'px'); };
    const measure = () => { max = track.clientWidth - handle.offsetWidth - 8; };
    measure();
    window.addEventListener('resize', measure);
    const animateTo = (to, done) => {
      if (window.gsap && !reduce) gsap.to({ v: x }, { v: to, duration: 0.35, ease: 'power2.out', onUpdate() { set(this.targets()[0].v); }, onComplete: done });
      else { set(to); done && done(); }
    };
    let downX = 0;
    handle.addEventListener('pointerdown', e => {
      measure(); down = true; moved = false; downX = e.clientX; startX = e.clientX - x;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', e => {
      if (!down) return;
      // só conta como arrastar depois de 8 px; menos que isso é um clique
      if (!moved && Math.abs(e.clientX - downX) < 8) return;
      moved = true;
      set(clamp(e.clientX - startX, 0, max));
    });
    handle.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!moved) return; // clique: o botão envia sozinho
      if (x > max * 0.6) { set(max); form.requestSubmit(handle); }
      else animateTo(0);
    });
    handle.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } });
    // tocar em qualquer ponto da barra também envia
    track.addEventListener('click', e => {
      if (e.target.closest('.desliza-bico')) return;
      form.requestSubmit(handle);
    });
    track._reset = ok => {
      if (ok) {
        track.classList.add('is-done');
        animateTo(max, () => setTimeout(() => { track.classList.remove('is-done'); animateTo(0); }, 1800));
      } else animateTo(0);
    };
  }

  /* ======================================================================
     O que precisa funcionar mesmo sem animação: âncoras, menu, vídeos e
     o formulário do WhatsApp.
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

    /* vídeos fora do topo e das etapas: tocam só quando aparecem */
    const vids = $$('video').filter(v => !v.closest('.como-media, .hero'));
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
    if (reduce) $$('.hero video').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

    /* botão fixo sem GSAP: aparece depois do topo */
    if (!window.ScrollTrigger) {
      const zap = $('.zap-fixo');
      const onScroll = () => zap.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* formulário: monta a mensagem, abre o WhatsApp e solta as bolhas */
    const form = $('#pedido');
    const erro = $('#pedido-erro');
    const ok = $('#pedido-ok');
    const track = $('.desliza');
    form.addEventListener('change', () => { erro.hidden = true; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const itens = data.getAll('itens');
      if (!itens.length) {
        erro.hidden = false;
        $('.chips input').focus();
        if (track._reset) track._reset(false);
        return;
      }
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
      if (track._reset) track._reset(true);
      if (!reduce && window.gsap) bolhas(track);
    });
  }

  /* bolhas de sabão saindo do envio, como na marca */
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
