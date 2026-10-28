/* =========================================================================
   1. PLATFORM DETECTION, SLIDE PANEL & VIBRATION LOGIC (From Your Reference)
   ========================================================================= */
const UA = navigator.userAgent || "";
const isApp = UA.startsWith("Dalvik/");
const isBrowser = /Mozilla\/5\.0/.test(UA) && !isApp;

const VIB_CACHE_KEY = "vibration_support";
const APK_HIDE_KEY = "apk_vib_dismissed";
const BROWSER_HIDE_KEY = "browser_session_dismissed";

const PANEL_IDLE_TIME = 2000;
const redirectURL = "contact.html";

let panelOpened = false;
let panelAutoCloseTimer = null;
let userGestureDone = false;

function startPanelAutoCloseTimer() {
  clearTimeout(panelAutoCloseTimer);
  panelAutoCloseTimer = setTimeout(() => {
    if (panelOpened) closeSlidePanel();
  }, PANEL_IDLE_TIME);
}

function resetPanelAutoCloseTimer() {
  if (!panelOpened) return;
  startPanelAutoCloseTimer();
}

function closeSlidePanel() {
  const slidePanel = document.getElementById("slidePanel");
  if (slidePanel) slidePanel.classList.remove("open");
  panelOpened = false;
  clearTimeout(panelAutoCloseTimer);
}

function detectAndCacheVibration() {
  try {
    if (!navigator.vibrate) {
      localStorage.setItem(VIB_CACHE_KEY, "false");
      return false;
    }
    const ok = navigator.vibrate(50);
    localStorage.setItem(VIB_CACHE_KEY, ok ? "true" : "false");
    return ok;
  } catch (e) {
    localStorage.setItem(VIB_CACHE_KEY, "false");
    return false;
  }
}

function safeVibrate(pattern) {
  if (!navigator.vibrate) return;
  try {
    navigator.vibrate(Array.isArray(pattern) ? pattern : [pattern]);
  } catch (e) {}
}

function showVibrationPopup() {
  const box = document.getElementById("apkVibrationPopup");
  const txt = document.getElementById("apkVibText");
  const okBtn = document.getElementById("apkVibOK");
  const cancelBtn = document.getElementById("apkVibCancel");
  const neverBox = document.getElementById("apkNeverWrap");
  const neverChk = document.getElementById("apkNeverAgain");

  if (isApp && sessionStorage.getItem(APK_HIDE_KEY)) return;
  if (isBrowser && sessionStorage.getItem(BROWSER_HIDE_KEY)) return;
  if (!box || !txt || !okBtn || !cancelBtn) return;

  if (isApp) {
    txt.innerHTML = "Vibration Will Not Work On This APK. For Best Gameplay You Can Use Browser.<br>Press OK To Continue to Browser";
    cancelBtn.style.display = "inline-flex";
    if (neverBox) neverBox.style.display = "block";
  } else {
    txt.innerHTML = "Your Browser May Or May Not Support Vibration.<br>Click OK To Continue Gameplay.";
    cancelBtn.style.display = "none";
    if (neverBox) neverBox.style.display = "none";
  }
  box.style.display = "flex";

  okBtn.onclick = () => {
    if (isApp && neverChk && neverChk.checked) {
      sessionStorage.setItem(APK_HIDE_KEY, "true");
    } else {
      sessionStorage.setItem(BROWSER_HIDE_KEY, "true");
    }
    box.style.display = "none";
  };

  cancelBtn.onclick = () => {
    if (isApp && neverChk && neverChk.checked) {
      sessionStorage.setItem(APK_HIDE_KEY, "true");
    }
    box.style.display = "none";
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // Fake Loader Progress
  let fakePercent = 0;
  const fill = document.getElementById("loadFill");
  const percentTxt = document.getElementById("loadPercent");
  const LOADER_MIN_TIME = 1800;
  const loaderShownAt = performance.now();

  const fake = setInterval(() => {
    fakePercent += Math.random() * 12;
    if (fakePercent > 92) fakePercent = 92;
    if (fill) fill.style.width = fakePercent + "%";
    if (percentTxt) percentTxt.textContent = Math.round(fakePercent) + "%";
  }, 160);

  window.addEventListener("load", () => {
    clearInterval(fake);
    if (fill) fill.style.width = "100%";
    if (percentTxt) percentTxt.textContent = "100%";
    const elapsed = performance.now() - loaderShownAt;
    const remaining = Math.max(0, LOADER_MIN_TIME - elapsed);
    setTimeout(() => {
      const loader = document.getElementById("loader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => { loader.style.display = "none"; }, 600);
      }
    }, remaining);
  });

  // Slide Panel Setup
  const slidePanel = document.getElementById("slidePanel");
  const slideTab = document.getElementById("slideTab");
  const slideContent = document.getElementById("slideContent");

  if (slidePanel && slideTab) {
    slideTab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (panelOpened) {
        closeSlidePanel();
      } else {
        slidePanel.classList.add("open");
        panelOpened = true;
        startPanelAutoCloseTimer();
      }
    });

    document.addEventListener("click", (e) => {
      if (panelOpened && !slidePanel.contains(e.target)) closeSlidePanel();
    });

    slidePanel.addEventListener("click", (e) => {
      e.stopPropagation();
      resetPanelAutoCloseTimer();
    });

    if (slideContent) {
      slideContent.addEventListener("click", (e) => {
        e.stopPropagation();
        closeSlidePanel();
        window.location.href = redirectURL;
      });
    }
  }

  // APK vs Browser Header/Fullscreen Toggle
  const topHeader = document.getElementById("topHeader");
  const fsBtn = document.getElementById("fsBtn");
  if (isApp) {
    if (topHeader) topHeader.style.display = "flex";
    if (fsBtn) fsBtn.style.display = "none";
  } else {
    if (topHeader) topHeader.style.display = "flex";
    if (fsBtn) fsBtn.style.display = "flex";
  }
});

/* =========================================================================
   2. WEB AUDIO SYNTHESIZER, DESI ARCADE BGM & VOICE ENGINE
   ========================================================================= */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let bgmEnabled = true;
let bgmInterval = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function playNoiseImpact(duration = 0.14, filterFreq = 900, volume = 0.28) {
  try {
    initAudio();
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
  } catch (e) {}
}

function playTone(freq = 220, duration = 0.14, type = "sawtooth", slideTo = null, vol = 0.16) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const SFX = {
  whoosh: () => { playTone(320, 0.09, "sine", 110, 0.12); playNoiseImpact(0.07, 1400, 0.12); },
  punchHit: () => { playTone(150, 0.12, "triangle", 55, 0.25); playNoiseImpact(0.12, 850, 0.3); },
  heavyKickHit: () => { playTone(110, 0.22, "sawtooth", 38, 0.3); playNoiseImpact(0.2, 650, 0.4); },
  blockClang: () => { playTone(620, 0.08, "square", 880, 0.14); },
  superCharge: () => { playTone(180, 0.75, "sawtooth", 760, 0.22); },
  superBoom: () => { playTone(95, 0.45, "sawtooth", 28, 0.38); playNoiseImpact(0.45, 500, 0.55); },
  bellGong: () => { playTone(440, 0.65, "sine", 435, 0.22); playTone(880, 0.4, "triangle", 870, 0.12); },
  chaiPowerup: () => { playTone(440, 0.1, "sine", 660, 0.18); setTimeout(() => playTone(660, 0.18, "sine", 880, 0.2), 90); }
};

