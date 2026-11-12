/*!
 * <astra-hero-logo>: AstraeLink animated logo mark for the homepage hero.
 * Version 1.0, 12 November 2026. No dependencies, no network requests.
 *
 * Accessibility (WCAG 2.2 AA):
 *  - 2.2.2 Pause, Stop, Hide: visible Pause/Play button. Also stops for the
 *    OS "reduce motion" setting, for the site's own "Pause motion" option
 *    (html.astra-motion), when scrolled out of view and when the tab is hidden.
 *  - 2.3.1 Three Flashes: nothing flashes; every change is slow and soft.
 *  - 1.1.1 Non-text Content: the artwork is decorative (aria-hidden), because
 *    the logo is already named in the site header.
 *  - 2.1.1, 2.4.7, 2.5.8, 4.1.2: a native 44x44px <button> with a visible
 *    focus ring and an accessible name that reflects its state.
 *  - 1.4.11 Non-text Contrast: the button border and icon use the page text colour.
 */
(() => {
  if (!('customElements' in window) || customElements.get('astra-hero-logo')) return;

  // Logo geometry measured from /logos/astraea-logo.png (units = logo pixels).
  const NODES = [
    { x: 86,  y: 24,  r: 18.7 }, // top
    { x: 69,  y: 81,  r: 18.7 }, // middle-left
    { x: 123, y: 89,  r: 18.4 }, // middle-right
    { x: 23,  y: 138, r: 18.4 }, // bottom-left
    { x: 154, y: 138, r: 19.1 }, // bottom-right
    { x: 84,  y: 139, r: 19.0 }  // bottom-centre
  ];
  const PAIRS = [[0, 2], [1, 3], [5, 4]];   // the three joined pairs of the mark
  const CX = 89.8, CY = 101.5;              // centre of the mark
  const RING_R = 100;
  const INTRO_MS = 3200;                    // assembly animation length
  const ARC_LAP_MS = 15000;                 // one lap of the orange arc
  const SHEEN_EVERY_MS = 7000;              // soft highlight across the mark

  const TAU = Math.PI * 2;
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const pt = (c, a, r) => ({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  const f = n => n.toFixed(2);
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const smooth = x => x * x * (3 - 2 * x);
  const expo = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

  // Orange arc: 78 degrees of the ring, head at angle 0 (rotated into place each frame).
  const ARC_SPAN = 78 * Math.PI / 180;
  const ARC_TAIL = pt({ x: CX, y: CY }, -ARC_SPAN, RING_R);
  const ARC_HEAD = pt({ x: CX, y: CY }, 0, RING_R);
  const ARC_D = `M${f(ARC_TAIL.x)} ${f(ARC_TAIL.y)}A${RING_R} ${RING_R} 0 0 1 ${f(ARC_HEAD.x)} ${f(ARC_HEAD.y)}`;

  // Smooth "metaball" bridge between two circles (concave neck).
  function bridge(c1, r1, c2, r2, v, handle = 2.4) {
    const d = dist(c1, c2);
    if (v <= 0.01 || d <= Math.abs(r1 - r2)) return '';
    let u1 = 0, u2 = 0;
    if (d < r1 + r2) {
      u1 = Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d));
      u2 = Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d));
    }
    const a = ang(c1, c2);
    const spread = Math.acos((r1 - r2) / d);
    const a1 = a + u1 + (spread - u1) * v;
    const a2 = a - u1 - (spread - u1) * v;
    const a3 = a + Math.PI - u2 - (Math.PI - u2 - spread) * v;
    const a4 = a - Math.PI + u2 + (Math.PI - u2 - spread) * v;
    const p1 = pt(c1, a1, r1), p2 = pt(c1, a2, r1), p3 = pt(c2, a3, r2), p4 = pt(c2, a4, r2);
    const total = r1 + r2;
    const d2 = Math.min(v * handle, dist(p1, p3) / total) * Math.min(1, (d * 2) / total);
    const h1 = pt(p1, a1 - Math.PI / 2, r1 * d2), h2 = pt(p2, a2 + Math.PI / 2, r1 * d2);
    const h3 = pt(p3, a3 + Math.PI / 2, r2 * d2), h4 = pt(p4, a4 - Math.PI / 2, r2 * d2);
    return `M${f(p1.x)} ${f(p1.y)}C${f(h1.x)} ${f(h1.y)} ${f(h3.x)} ${f(h3.y)} ${f(p3.x)} ${f(p3.y)}` +
           `L${f(p4.x)} ${f(p4.y)}C${f(h4.x)} ${f(h4.y)} ${f(h2.x)} ${f(h2.y)} ${f(p2.x)} ${f(p2.y)}Z`;
  }

  const CSS = `
    :host {
      display: block; position: relative; width: 100%; max-width: 560px; aspect-ratio: 1 / 1; margin-inline: auto;
      contain: layout paint;
      color: var(--astra-text, #f0f0e8);
      --accent: var(--astra-accent, #f85030);
      --head: var(--accent);      /* fallback for browsers without color-mix() */
      --sheen: currentColor;
    }
    @supports (color: color-mix(in srgb, red, blue)) {
      :host { --head: color-mix(in srgb, var(--accent) 78%, #ffffff); --sheen: color-mix(in srgb, currentColor 80%, #ffffff); }
    }
    svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .mark path, .mark circle { fill: url(#astra-fill); }
    .s-base { stop-color: currentColor; }
    .s-sheen { stop-color: var(--sheen); }
    .s-acc0 { stop-color: var(--accent); stop-opacity: 0; }
    .s-acc1 { stop-color: var(--accent); stop-opacity: .35; }
    .s-acc2 { stop-color: var(--accent); stop-opacity: .95; }
    .s-head { stop-color: var(--head); stop-opacity: 1; }
    .ring { fill: none; stroke: currentColor; stroke-opacity: .1; stroke-width: .5; }
    .arc path { fill: none; stroke: url(#astra-arc); stroke-linecap: round; }
    .arc .core { stroke-width: 2.6; }
    .arc .halo { stroke-width: 6; opacity: .35; filter: url(#astra-soft); }
    .arc .head { fill: var(--head); }
    button {
      position: absolute; right: 4%; bottom: 4%; width: 44px; height: 44px; border-radius: 50%;
      display: grid; place-items: center; cursor: pointer; padding: 0; margin: 0;
      background: var(--astra-bg, #101010); color: inherit;
      border: 1.5px solid currentColor;     /* page text colour: 16:1 contrast in both themes */
    }
    button:hover { background: color-mix(in srgb, currentColor 10%, var(--astra-bg, #101010)); }
    button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
    button svg { width: 18px; height: 18px; }
    button svg * { fill: currentColor; }
    [hidden] { display: none !important; }
    .vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }
    @media (forced-colors: active) {
      button { border-color: ButtonText; color: ButtonText; background: Canvas; }
      button:focus-visible { outline-color: Highlight; }
    }
  `;

  class AstraHeroLogo extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>${CSS}</style>
        <svg viewBox="-22.2 -10.5 224 224" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="astra-fill" gradientUnits="userSpaceOnUse" x1="-400" y1="0" x2="-310" y2="40">
              <stop offset="0" class="s-base"/><stop offset=".42" class="s-base"/>
              <stop offset=".5" class="s-sheen"/>
              <stop offset=".58" class="s-base"/><stop offset="1" class="s-base"/>
            </linearGradient>
            <linearGradient id="astra-arc" gradientUnits="userSpaceOnUse"
                            x1="${f(ARC_TAIL.x)}" y1="${f(ARC_TAIL.y)}" x2="${f(ARC_HEAD.x)}" y2="${f(ARC_HEAD.y)}">
              <stop offset="0" class="s-acc0"/><stop offset=".45" class="s-acc1"/>
              <stop offset=".85" class="s-acc2"/><stop offset="1" class="s-head"/>
            </linearGradient>
            <filter id="astra-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
          </defs>
          <circle class="ring" cx="${CX}" cy="${CY}" r="${RING_R}" pathLength="1000" stroke-dasharray="1000 1000"/>
          <g class="arc" opacity="0">
            <path class="halo" d="${ARC_D}"/>
            <path class="core" d="${ARC_D}"/>
            <circle class="head" cx="${f(ARC_HEAD.x)}" cy="${f(ARC_HEAD.y)}" r="1.9"/>
          </g>
          <g class="mark">
            ${PAIRS.map(() => '<path/>').join('')}
            ${NODES.map(() => '<circle/>').join('')}
          </g>
        </svg>
        <button type="button" part="toggle">
          <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false" class="i-pause"><rect x="3" y="2" width="4" height="14" rx="1"/><rect x="11" y="2" width="4" height="14" rx="1"/></svg>
          <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false" class="i-play" hidden><path d="M4 2.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 4 2.5Z"/></svg>
          <span class="vh"></span>
        </button>`;

      this.$paths = [...root.querySelectorAll('.mark path')];
      this.$circles = [...root.querySelectorAll('.mark circle')];
      this.$ring = root.querySelector('.ring');
      this.$arc = root.querySelector('.arc');
      this.$sheen = root.querySelector('#astra-fill');
      this.$btn = root.querySelector('button');
      this.$label = root.querySelector('.vh');
      this.$iPause = root.querySelector('.i-pause');
      this.$iPlay = root.querySelector('.i-play');

      this.elapsed = 0;          // animation clock (ms); only advances while playing
      this.last = null;
      this.raf = null;
      this.userChoice = null;    // 'play' | 'pause' once the visitor presses the button
      this.inView = true;

      this.mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
      this.onPref = () => this.update();
      if (this.mqReduce.addEventListener) this.mqReduce.addEventListener('change', this.onPref);

      // Follow the site's own "Pause motion" option.
      this.mo = new MutationObserver(() => { this.userChoice = null; this.update(); });
      this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      this.io = new IntersectionObserver(([e]) => { this.inView = e.isIntersecting; this.update(); });
      this.io.observe(this);
      this.onVis = () => this.update();
      document.addEventListener('visibilitychange', this.onVis);

      this.$btn.addEventListener('click', () => {
        this.userChoice = this.wantsPlay() ? 'pause' : 'play';
        this.update();
      });

      if (this.motionBlocked()) this.elapsed = INTRO_MS;   // show the finished logo, no intro
      this.draw(this.elapsed);
      this.update();
    }

    disconnectedCallback() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      if (this.mo) this.mo.disconnect();
      if (this.io) this.io.disconnect();
      document.removeEventListener('visibilitychange', this.onVis);
      if (this.mqReduce && this.mqReduce.removeEventListener) this.mqReduce.removeEventListener('change', this.onPref);
    }

    motionBlocked() {
      return this.mqReduce.matches || document.documentElement.classList.contains('astra-motion');
    }

    wantsPlay() {
      return this.userChoice ? this.userChoice === 'play' : !this.motionBlocked();
    }

    update() {
      const play = this.wantsPlay();
      this.$label.textContent = play ? 'Pause logo animation' : 'Play logo animation';
      this.$iPause.toggleAttribute('hidden', !play);
      this.$iPlay.toggleAttribute('hidden', play);
      const run = play && this.inView && !document.hidden;
      if (run && !this.raf) { this.last = null; this.raf = requestAnimationFrame(t => this.tick(t)); }
      if (!run && this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
      if (!play && this.elapsed < INTRO_MS) { this.elapsed = INTRO_MS; this.draw(INTRO_MS); } // never freeze mid-intro
    }

    tick(now) {
      if (this.last !== null) this.elapsed += Math.min(now - this.last, 64);
      this.last = now;
      this.draw(this.elapsed);
      this.raf = requestAnimationFrame(t => this.tick(t));
    }

    draw(t) {
      const idle = Math.max(0, t - INTRO_MS);

      // The thin guide ring draws itself in, then rests.
      this.$ring.setAttribute('stroke-dashoffset', f(1000 * (1 - smooth(clamp01(t / 1600)))));

      // Orbs arrive in sequence, then the mark breathes and sways very slightly.
      const sway = Math.sin(idle / 16000 * TAU) * (2.5 * Math.PI / 180) * smooth(clamp01(idle / 1500));
      const pos = NODES.map((n, i) => {
        const k = expo(clamp01((t - 250 - i * 110) / 1900));
        const p = PAIRS.findIndex(pr => pr.includes(i));
        const [a, b] = PAIRS[p];
        const dir = ang(NODES[a], NODES[b]);
        const breathe = Math.sin(idle / 5600 * TAU + p * TAU / 3) * 1.3 * (i === a ? -1 : 1);
        const dx = (n.x - CX) * (1 + (1 - k) * 0.55) + Math.cos(dir) * breathe;
        const dy = (n.y - CY) * (1 + (1 - k) * 0.55) + Math.sin(dir) * breathe;
        const r0 = sway + (1 - k) * -0.6;
        return { x: CX + dx * Math.cos(r0) - dy * Math.sin(r0), y: CY + dx * Math.sin(r0) + dy * Math.cos(r0), r: Math.max(0.01, n.r * k) };
      });
      pos.forEach((p, i) => {
        const c = this.$circles[i];
        c.setAttribute('cx', f(p.x)); c.setAttribute('cy', f(p.y)); c.setAttribute('r', f(p.r));
      });

      // The pairs flow together into the logo.
      const v = smooth(clamp01((t - 1900) / 1100)) * 0.46;
      PAIRS.forEach(([a, b], k) => this.$paths[k].setAttribute('d', bridge(pos[a], pos[a].r, pos[b], pos[b].r, v)));

      // The orange arc fades in, then glides around the ring.
      this.$arc.setAttribute('opacity', f(smooth(clamp01((t - 2400) / 1200))));
      this.$arc.setAttribute('transform', `rotate(${f(-90 + (t / ARC_LAP_MS) * 360)} ${CX} ${CY})`);

      // A soft sheen crosses the mark every 7 seconds.
      const s = (idle % SHEEN_EVERY_MS) / 1800;
      const x = s < 1 && idle > 0 ? -120 + smooth(s) * 360 : -400;
      this.$sheen.setAttribute('x1', f(x)); this.$sheen.setAttribute('x2', f(x + 90));
    }
  }

  customElements.define('astra-hero-logo', AstraHeroLogo);
})();
