'use strict';

/* ══════════════════════════════════════════════════════════
   WATER DROP CANVAS BACKGROUND
   ══════════════════════════════════════════════════════════ */
(function initWaterCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'waterCanvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, drops = [], trails = [];
  const MAX_DROPS = window.innerWidth < 768 ? 28 : 52;
  const TRAIL_LIFE = 85;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function createDrop(x, y) {
    const r = 9 + Math.random() * 32;
    return {
      x: x !== undefined ? x : Math.random() * W,
      y: y !== undefined ? y : Math.random() * H * 0.65,
      r,
      vy: 0.05 + Math.random() * 0.16,
      vx: (Math.random() - 0.5) * 0.07,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.016 + Math.random() * 0.02,
      alpha: 0.52 + Math.random() * 0.32,
      growing: Math.random() > 0.5,
      life: 0,
      maxLife: 300 + Math.random() * 420,
    };
  }

  for (let i = 0; i < MAX_DROPS; i++) {
    const d = createDrop();
    d.y = Math.random() * H;
    drops.push(d);
  }

  function addTrail(x, y, r) {
    trails.push({ x, y, r: r * 0.26, life: TRAIL_LIFE });
  }

  function drawDrop(d) {
    const { x, y, r, alpha } = d;
    const wx = Math.sin(d.wobble) * r * 0.16;
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.shadowColor = 'rgba(160,215,255,0.22)';
    ctx.shadowBlur  = r * 1.1;
    ctx.shadowOffsetY = r * 0.35;

    ctx.beginPath();
    ctx.ellipse(x + wx, y, r * 0.80, r, 0, 0, Math.PI * 2);

    const gb = ctx.createRadialGradient(x + wx - r * 0.26, y - r * 0.28, r * 0.04, x + wx, y, r * 1.05);
    gb.addColorStop(0,    'rgba(225,245,255,0.42)');
    gb.addColorStop(0.32, 'rgba(185,225,255,0.20)');
    gb.addColorStop(0.68, 'rgba(145,200,245,0.10)');
    gb.addColorStop(1,    'rgba(110,175,225,0.03)');
    ctx.fillStyle = gb;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.50)';
    ctx.lineWidth   = 0.7;
    ctx.stroke();

    /* Top-left shine */
    ctx.beginPath();
    ctx.ellipse(x + wx - r * 0.22, y - r * 0.26, r * 0.30, r * 0.16, -0.5, 0, Math.PI * 2);
    const gs = ctx.createRadialGradient(x + wx - r * 0.22, y - r * 0.26, 0, x + wx - r * 0.22, y - r * 0.26, r * 0.32);
    gs.addColorStop(0,   'rgba(255,255,255,0.75)');
    gs.addColorStop(0.55,'rgba(255,255,255,0.18)');
    gs.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = gs;
    ctx.fill();

    /* Bottom gleam */
    ctx.beginPath();
    ctx.ellipse(x + wx + r * 0.12, y + r * 0.44, r * 0.16, r * 0.07, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(185,235,255,0.26)';
    ctx.fill();

    ctx.restore();
  }

  function drawTrail(t) {
    ctx.save();
    ctx.globalAlpha = (t.life / TRAIL_LIFE) * 0.16;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r);
    g.addColorStop(0, 'rgba(200,235,255,0.28)');
    g.addColorStop(1, 'rgba(200,235,255,0)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  function drawGlassBase() {
    /* Lighter deep-blue base — feels like frosted window glass at dusk */
    const bg = ctx.createLinearGradient(0, 0, W * 0.5, H);
    bg.addColorStop(0,   '#07111f');
    bg.addColorStop(0.45,'#060e1b');
    bg.addColorStop(1,   '#091422');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* Ambient light pools — boosted brightness for "lighter" feel */
    [
      { x: W * 0.78, y: H * 0.08, r: W * 0.50, c: 'rgba(56,189,248,0.10)'  },
      { x: W * 0.12, y: H * 0.78, r: W * 0.42, c: 'rgba(129,140,248,0.10)' },
      { x: W * 0.50, y: H * 0.48, r: W * 0.30, c: 'rgba(52,211,153,0.06)'  },
      { x: W * 0.90, y: H * 0.62, r: W * 0.25, c: 'rgba(56,189,248,0.07)'  },
      { x: W * 0.30, y: H * 0.22, r: W * 0.20, c: 'rgba(200,220,255,0.04)' },
    ].forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.c); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
  }

  function mergeDrops() {
    for (let i = 0; i < drops.length; i++) {
      for (let j = i + 1; j < drops.length; j++) {
        const a = drops[i], b = drops[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < (a.r + b.r) * 0.70) {
          const big = a.r >= b.r ? a : b;
          const sm  = a.r >= b.r ? b : a;
          big.r = Math.min(big.r + sm.r * 0.36, 56);
          big.vy += sm.vy * 0.45;
          drops.splice(drops.indexOf(sm), 1);
        }
      }
    }
  }

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);
    drawGlassBase();

    trails = trails.filter(t => t.life-- > 0);
    trails.forEach(drawTrail);

    drops.forEach((d, i) => {
      d.wobble += d.wobbleSpeed;
      d.life++;
      d.y += d.vy + Math.sin(d.wobble * 0.5) * 0.035;
      d.x += d.vx;
      if (frame % 4 === 0) addTrail(d.x, d.y, d.r);
      if (d.growing && d.r < 42) d.r += 0.011;
      if (d.y - d.r > H || d.x + d.r < 0 || d.x - d.r > W || d.life > d.maxLife) drops[i] = createDrop();
      drawDrop(d);
    });

    if (drops.length < MAX_DROPS && frame % 52 === 0) drops.push(createDrop());
    if (frame % 60 === 0) mergeDrops();
    frame++;
  }
  animate();

  /* Click spawns drops at cursor */
  document.addEventListener('click', e => {
    if (e.target.closest('a, button, .glass-card, .modal')) return;
    for (let i = 0; i < 4; i++) {
      const d = createDrop(e.clientX + (Math.random() - 0.5) * 38, e.clientY + (Math.random() - 0.5) * 38);
      d.r = 7 + Math.random() * 16; d.vy = 0.22 + Math.random() * 0.38; d.alpha = 0.72;
      drops.push(d);
    }
  }, { passive: true });
})();