let beatStep = 0;
const bassNotes = [110, 110, 130.8, 146.8, 110, 110, 164.8, 146.8];
function startArcadeBGM() {
  if (bgmInterval) clearInterval(bgmInterval);
  bgmInterval = setInterval(() => {
    if (!bgmEnabled || paused || matchOver || isPortraitMode()) return;
    const note = bassNotes[beatStep % bassNotes.length];
    playTone(note, 0.15, "triangle", note * 0.98, 0.05);
    if (beatStep % 2 === 0) playTone(85, 0.08, "sine", 42, 0.09);
    else if (beatStep % 4 === 3) playNoiseImpact(0.05, 1800, 0.06);
    beatStep++;
  }, 240);
}

function speakLine(text, pitch = 1.0, rate = 1.05) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find((v) => v.lang.includes("hi") || v.lang.includes("en-IN"));
  if (hindiVoice) utter.voice = hindiVoice;
  utter.pitch = pitch;
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

function triggerBlastFlash() {
  const blastOverlay = document.getElementById("blastOverlay");
  document.body.classList.add("shake-screen");
  setTimeout(() => document.body.classList.remove("shake-screen"), 400);
  if (blastOverlay) {
    blastOverlay.style.display = "block";
    requestAnimationFrame(() => { blastOverlay.style.opacity = "0.85"; });
    setTimeout(() => {
      blastOverlay.style.opacity = "0";
      setTimeout(() => { blastOverlay.style.display = "none"; }, 260);
    }, 280);
  }
}

/* =========================================================================
   3. NETA ROSTER DATA
   ========================================================================= */
const NETA_ROSTER = {
  MODI: {
    id: "MODI", name: "MODI JI", icon: "🪷", party: "Saffron Brigade",
    clothColor: 0xf97316, pantsColor: 0xf8fafc,
    kickName: "ACHE DIN ROUNDHOUSE!", specialName: "MITRON SHOCKWAVE!", superName: "SUDARSHAN CHAKRA!",
    introQuote: "Mitron! Taiyar ho jao!",
    superVoice: "Angena gatram, nayane vaktram, nyayena rajyam, Sudarshan Chakra!",
    winQuote: "Abki baar, 400 paar!", voicePitch: 0.82
  },
  RAHUL: {
    id: "RAHUL", name: "RAHUL G", icon: "✋", party: "Yatra Express",
    clothColor: 0xffffff, pantsColor: 0x334155,
    kickName: "BHARAT JODO SWEEP!", specialName: "MOHABBAT UPPERCUT!", superName: "KHATA-KHAT-HAMEHA!",
    introQuote: "Daro mat! Mohabbat ki dukaan!",
    superVoice: "Khata khat, khata khat, Khata Khat Hameha!",
    winQuote: "Mohabbat ki dukaan khul gayi!", voicePitch: 1.12
  },
  KEJRIWAL: {
    id: "KEJRIWAL", name: "KEJRIWAL", icon: "🧹", party: "Muffler Force",
    clothColor: 0x0284c7, pantsColor: 0x1e293b,
    kickName: "DHARNA DROP-KICK!", specialName: "FREE BIJLI ZAP!", superName: "JHADU CYCLONE!",
    introQuote: "Sab mile huye hain ji!",
    superVoice: "Muffler sambhal ke, Jhadu Cyclone chala do ji!",
    winQuote: "Bijli paani sab free kar diya ji!", voicePitch: 1.05
  },
  DIDI: {
    id: "DIDI", name: "MAMATA DIDI", icon: "⚽", party: "Khela Hobe Club",
    clothColor: 0xf8fafc, pantsColor: 0x2563eb,
    kickName: "HAWAI CHAPPAL KICK!", specialName: "HAMBA-HAMBA ROAR!", superName: "KHELA HOBE BARRAGE!",
    introQuote: "Khela Hobe! Maidan mein aao!",
    superVoice: "Hamba Hamba, Ramba Ramba, Kamba Kamba, Khela Hobe!",
    winQuote: "Khela shesh! Jeet gayi Didi!", voicePitch: 1.25
  }
};

let selectedP1Key = "MODI";
let selectedP2Key = "RAHUL";

/* =========================================================================
   4. THREE.JS SCENE & 360° FREE TOUCH / MOUSE ORBIT CAMERA
   ========================================================================= */
const canvas = document.getElementById("gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const normalSkyColor = new THREE.Color(0x5ca9f2);
const superSkyColor = new THREE.Color(0x090d16);
scene.background = normalSkyColor.clone();
scene.fog = new THREE.Fog(0x5ca9f2, 26, 72);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100);

// Spherical 360° Camera Orbit Variables
let camTheta = 0;       // Horizontal angle around the ring (-Infinity to +Infinity for full 360°)
let camPhi = 0.28;      // Vertical pitch angle (clamped so camera doesn't go underground)
let camRadius = 11.8;   // Zoom distance from ring center
let isDraggingCam = false;
let activeCamPointerId = null;
let prevPointerX = 0;
let prevPointerY = 0;

function isPortraitMode() {
  return window.innerHeight > window.innerWidth;
}

function updateResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

// Free Touch & Mouse Drag on Canvas to Rotate 360° Camera View
canvas.addEventListener("pointerdown", (e) => {
  initAudio();
  if (!userGestureDone) {
    userGestureDone = true;
    detectAndCacheVibration();
  }
  isDraggingCam = true;
  activeCamPointerId = e.pointerId;
  prevPointerX = e.clientX;
  prevPointerY = e.clientY;
});

window.addEventListener("pointermove", (e) => {
  if (!isDraggingCam || e.pointerId !== activeCamPointerId) return;
  const dx = e.clientX - prevPointerX;
  const dy = e.clientY - prevPointerY;
  prevPointerX = e.clientX;
  prevPointerY = e.clientY;

  // Rotate 360 degrees horizontally & tilt vertically
  camTheta -= dx * 0.0085;
  camPhi = Math.max(0.12, Math.min(1.15, camPhi + dy * 0.0065));
});

window.addEventListener("pointerup", (e) => {
  if (e.pointerId === activeCamPointerId) {
    isDraggingCam = false;
    activeCamPointerId = null;
  }
});

// PC Mouse Wheel Zoom In/Out
canvas.addEventListener("wheel", (e) => {
  camRadius = Math.max(7.5, Math.min(17.5, camRadius + e.deltaY * 0.005));
}, { passive: true });

document.getElementById("btn-reset-cam").addEventListener("click", () => {
  camTheta = 0;
  camPhi = 0.28;
  camRadius = 11.8;
});

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
sunLight.position.set(10, 18, 12);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

/* =========================================================================
   5. 360° STADIUM RING, SURROUNDING AUDIENCE & JANTAR MANTAR ARENA
   ========================================================================= */
