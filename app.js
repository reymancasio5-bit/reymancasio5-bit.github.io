/* ══════════════════════════════════════════
   REYMAN D. CASIO — Portfolio JS
   ══════════════════════════════════════════ */

'use strict';

// ── Cursor — RAF throttled for smoothness ────
const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');
let mouseX = 0, mouseY = 0;
let trailX = 0, trailY = 0;
let rafScheduled = false;

function updateCursor() {
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
  trailX += (mouseX - trailX) * 0.12;
  trailY += (mouseY - trailY) * 0.12;
  cursorTrail.style.left = trailX + 'px';
  cursorTrail.style.top  = trailY + 'px';
  rafScheduled = false;
}

if (window.matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(updateCursor);
    }
  }, { passive: true });

  // Trail loop
  (function loop() {
    trailX += (mouseX - trailX) * 0.1;
    trailY += (mouseY - trailY) * 0.1;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button, .glass-card, .logo-item, .comp-item, .stat-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1.8)';
      cursorTrail.style.borderColor = 'rgba(56,189,248,0.8)';
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursorTrail.style.borderColor = 'rgba(56,189,248,0.5)';
    }, { passive: true });
  });
}

// ── Nav ──────────────────────────────────────
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// ── Active nav link on scroll ─────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link:not(.cta-link)');

function updateActiveNav() {
  let current = '';
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 100 && rect.bottom > 100) {
      current = section.id;
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });

// ── Reveal on scroll ─────────────────────────
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, (entry.target.dataset.delay || 0) * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

reveals.forEach((el, i) => {
  el.dataset.delay = i % 4;
  revealObserver.observe(el);
});

// ── Counter animation ─────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1800;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statNums = document.querySelectorAll('.stat-num[data-target]');
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statNums.forEach(el => counterObserver.observe(el));

// ── Tabs ─────────────────────────────────────
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    const targetEl = document.getElementById('tab-' + target);
    if (targetEl) targetEl.classList.add('active');
  });
});

// ── Ripple effect ─────────────────────────────
document.querySelectorAll('.glass-card, .btn, .contact-card').forEach(el => {
  el.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
});

// ── Subtle glassdrop parallax — very light, RAF throttled ──
const glassdrops = document.querySelectorAll('.glassdrop');
let parallaxX = 0, parallaxY = 0;
let targetPX = 0, targetPY = 0;
let parallaxRaf = false;

if (window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches) {
  document.addEventListener('mousemove', e => {
    targetPX = (e.clientX / window.innerWidth  - 0.5) * 14;
    targetPY = (e.clientY / window.innerHeight - 0.5) * 14;
  }, { passive: true });

  (function parallaxLoop() {
    parallaxX += (targetPX - parallaxX) * 0.04;
    parallaxY += (targetPY - parallaxY) * 0.04;
    glassdrops.forEach((gd, i) => {
      const f = (i % 3 + 1) * 0.4;
      gd.style.transform = `translate(${parallaxX * f}px, ${parallaxY * f}px) translateZ(0)`;
    });
    requestAnimationFrame(parallaxLoop);
  })();
}

// ── Card tilt on hover — RAF throttled ────────
document.querySelectorAll('.glass-card').forEach(card => {
  let tiltRaf = null;
  card.addEventListener('mousemove', e => {
    if (tiltRaf) return;
    tiltRaf = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const dx = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
      const dy = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
      card.style.transform = `translateY(-4px) rotateX(${-dy}deg) rotateY(${dx}deg)`;
      tiltRaf = null;
    });
  }, { passive: true });
  card.addEventListener('mouseleave', () => {
    if (tiltRaf) { cancelAnimationFrame(tiltRaf); tiltRaf = null; }
    card.style.transition = 'transform 0.5s ease, box-shadow 0.35s ease, border-color 0.35s ease';
    card.style.transform = '';
    setTimeout(() => { card.style.transition = ''; }, 500);
  }, { passive: true });
});