/* ══════════════════════════════════
   CUSTOM CURSOR
   ══════════════════════════════════ */
const cursor      = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');
let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

if (window.matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = mouseX + 'px'; cursor.style.top = mouseY + 'px';
  }, { passive: true });

  (function trailLoop() {
    trailX += (mouseX - trailX) * 0.10;
    trailY += (mouseY - trailY) * 0.10;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';
    requestAnimationFrame(trailLoop);
  })();

  document.querySelectorAll('a, button, .glass-card, .logo-item, .comp-item, .stat-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1.8)';
      cursorTrail.style.borderColor = 'rgba(56,189,248,0.9)';
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursorTrail.style.borderColor = 'rgba(56,189,248,0.45)';
    }, { passive: true });
  });
}


/* ══════════════════════════════════
   NAV
   ══════════════════════════════════ */
const nav        = document.getElementById('nav');
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 30), { passive: true });
hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); mobileMenu.classList.toggle('open'); });
document.querySelectorAll('.mob-link').forEach(l => l.addEventListener('click', () => { hamburger.classList.remove('open'); mobileMenu.classList.remove('open'); }));

const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link:not(.cta-link)');
function updateActiveNav() {
  let cur = '';
  sections.forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= 110 && r.bottom > 110) cur = s.id; });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
}
window.addEventListener('scroll', updateActiveNav, { passive: true });


/* ══════════════════════════════════
   REVEAL ON SCROLL
   ══════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), parseInt(e.target.dataset.delay || 0) * 80);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => { el.dataset.delay = i % 4; revealObs.observe(el); });


/* ══════════════════════════════════
   COUNTER ANIMATION
   ══════════════════════════════════ */
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = parseInt(e.target.dataset.target), start = performance.now(), dur = 1800;
      (function step(now) {
        const p = Math.min((now - start) / dur, 1);
        e.target.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step);
      })(start);
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num[data-target]').forEach(el => counterObs.observe(el));


/* ══════════════════════════════════
   TABS
   ══════════════════════════════════ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const el = document.getElementById('tab-' + btn.dataset.tab);
    if (el) el.classList.add('active');
  });
});


/* ══════════════════════════════════
   RIPPLE
   ══════════════════════════════════ */