const arenaGroup = new THREE.Group();
scene.add(arenaGroup);

// Outer Stadium Ground
const outerGround = new THREE.Mesh(
  new THREE.CircleGeometry(36, 48),
  new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 })
);
outerGround.rotation.x = -Math.PI / 2;
outerGround.position.y = -0.25;
outerGround.receiveShadow = true;
arenaGroup.add(outerGround);

// Raised Central Circular Fighting Ring Platform
const ringPlatform = new THREE.Mesh(
  new THREE.CylinderGeometry(6.2, 6.5, 0.25, 48),
  new THREE.MeshStandardMaterial({ color: 0xc84b31, roughness: 0.75 })
);
ringPlatform.position.y = -0.125;
ringPlatform.receiveShadow = true;
arenaGroup.add(ringPlatform);

// Ashoka Chakra Center Mat on the Ring
const chakraFloorGroup = new THREE.Group();
chakraFloorGroup.position.set(0, 0.01, 0);
arenaGroup.add(chakraFloorGroup);

const whiteDisc = new THREE.Mesh(new THREE.CircleGeometry(2.5, 48), new THREE.MeshBasicMaterial({ color: 0xffffff }));
whiteDisc.rotation.x = -Math.PI / 2;
chakraFloorGroup.add(whiteDisc);

const navyRing = new THREE.Mesh(
  new THREE.RingGeometry(2.0, 2.3, 48),
  new THREE.MeshBasicMaterial({ color: 0x1d4ed8, side: THREE.DoubleSide })
);
navyRing.rotation.x = -Math.PI / 2;
navyRing.position.y = 0.005;
chakraFloorGroup.add(navyRing);

for (let i = 0; i < 24; i++) {
  const angle = (i / 24) * Math.PI * 2;
  const spoke = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 2.0), new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }));
  spoke.rotation.x = -Math.PI / 2;
  spoke.rotation.z = angle;
  spoke.position.set(Math.sin(angle) * 1.0, 0.006, Math.cos(angle) * 1.0);
  chakraFloorGroup.add(spoke);
}

// 8 Ring Corner Posts & Tricolour Ring Ropes around the Fighting Platform
const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 });
const numPosts = 8;
const ringRadius = 5.9;
for (let i = 0; i < numPosts; i++) {
  const angle = (i / numPosts) * Math.PI * 2;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.45, 12), postMat);
  post.position.set(Math.cos(angle) * ringRadius, 0.7, Math.sin(angle) * ringRadius);
  arenaGroup.add(post);
}

// Tricolor Circular Ring Ropes (Saffron, White, Green)
const ropeHeights = [
  { y: 1.25, color: 0xff9933 },
  { y: 0.85, color: 0xffffff },
  { y: 0.45, color: 0x138808 }
];
ropeHeights.forEach((r) => {
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(ringRadius, 0.035, 10, 64),
    new THREE.MeshBasicMaterial({ color: r.color })
  );
  rope.rotation.x = Math.PI / 2;
  rope.position.y = r.y;
  arenaGroup.add(rope);
});

// 360° SURROUNDING AUDIENCE STANDS & CHEERING SPECTATORS
const crowdSpectators = [];
const crowdColors = [0xff9933, 0x38bdf8, 0xfacc15, 0xec4899, 0xa855f7, 0x22c55e, 0xef4444];
const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

function build360AudienceSurroundingRing() {
  const tiers = [
    { radius: 8.2, stepY: 0.1, count: 38 },
    { radius: 9.6, stepY: 0.55, count: 46 },
    { radius: 11.0, stepY: 1.05, count: 54 }
  ];

  // Circular Stadium Step Tiers
  tiers.forEach((t) => {
    const tierRing = new THREE.Mesh(
      new THREE.RingGeometry(t.radius - 0.55, t.radius + 0.55, 64),
      new THREE.MeshStandardMaterial({ color: 0x475569, side: THREE.DoubleSide })
    );
    tierRing.rotation.x = -Math.PI / 2;
    tierRing.position.y = t.stepY;
    arenaGroup.add(tierRing);

    for (let i = 0; i < t.count; i++) {
      const angle = (i / t.count) * Math.PI * 2;
      // Leave a small gap at angle = PI/2 (front camera default) only on the innermost row so default view is unobstructed
      if (t.radius < 8.5 && Math.abs(Math.sin(angle) - 1) < 0.18 && Math.abs(Math.cos(angle)) < 0.45) continue;

      const person = new THREE.Group();
      const color = crowdColors[(i + Math.round(t.radius)) % crowdColors.length];
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.21, 0.24, 0.82, 10),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.41;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xf1c27d })
      );
      head.position.y = 1.02;
      person.add(body, head);

      // Every 4th spectator holds a party placard or waving flag
      if (i % 4 === 0) {
        const signColor = i % 8 === 0 ? 0xff9933 : 0x38bdf8;
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.05), trimMat);
        stick.position.set(0.15, 1.15, 0);
        const placard = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.38, 0.04),
          new THREE.MeshStandardMaterial({ color: signColor })
        );
        placard.position.set(0.15, 1.68, 0);
        person.add(stick, placard);
      }

      const px = Math.cos(angle) * t.radius;
      const pz = Math.sin(angle) * t.radius;
      person.position.set(px, t.stepY, pz);
      // Face inward toward the center of the ring (0, stepY, 0)
      person.lookAt(0, t.stepY + 0.5, 0);

      arenaGroup.add(person);
      crowdSpectators.push({
        mesh: person,
        baseY: t.stepY,
        phase: Math.random() * Math.PI * 2
      });
    }
  });
}
build360AudienceSurroundingRing();

// Outer Jantar Mantar Monuments & Flags Surrounding the Stadium
const monumentMat = new THREE.MeshStandardMaterial({ color: 0xd9534f, roughness: 0.7 });
const centerMonument = new THREE.Group();
centerMonument.position.set(0, 0, -14.5);
const archLeft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.2, 1.4), monumentMat);
archLeft.position.set(-1.8, 3.1, 0);
const archRight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.2, 1.4), monumentMat);
archRight.position.set(1.8, 3.1, 0);
const archTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.3, 1.4), monumentMat);
archTop.position.set(0, 5.8, 0);
centerMonument.add(archLeft, archRight, archTop);
arenaGroup.add(centerMonument);

// 8 Indian Tricolour Flags placed in a 360° circle around the outer stadium
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  const fx = Math.cos(angle) * 13.2;
  const fz = Math.sin(angle) * 13.2;
  const flagGroup = new THREE.Group();
  flagGroup.position.set(fx, 0, fz);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 6.8, 10), trimMat);
  pole.position.y = 3.4;
  const saffron = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.04), new THREE.MeshBasicMaterial({ color: 0xff9933 }));
  saffron.position.set(0.65, 6.5, 0);
  const white = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  white.position.set(0.65, 6.22, 0);
  const green = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.04), new THREE.MeshBasicMaterial({ color: 0x138808 }));
  green.position.set(0.65, 5.94, 0);
  flagGroup.add(pole, saffron, white, green);
  arenaGroup.add(flagGroup);
}