// ── Modal ─────────────────────────────────────
const modalData = {
  receipt: {
    title: 'Receipt Data Entry Automation',
    tag: 'n8n + AI + Telegram Bot + Google Drive + Google Sheets',
    desc: 'An intelligent automation system that transforms manual receipt processing into a seamless, AI-powered workflow. Users simply send receipt photos via Telegram, and the system automatically extracts data, categorizes expenses, and maintains organized financial records.',
    img: 'https://drive.google.com/thumbnail?id=1IUhWV0wo-0269Vdw1GJXwpDFyKA_IpR9&sz=w1600',
    features: [
      '<strong>Telegram Integration:</strong> Users send receipt photos directly via Telegram bot for instant processing',
      '<strong>Cloud Storage:</strong> Automatic upload to Google Drive with secure sharing permissions',
      '<strong>AI-Powered OCR:</strong> GPT-4 extracts date, vendor, amount, tax, payment method, and expense category',
      '<strong>Structured Data Output:</strong> Automatic JSON parsing validates and normalizes extracted information',
      '<strong>Automated Logging:</strong> Data appended to Google Sheets with timestamps and categorization',
      '<strong>Instant Feedback:</strong> Confirmation message sent to user with verification link',
      '<strong>Impact:</strong> Eliminated 100% of manual data entry, reduced processing time from 5 minutes to 10 seconds per receipt'
    ]
  },
  invoice: {
    title: 'Overdue Invoice Reminder System',
    tag: 'n8n + Telegram Bot + Gmail + Google Sheets',
    desc: 'A smart accounts receivable automation that monitors invoice statuses and sends professional payment reminders via email. Triggered by simple Telegram commands, the system identifies overdue invoices, sends personalized reminders, and updates tracking records automatically.',
    img: 'https://drive.google.com/thumbnail?id=13iT4iahn-eTyQixmjvaiK--1pjZFrJsu&sz=w1600',
    features: [
      '<strong>Telegram Control:</strong> Simple "remind" command triggers the entire workflow remotely',
      '<strong>Smart Filtering:</strong> Automatically identifies unpaid invoices and excludes already-reminded customers',
      '<strong>Personalized Emails:</strong> Dynamic email generation with customer name, invoice number, amount, and due date',
      '<strong>Professional Templates:</strong> Polite, professional reminder messages maintain good customer relationships',
      '<strong>Status Tracking:</strong> Automatic updates to Google Sheets mark reminder status and timestamps',
      '<strong>Batch Processing:</strong> Handles multiple overdue invoices in a single workflow execution',
      '<strong>Real-time Reporting:</strong> Sends summary to Telegram showing number of reminders sent',
      '<strong>Impact:</strong> Reduced accounts receivable follow-up time by 90%, improved payment collection by 35%'
    ]
  }
};

function openModal(key) {
  const data = modalData[key];
  if (!data) return;
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-tag">${data.tag}</div>
    <h3>${data.title}</h3>
    <p class="modal-desc">${data.desc}</p>
    <img class="modal-img" src="${data.img}" alt="${data.title}" onerror="this.style.display='none'" />
    <ul class="modal-features">
      ${data.features.map(f => `<li>${f}</li>`).join('')}
    </ul>
    <a href="#" class="modal-download">📥 Download Workflow</a>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Expose to global scope for inline onclick
window.openModal = openModal;
window.closeModal = closeModal;

// ── Smooth scroll for anchor links ────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ── Particle click effect ─────────────────────
document.addEventListener('click', e => {
  if (window.innerWidth < 768) return;
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: hsl(${190 + Math.random() * 60}, 90%, 70%);
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      animation: particleFly 0.8s ease-out forwards;
    `;
    document.body.appendChild(particle);
    const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
    const dist = 40 + Math.random() * 60;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    particle.animate([
      { transform: `translate(-50%, -50%) scale(1)`, opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
    ], { duration: 700, easing: 'cubic-bezier(0,0.9,0.57,1)', fill: 'forwards' });
    setTimeout(() => particle.remove(), 700);
  }
});
