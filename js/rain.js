/**
 * rain.js — Three.js Raindrop Renderer
 * Architecture: InstancedMesh + object pooling for maximum performance
 * Target: 60fps on low-end mobile devices
 */
(function () {
  'use strict';

  // ─── Performance detection ───────────────────────────────────────────────
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2;

  // Drop count scaled to device capability
  const DROP_COUNT = isLowEnd ? 120 : (isMobile ? 200 : 350);
  const SPLASH_POOL = 30;

  // ─── Scene setup ──────────────────────────────────────────────────────────
  const canvas = document.getElementById('rain-canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,       // off for perf
    powerPreference: 'low-power',
    stencil: false,
    depth: false,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -1, 1);
  camera.position.z = 0;

  // ─── Raindrop geometry & material ─────────────────────────────────────────
  // Each drop is a thin elongated quad rendered as InstancedMesh
  const DROP_W = 1.2;
  const DROP_H = isMobile ? 14 : 18;

  const dropGeo = new THREE.PlaneGeometry(DROP_W, DROP_H);
  const dropMat = new THREE.MeshBasicMaterial({
    color: 0x00c8ff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });

  const instancedDrops = new THREE.InstancedMesh(dropGeo, dropMat, DROP_COUNT);
  instancedDrops.frustumCulled = false;
  scene.add(instancedDrops);

  // ─── Drop state arrays (avoids object GC pressure) ────────────────────────
  const posX = new Float32Array(DROP_COUNT);
  const posY = new Float32Array(DROP_COUNT);
  const speed = new Float32Array(DROP_COUNT);
  const opacity = new Float32Array(DROP_COUNT);
  const length = new Float32Array(DROP_COUNT);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  function initDrop(i, yOverride) {
    posX[i] = Math.random() * (window.innerWidth + 100) - 50;
    posY[i] = yOverride !== undefined ? yOverride : Math.random() * -window.innerHeight * 1.5;
    speed[i] = 4 + Math.random() * 7;
    opacity[i] = 0.08 + Math.random() * 0.18;
    length[i] = 10 + Math.random() * 14;
  }

  for (let i = 0; i < DROP_COUNT; i++) {
    initDrop(i, Math.random() * window.innerHeight); // start spread across screen
  }

  // ─── Splash pool ──────────────────────────────────────────────────────────
  // Simple splash: tiny white circle that fades out
  const splashGeo = new THREE.CircleGeometry(2, 6); // low poly circle
  const splashMat = new THREE.MeshBasicMaterial({
    color: 0x00c8ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const splashes = [];
  for (let s = 0; s < SPLASH_POOL; s++) {
    const mesh = new THREE.Mesh(splashGeo, splashMat.clone());
    mesh.userData = { active: false, life: 0 };
    mesh.visible = false;
    scene.add(mesh);
    splashes.push(mesh);
  }

  let splashIdx = 0;
  function triggerSplash(x, y) {
    const s = splashes[splashIdx % SPLASH_POOL];
    splashIdx++;
    s.position.set(x, y, 0);
    s.scale.set(1, 1, 1);
    s.material.opacity = 0.45;
    s.visible = true;
    s.userData.active = true;
    s.userData.life = 1.0;
  }

  // ─── Animation loop ───────────────────────────────────────────────────────
  let frameId;
  let lastTime = 0;
  const TARGET_DELTA = 1 / 60; // seconds

  function animate(now) {
    frameId = requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta to avoid spikes
    lastTime = now;

    const W = window.innerWidth;
    const H = window.innerHeight;

    for (let i = 0; i < DROP_COUNT; i++) {
      posY[i] += speed[i] * dt * 60 * 0.5;

      if (posY[i] > H + DROP_H) {
        // Trigger splash at bottom occasionally
        if (Math.random() < 0.3) triggerSplash(posX[i], H - 2);
        initDrop(i, -DROP_H - Math.random() * 80);
        posX[i] = Math.random() * (W + 100) - 50;
      }

      dummy.position.set(posX[i], posY[i], 0);
      dummy.scale.set(1, length[i] / DROP_H, 1);
      dummy.updateMatrix();
      instancedDrops.setMatrixAt(i, dummy.matrix);

      // Cyan tint with slight variation
      color.setHSL(0.55 + Math.random() * 0.02, 1, 0.6 + Math.random() * 0.1);
      instancedDrops.setColorAt(i, color);
    }

    instancedDrops.instanceMatrix.needsUpdate = true;
    if (instancedDrops.instanceColor) instancedDrops.instanceColor.needsUpdate = true;

    // Update splashes
    for (let s = 0; s < splashes.length; s++) {
      const sp = splashes[s];
      if (!sp.userData.active) continue;
      sp.userData.life -= dt * 3;
      if (sp.userData.life <= 0) {
        sp.visible = false;
        sp.userData.active = false;
        continue;
      }
      const t = sp.userData.life;
      sp.material.opacity = t * 0.45;
      sp.scale.setScalar(1 + (1 - t) * 2.5);
    }

    renderer.render(scene, camera);
  }

  // ─── Resize handler ───────────────────────────────────────────────────────
  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.right = window.innerWidth;
      camera.top = window.innerHeight;
      camera.updateProjectionMatrix();
    }, 150);
  }, { passive: true });

  // ─── Visibility API — pause when tab hidden ───────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
    } else {
      lastTime = performance.now();
      animate(lastTime);
    }
  });

  // ─── Start ────────────────────────────────────────────────────────────────
  lastTime = performance.now();
  animate(lastTime);

})();
