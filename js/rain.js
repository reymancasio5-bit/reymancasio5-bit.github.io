/**
 * rain.js — Wet Glass Window Raindrop Effect
 * Technique: Canvas 2D — realistic droplets clinging and sliding on glass
 * NO Three.js for this effect (Canvas 2D is faster for this specific look)
 * Performance: static background layer (painted once) + animated drops only
 */
(function () {
  'use strict';

  const canvas = document.getElementById('rain-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 2;
  const isLowEnd = cores <= 2;

  let W = window.innerWidth;
  let H = window.innerHeight;
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);

  // ─── Off-screen static layer ─────────────────────────────────────────────
  const staticCanvas = document.createElement('canvas');
  const sCtx = staticCanvas.getContext('2d');

  function buildStatic() {
    staticCanvas.width  = Math.round(W * DPR);
    staticCanvas.height = Math.round(H * DPR);
    sCtx.save();
    sCtx.scale(DPR, DPR);

    // Dark navy background gradient
    const bg = sCtx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   '#010810');
    bg.addColorStop(0.5, '#020c1c');
    bg.addColorStop(1,   '#010a16');
    sCtx.fillStyle = bg;
    sCtx.fillRect(0, 0, W, H);

    // Blurred city-light colour blobs (bokeh effect — seen through wet glass)
    const blobs = [
      { x: 0.12, y: 0.18, r: 160, h: 210, s: 0.7, l: 0.35, a: 0.12 },
      { x: 0.78, y: 0.12, r: 130, h: 195, s: 0.8, l: 0.4,  a: 0.10 },
      { x: 0.50, y: 0.55, r: 200, h: 230, s: 0.6, l: 0.3,  a: 0.09 },
      { x: 0.88, y: 0.72, r: 110, h: 165, s: 0.9, l: 0.45, a: 0.08 },
      { x: 0.08, y: 0.82, r: 140, h: 200, s: 0.7, l: 0.38, a: 0.10 },
      { x: 0.62, y: 0.28, r: 90,  h: 270, s: 0.8, l: 0.4,  a: 0.07 },
      { x: 0.35, y: 0.88, r: 120, h: 220, s: 0.6, l: 0.35, a: 0.08 },
    ];

    blobs.forEach(b => {
      const bx = b.x * W, by = b.y * H;
      const g = sCtx.createRadialGradient(bx, by, 0, bx, by, b.r);
      const col = `hsla(${b.h},${b.s*100}%,${b.l*100}%,${b.a})`;
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = g;
      sCtx.beginPath();
      sCtx.arc(bx, by, b.r, 0, Math.PI * 2);
      sCtx.fill();
    });

    // Glass fog / condensation — very faint white vignette
    const fog = sCtx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.85);
    fog.addColorStop(0, 'rgba(0,0,0,0)');
    fog.addColorStop(1, 'rgba(180,220,255,0.025)');
    sCtx.fillStyle = fog;
    sCtx.fillRect(0, 0, W, H);

    // Static micro-drops (dew) — tiny still droplets on the glass
    const micro = isLowEnd ? 80 : (isMobile ? 150 : 260);
    for (let i = 0; i < micro; i++) {
      const mx = Math.random() * W;
      const my = Math.random() * H;
      const mr = 1 + Math.random() * 4;
      paintDrop(sCtx, mx, my, mr, 0, 0.5 + Math.random() * 0.4);
    }

    sCtx.restore();
  }

  // ─── Drop painter ────────────────────────────────────────────────────────
  // r = radius, elongation = how much taller (sliding), alpha = opacity
  function paintDrop(c, x, y, r, elong, alpha) {
    if (r < 0.4) return;
    c.save();
    c.globalAlpha = alpha;

    const h = r + elong; // total height

    // Drop path: rounded top + pointed/elongated bottom
    c.beginPath();
    if (elong > 0) {
      // Teardrop / sliding shape
      c.moveTo(x, y - h);
      c.bezierCurveTo(x + r,     y - h + r*0.8,
                      x + r*0.9, y + h * 0.4,
                      x,         y + h);
      c.bezierCurveTo(x - r*0.9, y + h * 0.4,
                      x - r,     y - h + r*0.8,
                      x,         y - h);
    } else {
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    c.closePath();

    // Body gradient — dark cool interior, lighter edge (lens effect)
    const bodyG = c.createRadialGradient(
      x - r * 0.2, y - r * 0.25, r * 0.05,
      x,           y,             r * 1.1
    );
    bodyG.addColorStop(0,    'rgba(200, 235, 255, 0.60)');
    bodyG.addColorStop(0.25, 'rgba(80,  160, 240, 0.40)');
    bodyG.addColorStop(0.6,  'rgba(15,  55,  130, 0.55)');
    bodyG.addColorStop(1,    'rgba(0,   10,  35,  0.70)');
    c.fillStyle = bodyG;
    c.fill();

    // Internal "refraction" — lighter oval inside simulating inverted scene
    const refrG = c.createRadialGradient(
      x + r * 0.15, y + r * 0.2, 0,
      x + r * 0.1,  y + r * 0.1, r * 0.75
    );
    refrG.addColorStop(0,   'rgba(140, 210, 255, 0.45)');
    refrG.addColorStop(0.5, 'rgba(30,  100, 200, 0.15)');
    refrG.addColorStop(1,   'rgba(0,   0,   0,   0)');
    c.fillStyle = refrG;
    c.fill();

    // Specular highlight — top-left bright crescent (key visual cue for "glass")
    const specG = c.createRadialGradient(
      x - r * 0.32, y - r * 0.38, 0,
      x - r * 0.25, y - r * 0.2,  r * 0.52
    );
    specG.addColorStop(0,   'rgba(255, 255, 255, 0.85)');
    specG.addColorStop(0.4, 'rgba(210, 240, 255, 0.30)');
    specG.addColorStop(1,   'rgba(0,   0,   0,   0)');
    c.fillStyle = specG;
    c.fill();

    // Thin rim
    c.strokeStyle = 'rgba(140, 210, 255, 0.18)';
    c.lineWidth   = 0.4;
    c.stroke();

    c.restore();
  }

  // ─── Animated drop objects ───────────────────────────────────────────────
  const LIVE_COUNT = isLowEnd ? 20 : (isMobile ? 32 : 50);

  function newDrop(randomY) {
    const r = 3 + Math.random() * 11;
    return {
      x:     Math.random() * W,
      y:     randomY ? Math.random() * H : -(r * 4),
      r:     r,
      elong: r * (0.5 + Math.random() * 2.5),
      speed: 0.08 + Math.random() * 0.3,   // slow — clinging to glass
      alpha: 0.45 + Math.random() * 0.45,
      drift: (Math.random() - 0.5) * 0.006,
      // Pause: drops hesitate before sliding (surface tension)
      paused:     Math.random() > 0.5,
      pauseTicks: Math.floor(Math.random() * 180 + 40),
    };
  }

  let drops = Array.from({ length: LIVE_COUNT }, () => newDrop(true));

  // ─── Render loop ─────────────────────────────────────────────────────────
  let raf = null;
  let lastNow = 0;
  let tick = 0;
  const SKIP = isLowEnd ? 3 : (isMobile ? 2 : 1); // frame skip on weak devices

  function render(now) {
    raf = requestAnimationFrame(render);
    tick++;
    if (tick % SKIP !== 0) return;

    const dt = Math.min((now - lastNow) / 16.67, 3);
    lastNow = now;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Blit static background
    ctx.drawImage(staticCanvas, 0, 0, staticCanvas.width, staticCanvas.height, 0, 0, W, H);

    // Animate + draw live drops
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];

      if (d.paused) {
        d.pauseTicks -= dt;
        if (d.pauseTicks <= 0) d.paused = false;
      } else {
        d.y += d.speed * dt;
        d.x += d.drift * d.r * dt;
        // Slight x clamp so drops don't wander off too fast
        if (d.x < -20) d.x = W + 20;
        if (d.x > W + 20) d.x = -20;
      }

      if (d.y > H + d.r * 4) {
        drops[i] = newDrop(false);
        continue;
      }

      paintDrop(ctx, d.x, d.y, d.r, d.elong, d.alpha);
    }
  }

  // ─── Resize ──────────────────────────────────────────────────────────────
  function handleResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);
    buildStatic();
    drops = Array.from({ length: LIVE_COUNT }, () => newDrop(true));
  }

  handleResize(); // initial sizing

  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(handleResize, 200);
  }, { passive: true });

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = null;
    } else {
      lastNow = performance.now();
      render(lastNow);
    }
  });

  lastNow = performance.now();
  render(lastNow);

})();