// Chaiwala Walking in a 360° Circle Around the Ring Apron
const chaiwala = new THREE.Group();
const cwLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
cwLegs.position.y = 0.4;
const cwShirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.85, 12), new THREE.MeshStandardMaterial({ color: 0x60a5fa }));
cwShirt.position.y = 1.15;
const cwHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xd2996c }));
cwHead.position.y = 1.75;
const cwCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.12, 12), trimMat);
cwCap.position.y = 1.9;
const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.28, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }));
kettle.position.set(0.32, 1.1, 0);
chaiwala.add(cwLegs, cwShirt, cwHead, cwCap, kettle);
scene.add(chaiwala);

let chaiOrbitAngle = 0;
let activeChaiCup = null;

function spawnChaiCupPowerup(x) {
  if (activeChaiCup) scene.remove(activeChaiCup);
  const cupGroup = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.32, 14), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
  cup.position.y = 0.2;
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.36, 20), new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide }));
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.03;
  cupGroup.add(cup, glowRing);
  cupGroup.position.set(x, 0, 0);
  scene.add(cupGroup);
  activeChaiCup = cupGroup;
}

/* =========================================================================
   6. PROCEDURAL 3D FIGHTER BUILDER
   ========================================================================= */
function buildFighterModel(netaKey, startX, facing) {
  const cfg = NETA_ROSTER[netaKey];
  const root = new THREE.Group();
  root.position.set(startX, 0, 0);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6b88a, roughness: 0.6 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const mainClothMat = new THREE.MeshStandardMaterial({ color: cfg.clothColor, roughness: 0.6 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pantsColor, roughness: 0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.31, 1.15, 16), mainClothMat);
  torso.position.y = 1.45;
  torso.castShadow = true;
  bodyPivot.add(torso);

  if (netaKey === "MODI") {
    const kurtaBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.55, 16), whiteMat);
    kurtaBottom.position.y = 0.88;
    bodyPivot.add(kurtaBottom);
  } else if (netaKey === "DIDI") {
    const sareeSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.45, 0.78, 16), whiteMat);
    sareeSkirt.position.y = 0.72;
    const blueBorder = new THREE.Mesh(new THREE.CylinderGeometry(0.455, 0.455, 0.12, 16), new THREE.MeshBasicMaterial({ color: 0x2563eb }));
    blueBorder.position.y = 0.38;
    bodyPivot.add(sareeSkirt, blueBorder);
  } else if (netaKey === "KEJRIWAL") {
    const mufflerRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 12, 24), new THREE.MeshStandardMaterial({ color: 0x7f1d1d }));
    mufflerRing.rotation.x = Math.PI / 2;
    mufflerRing.position.y = 2.02;
    const mufflerTail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.12), new THREE.MeshStandardMaterial({ color: 0x7f1d1d }));
    mufflerTail.position.set(0.26, 1.72, 0.12);
    bodyPivot.add(mufflerRing, mufflerTail);
  }

  const headGroup = new THREE.Group();
  headGroup.position.y = 2.3;
  bodyPivot.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 20, 20), skinMat);
  headGroup.add(head);

  const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(0.25, 0.05, 0.1);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(0.25, 0.05, -0.1);
  headGroup.add(leftEye, rightEye);

  if (netaKey === "MODI") {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.295, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), whiteMat);
    hair.rotation.z = 0.35;
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 14), whiteMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0.14, -0.2, 0);
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), darkMat);
    glasses.position.set(0.26, 0.05, 0);
    headGroup.add(hair, beard, glasses);
  } else if (netaKey === "RAHUL") {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.305, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), darkMat);
    hair.rotation.z = 0.25;
    const stubble = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 14), darkMat);
    stubble.scale.set(0.95, 0.65, 0.92);
    stubble.position.set(0.05, -0.09, 0);
    headGroup.add(hair, stubble);
  } else if (netaKey === "KEJRIWAL") {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.29, 0.16, 16), whiteMat);
    cap.position.y = 0.24;
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), darkMat);
    glasses.position.set(0.26, 0.05, 0);
    headGroup.add(cap, glasses);
  } else if (netaKey === "DIDI") {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), darkMat);
    hair.rotation.z = 0.3;
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), darkMat);
    bun.position.set(-0.28, -0.02, 0);
    headGroup.add(hair, bun);
  }

  function makeArm(zOffset) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 1.9, zOffset);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.35, 12), whiteMat);
    sleeve.position.y = -0.15;
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.55, 12), skinMat);
    forearm.position.y = -0.5;
    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), skinMat);
    fist.position.y = -0.8;
    shoulder.add(sleeve, forearm, fist);
    bodyPivot.add(shoulder);
    return shoulder;
  }

  const leftShoulder = makeArm(0.42);
  const rightShoulder = makeArm(-0.42);

  function makeLeg(zOffset) {
    const hip = new THREE.Group();
    hip.position.set(0, 0.9, zOffset);
    const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.85, 12), pantsMat);
    legMesh.position.y = -0.42;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.18), netaKey === "DIDI" ? whiteMat : darkMat);
    shoe.position.set(0.06, -0.84, 0);
    hip.add(legMesh, shoe);
    bodyPivot.add(hip);
    return hip;
  }

  const leftHip = makeLeg(0.16);
  const rightHip = makeLeg(-0.16);

  const shieldMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28, wireframe: true })
  );
  shieldMesh.position.y = 1.35;
  shieldMesh.visible = false;
  bodyPivot.add(shieldMesh);

  scene.add(root);

  return {
    key: netaKey, cfg, root, bodyPivot, headGroup,
    leftShoulder, rightShoulder, leftHip, rightHip, shieldMesh,
    hp: 100, superEnergy: 100, roundsWon: 0,
    vy: 0, vx: 0, isGrounded: true, facing,
    state: "IDLE", stateTimer: 0, comboCount: 0, lastHitTime: 0
  };
}

let p1 = buildFighterModel("MODI", -2.1, 1);
let p2 = buildFighterModel("RAHUL", 2.1, -1);

/* =========================================================================
   7. CHARACTER SELECTION & PAUSE / MENU BUTTON HANDLERS
   ========================================================================= */
const selectScreen = document.getElementById("select-screen");
const p1RosterEl = document.getElementById("p1-roster");
const p2RosterEl = document.getElementById("p2-roster");
const pauseBtn = document.getElementById("pauseBtn");
const pauseMenu = document.getElementById("pauseMenu");
const resumeBtn = document.getElementById("resumeGame");
const openSelectFromPauseBtn = document.getElementById("openSelectFromPause");
const toggleMusicBtn = document.getElementById("toggleMusicBtn");
const restartGameBtn = document.getElementById("restartGame");
const exitGameBtn = document.getElementById("exitGame");
const overlayMsg = document.getElementById("overlayMsg");
const restartBtn = document.getElementById("restartBtn");
const exitBtn = document.getElementById("exitBtn");
const fsBtn = document.getElementById("fsBtn");

let paused = false;
let currentRound = 1;
let matchTime = 60;
let matchOver = false;
let botEnabled = true;