document.querySelectorAll('.glass-card, .btn, .contact-card').forEach(el => {
  el.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect(), rip = document.createElement('span');
    rip.classList.add('ripple');
    const sz = Math.max(rect.width, rect.height);
    rip.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - rect.left - sz/2}px;top:${e.clientY - rect.top - sz/2}px`;
    this.appendChild(rip);
    setTimeout(() => rip.remove(), 700);
  });
});


/* ══════════════════════════════════
   CARD TILT (RAF throttled)
   ══════════════════════════════════ */
document.querySelectorAll('.glass-card').forEach(card => {
  let raf = null;
  card.addEventListener('mousemove', e => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width  - 0.5) * 7;
      const dy = ((e.clientY - r.top)  / r.height - 0.5) * 7;
      card.style.transform = `translateY(-4px) rotateX(${-dy}deg) rotateY(${dx}deg)`;
      raf = null;
    });
  }, { passive: true });
  card.addEventListener('mouseleave', () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    card.style.transition = 'transform 0.55s ease, box-shadow 0.35s ease, border-color 0.35s ease';
    card.style.transform  = '';
    setTimeout(() => card.style.transition = '', 560);
  }, { passive: true });
});


/* ══════════════════════════════════
   GLASSDROP PARALLAX
   ══════════════════════════════════ */
const glassdrops = document.querySelectorAll('.glassdrop');
if (glassdrops.length && window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches) {
  let tx = 0, ty = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => {
    tx = (e.clientX / window.innerWidth  - 0.5) * 16;
    ty = (e.clientY / window.innerHeight - 0.5) * 16;
  }, { passive: true });
  (function loop() {
    cx += (tx - cx) * 0.04; cy += (ty - cy) * 0.04;
    glassdrops.forEach((gd, i) => {
      const f = (i % 3 + 1) * 0.36;
      gd.style.transform = `translate(${cx * f}px, ${cy * f}px) translateZ(0)`;
    });
    requestAnimationFrame(loop);
  })();
}


/* ══════════════════════════════════
   MODAL
   ══════════════════════════════════ */
const modalData = {
  receipt: {
    title: 'Receipt Data Entry Automation',
    tag:   'n8n + AI + Telegram Bot + Google Drive + Google Sheets',
    desc:  'An intelligent automation system that transforms manual receipt processing into a seamless, AI-powered workflow. Users simply send receipt photos via Telegram, and the system automatically extracts data, categorizes expenses, and maintains organized financial records.',
    img:   'https://drive.google.com/thumbnail?id=1IUhWV0wo-0269Vdw1GJXwpDFyKA_IpR9&sz=w1600',
    features: [
      '<strong>Telegram Integration:</strong> Users send receipt photos directly via Telegram bot for instant processing',
      '<strong>Cloud Storage:</strong> Automatic upload to Google Drive with secure sharing permissions',
      '<strong>AI-Powered OCR:</strong> GPT-4 extracts date, vendor, amount, tax, payment method, and expense category',
      '<strong>Structured Data Output:</strong> Automatic JSON parsing validates and normalizes extracted information',
      '<strong>Automated Logging:</strong> Data appended to Google Sheets with timestamps and categorization',
      '<strong>Instant Feedback:</strong> Confirmation message sent to user with verification link',
      '<strong>Impact:</strong> Eliminated 100% of manual data entry, reduced processing time from 5 minutes to 10 seconds per receipt',
    ],
  },
  invoice: {
    title: 'Overdue Invoice Reminder System',
    tag:   'n8n + Telegram Bot + Gmail + Google Sheets',
    desc:  'A smart accounts receivable automation that monitors invoice statuses and sends professional payment reminders via email. Triggered by simple Telegram commands, the system identifies overdue invoices, sends personalized reminders, and updates tracking records automatically.',
    img:   'https://drive.google.com/thumbnail?id=13iT4iahn-eTyQixmjvaiK--1pjZFrJsu&sz=w1600',
    features: [
      '<strong>Telegram Control:</strong> Simple "remind" command triggers the entire workflow remotely',
      '<strong>Smart Filtering:</strong> Automatically identifies unpaid invoices and excludes already-reminded customers',
      '<strong>Personalized Emails:</strong> Dynamic email generation with customer name, invoice number, amount, and due date',
      '<strong>Professional Templates:</strong> Polite, professional reminder messages maintain good customer relationships',
      '<strong>Status Tracking:</strong> Automatic updates to Google Sheets mark reminder status and timestamps',
      '<strong>Batch Processing:</strong> Handles multiple overdue invoices in a single workflow execution',
      '<strong>Real-time Reporting:</strong> Sends summary to Telegram showing number of reminders sent',
      '<strong>Impact:</strong> Reduced accounts receivable follow-up time by 90%, improved payment collection by 35%',
    ],
  },
};

function openModal(key) {
  const data = modalData[key]; if (!data) return;
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-tag">${data.tag}</div>
    <h3>${data.title}</h3>
    <p class="modal-desc">${data.desc}</p>
    <img class="modal-img" src="${data.img}" alt="${data.title}" onerror="this.style.display='none'" />
    <ul class="modal-features">${data.features.map(f => `<li>${f}</li>`).join('')}</ul>
    <a href="#" class="modal-download">📥 Download Workflow</a>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
window.openModal  = openModal;
window.closeModal = closeModal;


/* ══════════════════════════════════
   SMOOTH SCROLL
   ══════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const el = document.querySelector(link.getAttribute('href'));
    if (el) { e.preventDefault(); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }
  });
});
