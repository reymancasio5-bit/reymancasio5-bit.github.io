/* ═══════════════════════════════════════════════════════════════
   THREE-SCENE.JS — Lightweight hero background
   Initialised by main.js after THREE is loaded
═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── Mobile GPU safety ── */
    var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    /* Skip on very low-end or mobile */
    var nav = navigator;
    var hardwareCores = nav.hardwareConcurrency || 2;
    if (isMobile && hardwareCores <= 2) {
        canvas.style.display = 'none';
        return;
    }

    var renderer, scene, camera, particles, animId;
    var W = 0, H = 0;
    var mouse = { x: 0, y: 0 };

    function init() {
        if (typeof THREE === 'undefined') return;

        /* Renderer */
        renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);

        /* Scene / Camera */
        scene  = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        camera.position.z = 5;

        /* Particle cloud */
        var COUNT = isMobile ? 400 : 900;
        var positions = new Float32Array(COUNT * 3);
        var colors    = new Float32Array(COUNT * 3);

        var c1 = new THREE.Color(0x00d4ff);
        var c2 = new THREE.Color(0x8a2be2);

        for (var i = 0; i < COUNT; i++) {
            var i3 = i * 3;
            positions[i3]     = (Math.random() - 0.5) * 14;
            positions[i3 + 1] = (Math.random() - 0.5) * 8;
            positions[i3 + 2] = (Math.random() - 0.5) * 6;

            var t   = Math.random();
            var col = c1.clone().lerp(c2, t);
            colors[i3]     = col.r;
            colors[i3 + 1] = col.g;
            colors[i3 + 2] = col.b;
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

        var mat = new THREE.PointsMaterial({
            size:         0.04,
            vertexColors: true,
            transparent:  true,
            opacity:       0.65,
            depthWrite:   false,
            sizeAttenuation: true,
        });

        particles = new THREE.Points(geo, mat);
        scene.add(particles);

        resize();
        canvas.classList.add('ready');
        animate();
    }

    function animate() {
        animId = requestAnimationFrame(animate);
        var t = Date.now() * 0.0002;
        if (particles) {
            particles.rotation.y = t * 0.25 + mouse.x * 0.15;
            particles.rotation.x = t * 0.10 + mouse.y * 0.08;
        }
        renderer.render(scene, camera);
    }

    function resize() {
        if (!renderer) return;
        var header = document.querySelector('header');
        W = header ? header.offsetWidth  : window.innerWidth;
        H = header ? header.offsetHeight : window.innerHeight;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
    }

    /* Debounced resize */
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
    }, { passive: true });

    /* Subtle mouse parallax */
    document.addEventListener('mousemove', function (e) {
        mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* Destroy when leaving viewport (performance) */
    var headerObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!renderer) return;
            if (entry.isIntersecting) {
                if (!animId) animate();
            } else {
                cancelAnimationFrame(animId);
                animId = null;
            }
        });
    }, { threshold: 0 });

    var headerEl = document.querySelector('header');
    if (headerEl) headerObs.observe(headerEl);

    /* Public init — called from main.js after THREE loaded */
    window.initThreeScene = init;
})();