function renderRosterCards() {
  p1RosterEl.innerHTML = "";
  p2RosterEl.innerHTML = "";
  Object.values(NETA_ROSTER).forEach((neta) => {
    const card1 = document.createElement("div");
    card1.className = `neta-card ${selectedP1Key === neta.id ? "selected-p1" : ""}`;
    card1.innerHTML = `
      <div class="neta-card-title"><span>${neta.icon}</span><span>${neta.name}</span></div>
      <div class="neta-party">${neta.party}</div>
      <div class="neta-super">⚡ ${neta.superName}</div>
    `;
    card1.onclick = () => { selectedP1Key = neta.id; renderRosterCards(); };
    p1RosterEl.appendChild(card1);

    const card2 = document.createElement("div");
    card2.className = `neta-card ${selectedP2Key === neta.id ? "selected-p2" : ""}`;
    card2.innerHTML = `
      <div class="neta-card-title"><span>${neta.icon}</span><span>${neta.name}</span></div>
      <div class="neta-party">${neta.party}</div>
      <div class="neta-super">💥 ${neta.superName}</div>
    `;
    card2.onclick = () => { selectedP2Key = neta.id; renderRosterCards(); };
    p2RosterEl.appendChild(card2);
  });
}
renderRosterCards();

document.getElementById("btn-start-match").addEventListener("click", () => {
  initAudio();
  selectScreen.classList.add("hidden");
  rebuildFightersAndStartMatch();
});

document.getElementById("btn-select-neta").addEventListener("click", () => {
  selectScreen.classList.remove("hidden");
});

function togglePause(show) {
  if (matchOver) return;
  paused = show;
  pauseMenu.style.display = show ? "block" : "none";
  if (show) {
    window.speechSynthesis?.cancel();
  }
}

pauseBtn.addEventListener("click", () => togglePause(!paused));
resumeBtn.addEventListener("click", () => togglePause(false));

openSelectFromPauseBtn.addEventListener("click", () => {
  togglePause(false);
  selectScreen.classList.remove("hidden");
});

toggleMusicBtn.addEventListener("click", () => {
  initAudio();
  bgmEnabled = !bgmEnabled;
  toggleMusicBtn.textContent = `🎵 Music: ${bgmEnabled ? "ON" : "OFF"}`;
});

restartGameBtn.addEventListener("click", () => {
  togglePause(false);
  rebuildFightersAndStartMatch();
});

restartBtn.addEventListener("click", () => {
  rebuildFightersAndStartMatch();
});

function exitGame() {
  window.speechSynthesis?.cancel();
  selectScreen.classList.remove("hidden");
  pauseMenu.style.display = "none";
  overlayMsg.style.display = "none";
  restartBtn.style.display = "none";
  exitBtn.style.display = "none";
}

exitGameBtn.addEventListener("click", exitGame);
exitBtn.addEventListener("click", exitGame);

// Fullscreen Button with Strict Landscape Lock Attempt
if (fsBtn) {
  fsBtn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch(() => {});
        }
        fsBtn.textContent = "⤢";
      } else {
        await document.exitFullscreen();
        fsBtn.textContent = "⛶";
      }
    } catch (e) {}
  });
}

/* =========================================================================
   8. 3D HIT SPARKS, RINGS & ULTIMATE SUPERPOWERS
   ========================================================================= */
const activeEffects = [];
const sparkParticles = [];

function spawnHitRing(x, y, color = 0xfef08a) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.3, 24),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 1 })
  );
  ring.position.set(x, y, 0.5);
  ring.lookAt(camera.position);
  scene.add(ring);
  activeEffects.push({ mesh: ring, age: 0, maxAge: 0.32 });

  for (let i = 0; i < 10; i++) {
    const spark = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshBasicMaterial({ color }));
    spark.position.set(x, y, 0.3);
    scene.add(spark);
    sparkParticles.push({
      mesh: spark,
      vx: (Math.random() - 0.5) * 7,
      vy: 2 + Math.random() * 5,
      vz: (Math.random() - 0.5) * 4,
      age: 0,
      maxAge: 0.35
    });
  }
}

let activeSuper = null;

function triggerSuperpower(attacker, defender) {
  if (matchOver || paused || activeSuper || attacker.state === "KO") return;

  attacker.state = "SUPER";
  attacker.stateTimer = 2.4;
  attacker.superEnergy = 0;
  updateHUD();

  const cfg = attacker.cfg;
  showMoveBanner(cfg.superName, 2000);
  showBubble(attacker === p1 ? bubbleP1 : bubbleP2, cfg.superName, 2200);
  speakLine(cfg.superVoice, cfg.voicePitch, 1.02);
  SFX.superCharge();
  safeVibrate([120, 60, 180]);

  scene.background.copy(superSkyColor);
  const meshGroup = new THREE.Group();

  if (attacker.key === "MODI") {
    const outerGold = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.13, 16, 36), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    outerGold.rotation.x = Math.PI / 2;
    const innerGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.88, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
    );
    innerGlow.rotation.x = Math.PI / 2;
    meshGroup.add(outerGold, innerGlow);
    meshGroup.position.set(attacker.root.position.x, 3.35, 0);
  } else if (attacker.key === "RAHUL") {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 24), new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.45 }));
    meshGroup.add(core, aura);
    for (let i = 0; i < 45; i++) {
      const bug = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.1), new THREE.MeshBasicMaterial({ color: 0x090d16 }));
      const r = 0.6 + Math.random() * 1.1;
      const t = Math.random() * Math.PI * 2;
      bug.position.set(Math.cos(t) * r, (Math.random() - 0.5) * 1.2, Math.sin(t) * r);
      meshGroup.add(bug);
    }
    meshGroup.position.set(attacker.root.position.x + attacker.facing * 0.9, 1.65, 0);
  } else if (attacker.key === "KEJRIWAL") {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.8, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true }));
    cone.rotation.x = Math.PI;
    const broomStick = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 2.4, 14), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    meshGroup.add(cone, broomStick);
    meshGroup.position.set(attacker.root.position.x + attacker.facing * 0.9, 1.5, 0);
  } else if (attacker.key === "DIDI") {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.68, 20, 20), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    const fireAura = new THREE.Mesh(new THREE.SphereGeometry(0.88, 18, 18), new THREE.MeshBasicMaterial({ color: 0xf97316, wireframe: true }));
    meshGroup.add(ball, fireAura);
    meshGroup.position.set(attacker.root.position.x + attacker.facing * 0.9, 1.5, 0);
  }

  scene.add(meshGroup);
  activeSuper = { attacker, defender, mesh: meshGroup, age: 0 };
}

/* =========================================================================
   9. INPUT BINDINGS (KEYBOARD + TOUCH BUTTONS)
   ========================================================================= */
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyP") {
    togglePause(!paused);
    return;
  }
  if (paused) return;
  if (e.code === "KeyJ") performAttack(p1, p2, "PUNCH");
  if (e.code === "KeyK") performAttack(p1, p2, "KICK");
  if (e.code === "KeyU") performAttack(p1, p2, "SPECIAL");
  if (e.code === "Space" || e.code === "KeyL") triggerSuperpower(p1, p2);
});

window.addEventListener("keyup", (e) => { keys[e.code] = false; });

