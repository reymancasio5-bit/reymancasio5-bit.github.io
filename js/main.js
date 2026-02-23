/**
 * main.js — GSAP + ScrollTrigger + UI interactions
 * Architecture: Module pattern, passive listeners, requestAnimationFrame batching
 */
(function () {
  'use strict';

  // ─── Register GSAP plugin ─────────────────────────────────────────────────
  gsap.registerPlugin(ScrollTrigger);

  // ─── Utility ──────────────────────────────────────────────────────────────
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  // ─── Navigation ───────────────────────────────────────────────────────────
  const navbar = qs('#navbar');
  const hamburger = qs('#hamburger');
  const navLinks = qs('#nav-links');
  const allNavLinks = qsa('.nav-link');

  // Scroll class on nav
  ScrollTrigger.create({
    start: 80,
    onEnter: () => navbar.classList.add('scrolled'),
    onLeaveBack: () => navbar.classList.remove('scrolled'),
  });

  // Active nav link on scroll
  const sections = qsa('section[id]');
  const observerOpts = { rootMargin: `-${window.innerHeight * 0.35}px 0px -${window.innerHeight * 0.35}px 0px` };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        allNavLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, observerOpts);

  sections.forEach(s => sectionObserver.observe(s));

  // Hamburger menu
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close nav on link click (mobile)
  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Click outside mobile nav to close
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !hamburger.contains(e.target)) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    }
  }, { passive: true });

  // ─── Hero GSAP entrance ───────────────────────────────────────────────────
  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTL
    .from('.hero-photo-wrap', { scale: 0.5, opacity: 0, duration: 1, delay: 0.3 })
    .from('.hero-name', { y: 40, opacity: 0, duration: 0.8 }, '-=0.6')
    .from('.hero-title', { y: 20, opacity: 0, duration: 0.6 }, '-=0.5')
    .from('.hero-stats .stat', {
      y: 30, opacity: 0, duration: 0.5,
      stagger: 0.12,
    }, '-=0.4')
    .from('.hero-cta .glass-btn', {
      y: 20, opacity: 0, duration: 0.5,
      stagger: 0.1,
    }, '-=0.3');

  // ─── Counter animation ────────────────────────────────────────────────────
  const counters = qsa('[data-count]');
  let countersStarted = false;

  function startCounters() {
    if (countersStarted) return;
    countersStarted = true;

    counters.forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      gsap.to({ val: 0 }, {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        delay: 0.3,
        onUpdate: function () {
          el.textContent = Math.round(this.targets()[0].val);
        },
      });
    });
  }

  // Trigger counters when hero stats are visible
  const statsEl = qs('.hero-stats');
  if (statsEl) {
    ScrollTrigger.create({
      trigger: statsEl,
      start: 'top 90%',
      onEnter: startCounters,
    });
    // Also trigger immediately since hero is first section
    setTimeout(startCounters, 1000);
  }

  // ─── Scroll reveal — Intersection Observer (lighter than GSAP for many els)
  const revealEls = qsa('.glass-card, .section-title, .sub-title, .stack-label, .contact-sub, .contact-links, .availability-tag');

  revealEls.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // fire once
      }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

  revealEls.forEach(el => revealObserver.observe(el));

  // ─── GSAP stagger for competency grid ────────────────────────────────────
  ScrollTrigger.create({
    trigger: '.competency-grid',
    start: 'top 80%',
    onEnter: () => {
      gsap.from('.comp-item', {
        y: 25, opacity: 0, duration: 0.5,
        stagger: { amount: 0.8, from: 'start' },
        ease: 'power2.out',
      });
    },
    once: true,
  });

  // ─── Project card hover magnetic tilt ─────────────────────────────────────
  qsa('.project-card').forEach(card => {
    card.addEventListener('mousemove', onCardMouseMove, { passive: true });
    card.addEventListener('mouseleave', onCardMouseLeave, { passive: true });
  });

  function onCardMouseMove(e) {
    const rect = this.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;

    gsap.to(this, {
      rotateY: dx * 8,
      rotateX: -dy * 8,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 800,
    });
  }

  function onCardMouseLeave() {
    gsap.to(this, {
      rotateY: 0, rotateX: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    });
  }

  // ─── Modals ───────────────────────────────────────────────────────────────
  function openModal(id) {
    const modal = qs(`#${id}`);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.focus();

    // Trap escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') closeModal(id);
      document.removeEventListener('keydown', escHandler);
    };
    document.addEventListener('keydown', escHandler);
  }

  function closeModal(id) {
    const modal = qs(`#${id}`);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Open modal via "View Details" buttons
  qsa('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(trigger.dataset.modal);
    });
  });

  // Close button
  qsa('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Click overlay to close
  qsa('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Resume thumbnail click
  const resumeTrigger = qs('#resume-trigger');
  if (resumeTrigger) {
    resumeTrigger.addEventListener('click', () => openModal('modal-resume'));
  }

  // ─── Workflow flow — animate arrows on scroll ──────────────────────────────
  qsa('.workflow-flow').forEach(flow => {
    ScrollTrigger.create({
      trigger: flow,
      start: 'top 85%',
      onEnter: () => {
        gsap.from(flow.querySelectorAll('.wf-step, .wf-arrow'), {
          opacity: 0,
          x: -15,
          duration: 0.35,
          stagger: 0.08,
          ease: 'power2.out',
        });
      },
      once: true,
    });
  });

  // ─── Smooth scroll polyfill for anchors (Safari compatibility) ───────────
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ─── Icon marquee pause-on-hover is handled by CSS ────────────────────────
  // (animation-play-state: paused on parent hover)

  // ─── Parallax on hero photo (desktop only) ────────────────────────────────
  if (!('ontouchstart' in window)) {
    document.addEventListener('mousemove', (e) => {
      const xRatio = (e.clientX / window.innerWidth - 0.5) * 12;
      const yRatio = (e.clientY / window.innerHeight - 0.5) * 8;

      gsap.to('.hero-photo-wrap', {
        x: xRatio,
        y: yRatio,
        duration: 1.2,
        ease: 'power2.out',
      });
    }, { passive: true });
  }

  // ─── Refresh ScrollTrigger on font/image load ─────────────────────────────
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

})();