function bindHoldButton(btnId, keyCode) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const press = (e) => {
    e.stopPropagation();
    e.preventDefault();
    keys[keyCode] = true;
    btn.classList.add("pressed");
  };
  const release = (e) => {
    e.stopPropagation();
    e.preventDefault();
    keys[keyCode] = false;
    btn.classList.remove("pressed");
  };
  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointerleave", release);
  btn.addEventListener("pointercancel", release);
}

bindHoldButton("touch-left", "ArrowLeft");
bindHoldButton("touch-right", "ArrowRight");
bindHoldButton("touch-jump", "ArrowUp");
bindHoldButton("touch-block", "KeyS");

function bindTapButton(btnId, callback) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    btn.classList.add("pressed");
    callback();
  });
  const clear = (e) => {
    e.stopPropagation();
    btn.classList.remove("pressed");
  };
  btn.addEventListener("pointerup", clear);
  btn.addEventListener("pointerleave", clear);
  btn.addEventListener("pointercancel", clear);
}

bindTapButton("touch-punch", () => performAttack(p1, p2, "PUNCH"));
bindTapButton("touch-kick", () => performAttack(p1, p2, "KICK"));
bindTapButton("touch-special", () => performAttack(p1, p2, "SPECIAL"));
bindTapButton("touch-super", () => triggerSuperpower(p1, p2));

/* =========================================================================
   10. COMBAT ENGINE & HUD UPDATES
   ========================================================================= */
const p1NameLabel = document.getElementById("p1-name-label");
const p2NameLabel = document.getElementById("p2-name-label");
const p1HpBar = document.getElementById("p1-hp-bar");
const p2HpBar = document.getElementById("p2-hp-bar");
const p1HpLabel = document.getElementById("p1-hp-label");
const p2HpLabel = document.getElementById("p2-hp-label");
const p1SuperBar = document.getElementById("p1-super-bar");
const p2SuperBar = document.getElementById("p2-super-bar");
const p1SuperTag = document.getElementById("p1-super-tag");
const p2SuperTag = document.getElementById("p2-super-tag");
const mainBanner = document.getElementById("main-banner");
const moveBanner = document.getElementById("move-banner");
const timerText = document.getElementById("timer-text");
const roundLabel = document.getElementById("round-label");
const comboToast = document.getElementById("combo-toast");
const bubbleP1 = document.getElementById("bubble-p1");
const bubbleP2 = document.getElementById("bubble-p2");
const bubbleChai = document.getElementById("bubble-chai");

function showMainBanner(text, duration = 1400) {
  mainBanner.textContent = text;
  mainBanner.classList.add("show");
  if (duration > 0) setTimeout(() => mainBanner.classList.remove("show"), duration);
}

function showMoveBanner(text, duration = 1200) {
  moveBanner.textContent = text;
  moveBanner.classList.add("show");
  setTimeout(() => moveBanner.classList.remove("show"), duration);
}

function showBubble(el, text, duration = 1700) {
  el.textContent = text;
  el.style.opacity = "1";
  setTimeout(() => { el.style.opacity = "0"; }, duration);
}

function showCombo(count, name) {
  if (count < 2) return;
  comboToast.textContent = `${count}x ${name} COMBO!`;
  comboToast.classList.add("show");
  setTimeout(() => comboToast.classList.remove("show"), 1100);
}

function updateRoundDots() {
  const p1Dots = document.querySelectorAll("#p1-rounds .dot");
  const p2Dots = document.querySelectorAll("#p2-rounds .dot");
  p1Dots.forEach((d, idx) => d.classList.toggle("won", idx < p1.roundsWon));
  p2Dots.forEach((d, idx) => d.classList.toggle("won", idx < p2.roundsWon));
}

function updateHUD() {
  p1NameLabel.textContent = `${p1.cfg.icon} ${p1.cfg.name} (YOU)`;
  p2NameLabel.textContent = `${p2.cfg.icon} ${p2.cfg.name} (BOT)`;

  p1.hp = Math.max(0, Math.min(100, p1.hp));
  p2.hp = Math.max(0, Math.min(100, p2.hp));
  p1.superEnergy = Math.max(0, Math.min(100, p1.superEnergy));
  p2.superEnergy = Math.max(0, Math.min(100, p2.superEnergy));

  p1HpBar.style.width = p1.hp + "%";
  p2HpBar.style.width = p2.hp + "%";
  p1HpLabel.textContent = Math.round(p1.hp) + "%";
  p2HpLabel.textContent = Math.round(p2.hp) + "%";

  p1SuperBar.style.width = p1.superEnergy + "%";
  p2SuperBar.style.width = p2.superEnergy + "%";

  p1SuperTag.style.display = p1.superEnergy >= 100 ? "inline-block" : "none";
  p2SuperTag.style.display = p2.superEnergy >= 100 ? "inline-block" : "none";
}

function performAttack(attacker, defender, type) {
  if (matchOver || paused || activeSuper || (attacker.state !== "IDLE" && attacker.state !== "WALK")) return;

  attacker.state = type;
  attacker.stateTimer = type === "PUNCH" ? 0.25 : type === "KICK" ? 0.4 : 0.48;
  SFX.whoosh();

  if (type === "KICK") showMoveBanner(attacker.cfg.kickName, 900);
  else if (type === "SPECIAL") showMoveBanner(attacker.cfg.specialName, 1000);

  const dist = Math.abs(attacker.root.position.x - defender.root.position.x);
  const range = type === "PUNCH" ? 1.45 : type === "KICK" ? 1.85 : 2.15;

  setTimeout(() => {
    if (matchOver || paused) return;
    if (dist <= range && Math.abs(attacker.root.position.y - defender.root.position.y) < 1.35) {
      const isBlocked = defender.state === "BLOCK";
      let dmg = type === "PUNCH" ? 6 : type === "KICK" ? 11 : 15;

      if (isBlocked) {
        dmg = Math.ceil(dmg * 0.2);
        SFX.blockClang();
        spawnHitRing(defender.root.position.x, 1.5, 0x38bdf8);
      } else {
        defender.hp -= dmg;
        attacker.superEnergy = Math.min(100, attacker.superEnergy + 22);
        defender.superEnergy = Math.min(100, defender.superEnergy + 14);

        const now = performance.now();
        attacker.comboCount = (now - attacker.lastHitTime < 2200) ? attacker.comboCount + 1 : 1;
        attacker.lastHitTime = now;
        showCombo(attacker.comboCount, attacker.cfg.name);

        defender.state = "HIT";
        defender.stateTimer = 0.32;

        if (type === "KICK" || type === "SPECIAL") {
          SFX.heavyKickHit();
          safeVibrate(80);
          defender.vy = type === "SPECIAL" ? 6.6 : 4.6;
          defender.isGrounded = false;
          defender.vx = attacker.facing * (type === "SPECIAL" ? 4.2 : 3.0);
        } else {
          SFX.punchHit();
          defender.root.position.x = Math.max(-4.6, Math.min(4.6, defender.root.position.x + attacker.facing * 0.35));
        }

        spawnHitRing(
          (attacker.root.position.x + defender.root.position.x) / 2,
          1.6,
          type === "SPECIAL" ? 0xc084fc : type === "KICK" ? 0x86efac : 0xfef08a
        );
      }

      updateHUD();
      checkRoundKO();
    }
  }, 105);
}

function checkRoundKO() {
  if (matchOver) return;
  if (p1.hp <= 0 || p2.hp <= 0) {
    matchOver = true;
    const winner = p1.hp > 0 ? p1 : p2;
    const loser = p1.hp > 0 ? p2 : p1;
    loser.state = "KO";
    winner.roundsWon++;
    updateRoundDots();

    SFX.bellGong();
    triggerBlastFlash();
    safeVibrate([250, 80, 250]);
    showMainBanner("K.O.!", 1400);

    if (winner.roundsWon >= 2) {
      speakLine(`K O! ${winner.cfg.name} wins the Sanshad Showdown!`, 0.95, 1.0);
      setTimeout(() => {
        showBubble(winner === p1 ? bubbleP1 : bubbleP2, winner.cfg.winQuote, 4500);
        overlayMsg.textContent = `🏆 ${winner.cfg.name} WINS THE MATCH!`;
        overlayMsg.style.display = "block";
        restartBtn.style.display = "block";
        exitBtn.style.display = "block";
      }, 1500);
    } else {
      speakLine(`Round ${currentRound} goes to ${winner.cfg.name}!`, 1.0, 1.05);
      setTimeout(() => {
        currentRound++;
        resetRound();
      }, 2500);
    }
  }
}

document.getElementById("btn-p1-super").addEventListener("click", () => triggerSuperpower(p1, p2));
document.getElementById("btn-p2-super").addEventListener("click", () => triggerSuperpower(p2, p1));
document.getElementById("btn-toggle-ai").addEventListener("click", (e) => {
  botEnabled = !botEnabled;
  e.target.textContent = `🤖 Bot: ${botEnabled ? "ON" : "OFF"}`;
});

function rebuildFightersAndStartMatch() {
  scene.remove(p1.root);
  scene.remove(p2.root);
  p1 = buildFighterModel(selectedP1Key, -2.1, 1);
  p2 = buildFighterModel(selectedP2Key, 2.1, -1);
  currentRound = 1;
  p1.roundsWon = 0;
  p2.roundsWon = 0;
  updateRoundDots();
  resetRound();
  startArcadeBGM();
}

function resetRound() {
  overlayMsg.style.display = "none";
  restartBtn.style.display = "none";
  exitBtn.style.display = "none";
  pauseMenu.style.display = "none";
  paused = false;

  p1.hp = 100;
  p2.hp = 100;
  p1.superEnergy = 100;
  p2.superEnergy = 100;
  p1.root.position.set(-2.1, 0, 0);
  p2.root.position.set(2.1, 0, 0);
  p1.vy = 0; p2.vy = 0; p1.vx = 0; p2.vx = 0;
  p1.state = "IDLE"; p2.state = "IDLE";
  p1.bodyPivot.rotation.set(0, 0, 0);
  p2.bodyPivot.rotation.set(0, 0, 0);
  scene.background.copy(normalSkyColor);
  matchTime = 60;
  matchOver = false;
  roundLabel.textContent = `ROUND ${currentRound}`;
  updateHUD();

  SFX.bellGong();
  showMainBanner(`ROUND ${currentRound}`, 1000);
  showBubble(bubbleP1, p1.cfg.introQuote, 2000);
  showBubble(bubbleP2, p2.cfg.introQuote, 2000);

  setTimeout(() => {
    showMainBanner("FIGHT!", 900);
    speakLine(`Round ${currentRound}, Fight!`, 1.0, 1.1);
  }, 1050);
}

setInterval(() => {
  if (!matchOver && !paused && !isPortraitMode() && matchTime > 0 && selectScreen.classList.contains("hidden")) {
    matchTime--;
    timerText.textContent = matchTime;
    if (matchTime === 0) {
      if (p1.hp >= p2.hp) p2.hp = 0;
      else p1.hp = 0;
      checkRoundKO();
    }
  }
}, 1000);

setInterval(() => {
  if (!matchOver && !paused && selectScreen.classList.contains("hidden")) {
    showBubble(bubbleChai, "Garam Chai dropped in the ring!", 2200);
    spawnChaiCupPowerup((Math.random() - 0.5) * 4.5);
  }
}, 9500);

/* =========================================================================
   11. BOT AI & MAIN 360° RENDER LOOP
   ========================================================================= */
let aiCooldown = 0;

function updateBotAI(dt) {
  if (!botEnabled || paused || matchOver || activeSuper || p2.state === "KO" || !selectScreen.classList.contains("hidden")) return;
  aiCooldown -= dt;
  if (aiCooldown > 0) return;

  const dist = Math.abs(p1.root.position.x - p2.root.position.x);
  if (dist > 1.7) {
    p2.root.position.x += Math.sign(p1.root.position.x - p2.root.position.x) * 3.1 * dt;
    p2.state = "WALK";
  } else {
    aiCooldown = 0.5 + Math.random() * 0.45;
    const roll = Math.random();
    if (roll < 0.35) performAttack(p2, p1, "PUNCH");
    else if (roll < 0.65) performAttack(p2, p1, "KICK");
    else if (roll < 0.85) performAttack(p2, p1, "SPECIAL");
    else if (p2.superEnergy >= 100) triggerSuperpower(p2, p1);
  }
}

function animateFighterJoints(f, elapsed, dt) {
  if (f.state !== "KO") {
    const other = f === p1 ? p2 : p1;
    f.facing = other.root.position.x >= f.root.position.x ? 1 : -1;
    f.bodyPivot.rotation.y = f.facing === 1 ? 0 : Math.PI;
    f.bodyPivot.rotation.z = 0;
    f.bodyPivot.position.y = 0;
  }

  if (!f.isGrounded) {
    f.root.position.y += f.vy * dt;
    f.root.position.x = Math.max(-4.6, Math.min(4.6, f.root.position.x + f.vx * dt));
    f.vy -= 18 * dt;
    if (f.root.position.y <= 0) {
      f.root.position.y = 0;
      f.vy = 0;
      f.vx = 0;
      f.isGrounded = true;
    }
  }

  if (activeChaiCup && Math.abs(f.root.position.x - activeChaiCup.position.x) < 0.75 && f.root.position.y < 0.8) {
    SFX.chaiPowerup();
    f.hp = Math.min(100, f.hp + 15);
    f.superEnergy = Math.min(100, f.superEnergy + 35);
    updateHUD();
    showMoveBanner(`${f.cfg.name} DRANK GARAM CHAI! (+15 HP)`, 1100);
    scene.remove(activeChaiCup);
    activeChaiCup = null;
  }

  if (f.stateTimer > 0) {
    f.stateTimer -= dt;
    if (f.stateTimer <= 0 && f.state !== "KO") f.state = "IDLE";
  }

  f.shieldMesh.visible = f.state === "BLOCK";
  f.leftShoulder.rotation.set(0, 0, 0.45);
  f.rightShoulder.rotation.set(0, 0, 0.65);
  f.leftHip.rotation.set(0, 0, 0);
  f.rightHip.rotation.set(0, 0, 0);

  if (f.state === "IDLE") {
    f.bodyPivot.position.y = Math.sin(elapsed * 6) * 0.04;
  } else if (f.state === "BLOCK") {
    f.leftShoulder.rotation.z = 1.25;
    f.rightShoulder.rotation.z = 1.25;
    f.bodyPivot.position.y = -0.15;
  } else if (f.state === "WALK") {
    const walkCycle = Math.sin(elapsed * 14) * 0.55;
    f.leftHip.rotation.z = walkCycle;
    f.rightHip.rotation.z = -walkCycle;
    f.leftShoulder.rotation.z = 0.4 - walkCycle * 0.4;
    f.rightShoulder.rotation.z = 0.4 + walkCycle * 0.4;
  } else if (f.state === "PUNCH") {
    f.rightShoulder.rotation.z = Math.PI / 2;
  } else if (f.state === "KICK") {
    f.rightHip.rotation.z = Math.PI / 2.05;
    f.bodyPivot.rotation.z = -0.24;
  } else if (f.state === "SPECIAL") {
    f.leftShoulder.rotation.z = Math.PI * 0.75;
    f.rightShoulder.rotation.z = Math.PI * 0.75;
    f.rightHip.rotation.z = Math.PI / 2.2;
  } else if (f.state === "HIT") {
    f.bodyPivot.rotation.z = -0.42;
  } else if (f.state === "SUPER") {
    if (f.key === "MODI") f.rightShoulder.rotation.z = Math.PI * 0.95;
    else {
      f.leftShoulder.rotation.z = Math.PI / 2;
      f.rightShoulder.rotation.z = Math.PI / 2;
    }
  } else if (f.state === "KO") {
    f.bodyPivot.rotation.z = Math.PI / 2;
    f.bodyPivot.position.y = -0.7;
  }
}

function updateBubblePosition(el, worldPos) {
  const vec = worldPos.clone();
  vec.project(camera);
  if (vec.z > 1) {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vec.y * 0.5) + 0.5) * window.innerHeight;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if (!paused && !isPortraitMode()) {
    if (!matchOver && !activeSuper && p1.state !== "KO" && selectScreen.classList.contains("hidden")) {
      if (keys["KeyS"] || keys["ArrowDown"]) {
        p1.state = "BLOCK";
      } else {
        let moved = false;
        if (keys["KeyA"] || keys["ArrowLeft"]) {
          p1.root.position.x = Math.max(-4.6, p1.root.position.x - 4.2 * dt);
          moved = true;
        }
        if (keys["KeyD"] || keys["ArrowRight"]) {
          p1.root.position.x = Math.min(4.6, p1.root.position.x + 4.2 * dt);
          moved = true;
        }
        if ((keys["KeyW"] || keys["ArrowUp"]) && p1.isGrounded) {
          p1.vy = 7.8;
          p1.isGrounded = false;
          SFX.whoosh();
        }
        if (p1.state === "IDLE" || p1.state === "WALK" || p1.state === "BLOCK") {
          p1.state = moved ? "WALK" : "IDLE";
        }
      }
    }

    updateBotAI(dt);
    animateFighterJoints(p1, elapsed, dt);
    animateFighterJoints(p2, elapsed, dt);

    // 360° Cheering Crowd Bounce
    crowdSpectators.forEach((c) => {
      c.mesh.position.y = c.baseY + Math.abs(Math.sin(elapsed * 5.2 + c.phase)) * 0.18;
    });

    // Chaiwala Orbits 360° Around the Outside of the Ring
    chaiOrbitAngle += 0.25 * dt;
    const cwRadius = 6.9;
    chaiwala.position.set(Math.cos(chaiOrbitAngle) * cwRadius, 0, Math.sin(chaiOrbitAngle) * cwRadius);
    chaiwala.rotation.y = -chaiOrbitAngle;

    if (activeChaiCup) activeChaiCup.rotation.y += 3 * dt;

    // Update Active Superpower
    if (activeSuper) {
      activeSuper.age += dt;
      activeSuper.mesh.rotation.y += 16 * dt;

      if (activeSuper.age < 1.3) {
        const s = 0.6 + activeSuper.age * 0.7;
        activeSuper.mesh.scale.set(s, s, s);
      } else {
        const def = activeSuper.defender;
        const targetPos = new THREE.Vector3(def.root.position.x, 1.5, 0);
        activeSuper.mesh.position.lerp(targetPos, 0.25);

        if (activeSuper.mesh.position.distanceTo(targetPos) < 0.75) {
          SFX.superBoom();
          triggerBlastFlash();
          safeVibrate([300, 80, 300]);
          spawnHitRing(def.root.position.x, 1.5, 0xfacc15);

          const isBlocked = def.state === "BLOCK";
          def.hp -= isBlocked ? 15 : 42;
          def.state = "HIT";
          def.stateTimer = 0.6;
          def.vy = 7.5;
          def.vx = activeSuper.attacker.facing * 4.8;
          def.isGrounded = false;

          scene.background.copy(normalSkyColor);
          scene.remove(activeSuper.mesh);
          activeSuper = null;
          updateHUD();
          checkRoundKO();
        }
      }
    }
  }

  // Compute 360° Spherical Camera Position Around Ring Midpoint
  const midX = (p1.root.position.x + p2.root.position.x) * 0.35;
  const camX = midX + camRadius * Math.sin(camTheta) * Math.cos(camPhi);
  const camY = Math.max(1.2, camRadius * Math.sin(camPhi));
  const camZ = camRadius * Math.cos(camTheta) * Math.cos(camPhi);

  camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.18);
  camera.lookAt(midX, 1.4, 0);

  // Update Hit Rings & Sparks
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    const fx = activeEffects[i];
    fx.age += dt;
    const p = fx.age / fx.maxAge;
    fx.mesh.scale.setScalar(1 + p * 3.2);
    fx.mesh.material.opacity = 1 - p;
    if (fx.age >= fx.maxAge) {
      scene.remove(fx.mesh);
      activeEffects.splice(i, 1);
    }
  }

  for (let i = sparkParticles.length - 1; i >= 0; i--) {
    const sp = sparkParticles[i];
    sp.age += dt;
    sp.mesh.position.x += sp.vx * dt;
    sp.mesh.position.y += sp.vy * dt;
    sp.mesh.position.z += sp.vz * dt;
    sp.vy -= 14 * dt;
    if (sp.age >= sp.maxAge) {
      scene.remove(sp.mesh);
      sparkParticles.splice(i, 1);
    }
  }

  updateBubblePosition(bubbleP1, new THREE.Vector3(p1.root.position.x, 2.85, 0));
  updateBubblePosition(bubbleP2, new THREE.Vector3(p2.root.position.x, 2.85, 0));
  updateBubblePosition(bubbleChai, new THREE.Vector3(chaiwala.position.x, 2.35, chaiwala.position.z));

  renderer.render(scene, camera);
}

window.addEventListener("resize", updateResize);
window.addEventListener("orientationchange", () => setTimeout(updateResize, 150));

resetRound();
startArcadeBGM();
animate();
