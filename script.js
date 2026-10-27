// =========================================================================
// 1. CUSTOM MP3 HOOKS + MULTI-LAYERED WEB AUDIO & DESI ARCADE BGM ENGINE
// =========================================================================
// Tip: If you download real meme MP3s later, put their filenames here!
const CUSTOM_MP3_CLIPS = {
  MODI_SUPER: null,     // e.g. 'sudarshan_meme.mp3'
  RAHUL_SUPER: null,    // e.g. 'khatakhat.mp3'
  KEJRIWAL_SUPER: null, // e.g. 'mufflerman.mp3'
  DIDI_SUPER: null      // e.g. 'khelahobe.mp3'
};

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let bgmEnabled = true;
let bgmInterval = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

// Synthesizes punch/kick impact noise bursts (white noise + filter)
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
    filter.type = 'lowpass';
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

function playTone(freq = 220, duration = 0.14, type = 'sawtooth', slideTo = null, vol = 0.16) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const SFX = {
  whoosh: () => {
    playTone(320, 0.09, 'sine', 110, 0.12);
    playNoiseImpact(0.07, 1400, 0.12);
  },
  punchHit: () => {
    playTone(150, 0.12, 'triangle', 55, 0.25);
    playNoiseImpact(0.12, 850, 0.3);
  },
  heavyKickHit: () => {
    playTone(110, 0.22, 'sawtooth', 38, 0.3);
    playNoiseImpact(0.2, 650, 0.4);
  },
  blockClang: () => {
    playTone(620, 0.08, 'square', 880, 0.14);
  },
  superCharge: () => {
    playTone(180, 0.75, 'sawtooth', 760, 0.22);
    setTimeout(() => playTone(260, 0.5, 'triangle', 920, 0.2), 180);
  },
  superBoom: () => {
    playTone(95, 0.45, 'sawtooth', 28, 0.38);
    playNoiseImpact(0.45, 500, 0.55);
  },
  bellGong: () => {
    playTone(440, 0.65, 'sine', 435, 0.22);
    playTone(880, 0.4, 'triangle', 870, 0.12);
  },
  chaiPowerup: () => {
    playTone(440, 0.1, 'sine', 660, 0.18);
    setTimeout(() => playTone(660, 0.18, 'sine', 880, 0.2), 90);
  }
};

// Procedural Desi-Arcade Dhol & Bass Beat Loop
let beatStep = 0;
const bassNotes = [110, 110, 130.8, 146.8, 110, 110, 164.8, 146.8];
function startArcadeBGM() {
  if (bgmInterval) clearInterval(bgmInterval);
  bgmInterval = setInterval(() => {
    if (!bgmEnabled || matchOver || !document.getElementById('select-screen').classList.contains('hidden')) return;
    const note = bassNotes[beatStep % bassNotes.length];
    // Synth Bass
    playTone(note, 0.16, 'triangle', note * 0.98, 0.06);
    // Dhol Kick on even steps, Tassa Snare on odd steps
    if (beatStep % 2 === 0) {
      playTone(85, 0.09, 'sine', 42, 0.1);
    } else if (beatStep % 4 === 3) {
      playNoiseImpact(0.06, 1800, 0.07);
    }
    beatStep++;
  }, 240);
}

// Hindi / Hinglish Voice Announcer
function speakLine(text, pitch = 1.0, rate = 1.05, customMp3Key = null) {
  if (customMp3Key && CUSTOM_MP3_CLIPS[customMp3Key]) {
    const audio = new Audio(CUSTOM_MP3_CLIPS[customMp3Key]);
    audio.play().catch(() => {});
    return;
  }
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('en-IN'));
  if (hindiVoice) utter.voice = hindiVoice;
  utter.pitch = pitch;
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

// =========================================================================
// 2. NETA ROSTER DATA (4 Playable Satirical Politicians)
// =========================================================================
const NETA_ROSTER = {
  MODI: {
    id: 'MODI',
    name: 'MODI JI',
    icon: '🪷',
    party: 'Saffron Brigade',
    clothColor: 0xf97316,
    pantsColor: 0xf8fafc,
    kickName: 'ACHE DIN ROUNDHOUSE!',
    specialName: 'MITRON SHOCKWAVE!',
    superName: 'SUDARSHAN CHAKRA!',
    superMp3: 'MODI_SUPER',
    introQuote: 'Mitron! Taiyar ho jao!',
    superVoice: 'Angena gatram, nayane vaktram, nyayena rajyam, Sudarshan Chakra!',
    winQuote: 'Abki baar, 400 paar!',
    voicePitch: 0.82
  },
  RAHUL: {
    id: 'RAHUL',
    name: 'RAHUL G',
    icon: '✋',
    party: 'Yatra Express',
    clothColor: 0xffffff,
    pantsColor: 0x334155,
    kickName: 'BHARAT JODO SWEEP!',
    specialName: 'MOHABBAT UPPERCUT!',
    superName: 'KHATA-KHAT-HAMEHA!',
    superMp3: 'RAHUL_SUPER',
    introQuote: 'Daro mat! Mohabbat ki dukaan!',
    superVoice: 'Khata khat, khata khat, Khata Khat Hameha!',
    winQuote: 'Mohabbat ki dukaan khul gayi!',
    voicePitch: 1.12
  },
  KEJRIWAL: {
    id: 'KEJRIWAL',
    name: 'KEJRIWAL',
    icon: '🧹',
    party: 'Muffler Force',
    clothColor: 0x0284c7,
    pantsColor: 0x1e293b,
    kickName: 'DHARNA DROP-KICK!',
    specialName: 'FREE BIJLI ZAP!',
    superName: 'JHADU CYCLONE!',
    superMp3: 'KEJRIWAL_SUPER',
    introQuote: 'Sab mile huye hain ji!',
    superVoice: 'Muffler sambhal ke, Jhadu Cyclone chala do ji!',
    winQuote: 'Bijli paani sab free kar diya ji!',
    voicePitch: 1.05
  },
  DIDI: {
    id: 'DIDI',
    name: 'MAMATA DIDI',
    icon: '⚽',
    party: 'Khela Hobe Club',
    clothColor: 0xf8fafc,
    pantsColor: 0x2563eb,
    kickName: 'HAWAI CHAPPAL KICK!',
    specialName: 'HAMBA-HAMBA ROAR!',
    superName: 'KHELA HOBE BARRAGE!',
    superMp3: 'DIDI_SUPER',
    introQuote: 'Khela Hobe! Maidan mein aao!',
    superVoice: 'Hamba Hamba, Ramba Ramba, Kamba Kamba, Khela Hobe!',
    winQuote: 'Khela shesh! Jeet gayi Didi!',
    voicePitch: 1.25
  }
};

let selectedP1Key = 'MODI';
let selectedP2Key = 'RAHUL';

// =========================================================================
// 3. THREE.JS SCENE & RESPONSIVE CAMERA (Mobile Portrait/Landscape + PC)
// =========================================================================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const normalSkyColor = new THREE.Color(0x68b5f5);
const superSkyColor = new THREE.Color(0x0f172a);
scene.background = normalSkyColor.clone();
scene.fog = new THREE.Fog(0x68b5f5, 22, 65);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const defaultCamPos = new THREE.Vector3(0, 3.3, 11.5);
let screenShakeTime = 0;
let screenShakeIntensity = 0;

function triggerScreenShake(duration = 0.2, intensity = 0.22) {
  screenShakeTime = duration;
  screenShakeIntensity = intensity;
}

function updateResponsiveCamera() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  if (aspect < 0.65) {
    defaultCamPos.set(0, 4.1, Math.min(22, 9.8 / aspect));
  } else if (aspect < 1.1) {
    defaultCamPos.set(0, 3.6, 14.5);
  } else if (h < 500) {
    defaultCamPos.set(0, 3.1, 12.2);
  } else {
    defaultCamPos.set(0, 3.3, 11.5);
  }
}

updateResponsiveCamera();
camera.position.copy(defaultCamPos);
camera.lookAt(0, 1.6, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.25);
sunLight.position.set(8, 16, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

// =========================================================================
// 4. JANTAR MANTAR ARENA, CROWD & INTERACTIVE CHAIWALA
// =========================================================================
const arenaGroup = new THREE.Group();
scene.add(arenaGroup);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 26),
  new THREE.MeshStandardMaterial({ color: 0xc84b31, roughness: 0.8 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
arenaGroup.add(floor);

const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
[-3.5, 0, 3.5].forEach((z) => {
  const line = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.12), lineMat);
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.01, z);
  arenaGroup.add(line);
});

const chakraFloorGroup = new THREE.Group();
chakraFloorGroup.position.set(0, 0.02, 0);
arenaGroup.add(chakraFloorGroup);

const whiteDisc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48), new THREE.MeshBasicMaterial({ color: 0xffffff }));
whiteDisc.rotation.x = -Math.PI / 2;
chakraFloorGroup.add(whiteDisc);

const navyRing = new THREE.Mesh(
  new THREE.RingGeometry(1.85, 2.15, 48),
  new THREE.MeshBasicMaterial({ color: 0x1d4ed8, side: THREE.DoubleSide })
);
navyRing.rotation.x = -Math.PI / 2;
navyRing.position.y = 0.005;
chakraFloorGroup.add(navyRing);

const navyHub = new THREE.Mesh(new THREE.CircleGeometry(0.35, 32), new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }));
navyHub.rotation.x = -Math.PI / 2;
navyHub.position.y = 0.005;
chakraFloorGroup.add(navyHub);

for (let i = 0; i < 24; i++) {
  const angle = (i / 24) * Math.PI * 2;
  const spoke = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.85), new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }));
  spoke.rotation.x = -Math.PI / 2;
  spoke.rotation.z = angle;
  spoke.position.set(Math.sin(angle) * 0.9, 0.006, Math.cos(angle) * 0.9);
  chakraFloorGroup.add(spoke);
}

const lawn = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 10),
  new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 })
);
lawn.rotation.x = -Math.PI / 2;
lawn.position.set(0, 0.01, -8.5);
arenaGroup.add(lawn);

const monumentMat = new THREE.MeshStandardMaterial({ color: 0xd9534f, roughness: 0.7 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

const centerMonument = new THREE.Group();
centerMonument.position.set(0, 0, -9.5);
const archLeft = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.2), monumentMat);
archLeft.position.set(-1.6, 2.75, 0);
const archRight = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.2), monumentMat);
archRight.position.set(1.6, 2.75, 0);
const archTop = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.2, 1.2), monumentMat);
archTop.position.set(0, 5.2, 0);
const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, 1.3), trimMat);
signBoard.position.set(0, 2.6, 0);
centerMonument.add(archLeft, archRight, archTop, signBoard);
arenaGroup.add(centerMonument);

[-7.5, 7.5].forEach((xPos) => {
  const yantra = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.6, 32), monumentMat);
  yantra.position.set(xPos, 0.8, -8.5);
  const yantraRim = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.25, 32), trimMat);
  yantraRim.position.set(xPos, 1.55, -8.5);
  arenaGroup.add(yantra, yantraRim);
});

function createFlag(x, z) {
  const flagGroup = new THREE.Group();
  flagGroup.position.set(x, 0, z);
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 6.5, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6 })
  );
  pole.position.y = 3.25;
  flagGroup.add(pole);

  const stripeH = 0.28;
  const saffron = new THREE.Mesh(new THREE.BoxGeometry(1.3, stripeH, 0.04), new THREE.MeshBasicMaterial({ color: 0xff9933 }));
  saffron.position.set(0.65, 6.2, 0);
  const white = new THREE.Mesh(new THREE.BoxGeometry(1.3, stripeH, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  white.position.set(0.65, 5.92, 0);
  const green = new THREE.Mesh(new THREE.BoxGeometry(1.3, stripeH, 0.04), new THREE.MeshBasicMaterial({ color: 0x138808 }));
  green.position.set(0.65, 5.64, 0);
  flagGroup.add(saffron, white, green);
  arenaGroup.add(flagGroup);
}
createFlag(-3.2, -7.2);
createFlag(3.2, -7.2);

// Animated Crowd
const crowdSpectators = [];
const crowdColors = [0xff9933, 0x38bdf8, 0xfacc15, 0xec4899, 0xa855f7, 0x22c55e];

function createCrowdSection(startX, direction) {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const person = new THREE.Group();
      const color = crowdColors[(row * 5 + col) % crowdColors.length];
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.85, 12), new THREE.MeshStandardMaterial({ color }));
      body.position.y = 0.42;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf1c27d }));
      head.position.y = 1.05;
      person.add(body, head);

      if ((row + col) % 2 === 0) {
        const signColor = direction < 0 ? 0xff9933 : 0x38bdf8;
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1), trimMat);
        stick.position.set(0.15, 1.2, 0);
        const placard = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.04), new THREE.MeshStandardMaterial({ color: signColor }));
        placard.position.set(0.15, 1.75, 0);
        person.add(stick, placard);
      }

      person.position.set(startX + direction * (row * 0.75), row * 0.25, -2.5 + col * 1.1);
      person.rotation.y = direction < 0 ? Math.PI / 3 : -Math.PI / 3;
      arenaGroup.add(person);
      crowdSpectators.push({ mesh: person, baseY: person.position.y, phase: Math.random() * Math.PI * 2 });
    }
  }
}
createCrowdSection(-6.8, -1);
createCrowdSection(6.8, 1);

// Walking Chaiwala NPC + Dropped Garam Chai Powerup Cups
const chaiwala = new THREE.Group();
chaiwala.position.set(-3.5, 0, -3.8);
const cwLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
cwLegs.position.y = 0.4;
const cwShirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.85, 12), new THREE.MeshStandardMaterial({ color: 0x60a5fa }));
cwShirt.position.y = 1.15;
const cwHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), new THREE.MeshStandardMaterial({ color: 0xd2996c }));
cwHead.position.y = 1.75;
const cwCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.12, 12), trimMat);
cwCap.position.y = 1.9;
const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.28, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }));
kettle.position.set(0.32, 1.1, 0);
chaiwala.add(cwLegs, cwShirt, cwHead, cwCap, kettle);
scene.add(chaiwala);
let chaiDir = 1;
let activeChaiCup = null;

function spawnChaiCupPowerup(x) {
  if (activeChaiCup) scene.remove(activeChaiCup);
  const cupGroup = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.13, 0.32, 14),
    new THREE.MeshStandardMaterial({ color: 0xd97706 })
  );
  cup.position.y = 0.2;
  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(0.25, 0.36, 20),
    new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.03;
  cupGroup.add(cup, glowRing);
  cupGroup.position.set(x, 0, 0);
  scene.add(cupGroup);
  activeChaiCup = cupGroup;
}

// =========================================================================
// 5. PROCEDURAL 3D FIGHTER BUILDER (Supports Modi, Rahul, Kejriwal & Didi)
// =========================================================================
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

  // Character-specific attire
  if (netaKey === 'MODI') {
    const kurtaBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.55, 16), whiteMat);
    kurtaBottom.position.y = 0.88;
    bodyPivot.add(kurtaBottom);
  } else if (netaKey === 'DIDI') {
    // White cotton saree with blue border
    const sareeSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.45, 0.78, 16), whiteMat);
    sareeSkirt.position.y = 0.72;
    const blueBorder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.455, 0.455, 0.12, 16),
      new THREE.MeshBasicMaterial({ color: 0x2563eb })
    );
    blueBorder.position.y = 0.38;
    bodyPivot.add(sareeSkirt, blueBorder);
  } else if (netaKey === 'KEJRIWAL') {
    // Iconic Maroon Muffler around neck and chest
    const mufflerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.08, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d })
    );
    mufflerRing.rotation.x = Math.PI / 2;
    mufflerRing.position.y = 2.02;
    const mufflerTail = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.55, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d })
    );
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

  if (netaKey === 'MODI') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.295, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), whiteMat);
    hair.rotation.z = 0.35;
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 14), whiteMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0.14, -0.2, 0);
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    glasses.position.set(0.26, 0.05, 0);
    headGroup.add(hair, beard, glasses);
  } else if (netaKey === 'RAHUL') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.305, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), darkMat);
    hair.rotation.z = 0.25;
    const stubble = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 14), darkMat);
    stubble.scale.set(0.95, 0.65, 0.92);
    stubble.position.set(0.05, -0.09, 0);
    headGroup.add(hair, stubble);
  } else if (netaKey === 'KEJRIWAL') {
    // White Topi Cap + Glasses + Mustache
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.29, 0.16, 16), whiteMat);
    cap.position.y = 0.24;
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), darkMat);
    glasses.position.set(0.26, 0.05, 0);
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.18), darkMat);
    mustache.position.set(0.27, -0.08, 0);
    headGroup.add(cap, glasses, mustache);
  } else if (netaKey === 'DIDI') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), darkMat);
    hair.rotation.z = 0.3;
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), darkMat);
    bun.position.set(-0.28, -0.02, 0);
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.3), darkMat);
    glasses.position.set(0.26, 0.05, 0);
    headGroup.add(hair, bun, glasses);
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
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.18), netaKey === 'DIDI' ? whiteMat : darkMat);
    shoe.position.set(0.06, -0.84, 0);
    hip.add(legMesh, shoe);
    bodyPivot.add(hip);
    return hip;
  }

  const leftHip = makeLeg(0.16);
  const rightHip = makeLeg(-0.16);

  // 3D Guard Shield Sphere (Visible when Blocking)
  const shieldMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28, wireframe: true })
  );
  shieldMesh.position.y = 1.35;
  shieldMesh.visible = false;
  bodyPivot.add(shieldMesh);

  scene.add(root);

  return {
    key: netaKey,
    cfg,
    root,
    bodyPivot,
    headGroup,
    leftShoulder,
    rightShoulder,
    leftHip,
    rightHip,
    shieldMesh,
    hp: 100,
    superEnergy: 100,
    roundsWon: 0,
    vy: 0,
    vx: 0,
    isGrounded: true,
    facing,
    state: 'IDLE',
    stateTimer: 0,
    comboCount: 0,
    lastHitTime: 0
  };
}

let p1 = buildFighterModel('MODI', -2.2, 1);
let p2 = buildFighterModel('RAHUL', 2.2, -1);

// =========================================================================
// 6. CHARACTER SELECTION UI BUILDER
// =========================================================================
const selectScreen = document.getElementById('select-screen');
const p1RosterEl = document.getElementById('p1-roster');
const p2RosterEl = document.getElementById('p2-roster');

function renderRosterCards() {
  p1RosterEl.innerHTML = '';
  p2RosterEl.innerHTML = '';

  Object.values(NETA_ROSTER).forEach((neta) => {
    // Player 1 Card
    const card1 = document.createElement('div');
    card1.className = `neta-card ${selectedP1Key === neta.id ? 'selected-p1' : ''}`;
    card1.innerHTML = `
      <div class="neta-card-title"><span>${neta.icon}</span><span>${neta.name}</span></div>
      <div class="neta-party">${neta.party}</div>
      <div class="neta-super">⚡ ${neta.superName}</div>
    `;
    card1.addEventListener('click', () => {
      selectedP1Key = neta.id;
      playTone(420, 0.08, 'sine', 560, 0.15);
      renderRosterCards();
    });
    p1RosterEl.appendChild(card1);

    // Player 2 Card
    const card2 = document.createElement('div');
    card2.className = `neta-card ${selectedP2Key === neta.id ? 'selected-p2' : ''}`;
    card2.innerHTML = `
      <div class="neta-card-title"><span>${neta.icon}</span><span>${neta.name}</span></div>
      <div class="neta-party">${neta.party}</div>
      <div class="neta-super">💥 ${neta.superName}</div>
    `;
    card2.addEventListener('click', () => {
      selectedP2Key = neta.id;
      playTone(340, 0.08, 'sine', 480, 0.15);
      renderRosterCards();
    });
    p2RosterEl.appendChild(card2);
  });
}
renderRosterCards();

document.getElementById('btn-start-match').addEventListener('click', () => {
  initAudio();
  selectScreen.classList.add('hidden');
  rebuildFightersAndStartMatch();
});

document.getElementById('btn-select-neta').addEventListener('click', () => {
  selectScreen.classList.remove('hidden');
});

function rebuildFightersAndStartMatch() {
  scene.remove(p1.root);
  scene.remove(p2.root);
  p1 = buildFighterModel(selectedP1Key, -2.2, 1);
  p2 = buildFighterModel(selectedP2Key, 2.2, -1);
  currentRound = 1;
  p1.roundsWon = 0;
  p2.roundsWon = 0;
  updateRoundDots();
  resetRound();
  startArcadeBGM();
}

// =========================================================================
// 7. 3D HIT SPARKS, RINGS & ALL 4 ULTIMATE SUPERPOWERS
// =========================================================================
const activeEffects = [];
const sparkParticles = [];

function spawnHitRing(x, y, color = 0xfef08a) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.3, 24),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 1 })
  );
  ring.position.set(x, y, 0.5);
  scene.add(ring);
  activeEffects.push({ mesh: ring, age: 0, maxAge: 0.32 });

  // Burst of 3D Hit Sparks
  for (let i = 0; i < 12; i++) {
    const spark = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.09, 0.09),
      new THREE.MeshBasicMaterial({ color })
    );
    spark.position.set(x, y, 0.4);
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
  if (matchOver || activeSuper || attacker.state === 'KO') return;

  attacker.state = 'SUPER';
  attacker.stateTimer = 2.5;
  attacker.superEnergy = 0;
  updateHUD();

  const cfg = attacker.cfg;
  showMoveBanner(cfg.superName, 2000);
  showBubble(attacker === p1 ? bubbleP1 : bubbleP2, cfg.superName, 2200);
  speakLine(cfg.superVoice, cfg.voicePitch, 1.02, cfg.superMp3);
  SFX.superCharge();

  // Darken sky for dramatic anime/arcade finisher!
  scene.background.copy(superSkyColor);

  const meshGroup = new THREE.Group();

  if (attacker.key === 'MODI') {
    // Spinning Golden Sudarshan Chakra above raised right hand
    const outerGold = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.13, 16, 36),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    outerGold.rotation.x = Math.PI / 2;
    const innerGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.88, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
    );
    innerGlow.rotation.x = Math.PI / 2;
    meshGroup.add(outerGold, innerGlow);
    meshGroup.position.set(attacker.root.position.x, 3.35, 0);
  } else if (attacker.key === 'RAHUL') {
    // Khata-Khat-Hameha Blue Energy Orb + Swirling Bug Swarm
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.45 })
    );
    meshGroup.add(core, aura);
    for (let i = 0; i < 55; i++) {
      const bug = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.1), new THREE.MeshBasicMaterial({ color: 0x090d16 }));
      const r = 0.6 + Math.random() * 1.1;
      const t = Math.random() * Math.PI * 2;
      bug.position.set(Math.cos(t) * r, (Math.random() - 0.5) * 1.2, Math.sin(t) * r);
      meshGroup.add(bug);
    }
    meshGroup.position.set(attacker.root.position.x + attacker.facing * 0.9, 1.65, 0);
  } else if (attacker.key === 'KEJRIWAL') {
    // Giant Jhadu (Broom) Tornado Cyclone
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 2.8, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
    );
    cone.rotation.x = Math.PI;
    const broomStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.28, 2.4, 14),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    meshGroup.add(cone, broomStick);
    meshGroup.position.set(attacker.root.position.x + attacker.facing * 0.9, 1.5, 0);
  } else if (attacker.key === 'DIDI') {
    // Flaming Khela Hobe Giant Football
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: false })
    );
    const fireAura = new THREE.Mesh(
      new THREE.SphereGeometry(0.88, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xf97316, wireframe: true })
    );
    meshGroup.add(ball, fireAura);
    meshGroup.position.set(attacker.root.position.x + attacker.facing * 0.9, 1.5, 0);
  }

  scene.add(meshGroup);
  activeSuper = {
    attacker,
    defender,
    mesh: meshGroup,
    age: 0
  };
}

// =========================================================================
// 8. INPUT HANDLING (PC KEYBOARD + MOBILE TOUCH CONTROLS)
// =========================================================================
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyJ') performAttack(p1, p2, 'PUNCH');
  if (e.code === 'KeyK') performAttack(p1, p2, 'KICK');
  if (e.code === 'KeyU') performAttack(p1, p2, 'SPECIAL');
  if (e.code === 'Space' || e.code === 'KeyL') triggerSuperpower(p1, p2);
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function bindHoldButton(btnId, keyCode) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const press = (e) => {
    e.preventDefault();
    keys[keyCode] = true;
    btn.classList.add('pressed');
  };
  const release = (e) => {
    e.preventDefault();
    keys[keyCode] = false;
    btn.classList.remove('pressed');
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
}

bindHoldButton('touch-left', 'ArrowLeft');
bindHoldButton('touch-right', 'ArrowRight');
bindHoldButton('touch-jump', 'ArrowUp');
bindHoldButton('touch-block', 'KeyS');

function bindTapButton(btnId, callback) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    btn.classList.add('pressed');
    callback();
  });
  const clear = () => btn.classList.remove('pressed');
  btn.addEventListener('pointerup', clear);
  btn.addEventListener('pointerleave', clear);
  btn.addEventListener('pointercancel', clear);
}

bindTapButton('touch-punch', () => performAttack(p1, p2, 'PUNCH'));
bindTapButton('touch-kick', () => performAttack(p1, p2, 'KICK'));
bindTapButton('touch-special', () => performAttack(p1, p2, 'SPECIAL'));
bindTapButton('touch-super', () => triggerSuperpower(p1, p2));

// =========================================================================
// 9. COMBAT LOGIC, RAGDOLL LAUNCH, COMBOS & BEST-OF-3 ROUNDS
// =========================================================================
const p1NameLabel = document.getElementById('p1-name-label');
const p2NameLabel = document.getElementById('p2-name-label');
const p1HpBar = document.getElementById('p1-hp-bar');
const p2HpBar = document.getElementById('p2-hp-bar');
const p1HpLabel = document.getElementById('p1-hp-label');
const p2HpLabel = document.getElementById('p2-hp-label');
const p1SuperBar = document.getElementById('p1-super-bar');
const p2SuperBar = document.getElementById('p2-super-bar');
const p1SuperTag = document.getElementById('p1-super-tag');
const p2SuperTag = document.getElementById('p2-super-tag');
const mainBanner = document.getElementById('main-banner');
const moveBanner = document.getElementById('move-banner');
const timerText = document.getElementById('timer-text');
const roundLabel = document.getElementById('round-label');
const comboToast = document.getElementById('combo-toast');
const bubbleP1 = document.getElementById('bubble-p1');
const bubbleP2 = document.getElementById('bubble-p2');
const bubbleChai = document.getElementById('bubble-chai');

let currentRound = 1;
let matchTime = 60;
let matchOver = false;
let botEnabled = true;

function showMainBanner(text, duration = 1400) {
  mainBanner.textContent = text;
  mainBanner.classList.add('show');
  if (duration > 0) setTimeout(() => mainBanner.classList.remove('show'), duration);
}

function showMoveBanner(text, duration = 1200) {
  moveBanner.textContent = text;
  moveBanner.classList.add('show');
  setTimeout(() => moveBanner.classList.remove('show'), duration);
}

function showBubble(el, text, duration = 1700) {
  el.textContent = text;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, duration);
}

function showCombo(count, name) {
  if (count < 2) return;
  comboToast.textContent = `${count}x ${name} COMBO!`;
  comboToast.classList.add('show');
  setTimeout(() => comboToast.classList.remove('show'), 1100);
}

function updateRoundDots() {
  const p1Dots = document.querySelectorAll('#p1-rounds .dot');
  const p2Dots = document.querySelectorAll('#p2-rounds .dot');
  p1Dots.forEach((d, idx) => d.classList.toggle('won', idx < p1.roundsWon));
  p2Dots.forEach((d, idx) => d.classList.toggle('won', idx < p2.roundsWon));
}

function updateHUD() {
  p1NameLabel.textContent = `${p1.cfg.icon} ${p1.cfg.name} (YOU)`;
  p2NameLabel.textContent = `${p2.cfg.icon} ${p2.cfg.name} (BOT)`;

  p1.hp = Math.max(0, Math.min(100, p1.hp));
  p2.hp = Math.max(0, Math.min(100, p2.hp));
  p1.superEnergy = Math.max(0, Math.min(100, p1.superEnergy));
  p2.superEnergy = Math.max(0, Math.min(100, p2.superEnergy));

  p1HpBar.style.width = p1.hp + '%';
  p2HpBar.style.width = p2.hp + '%';
  p1HpLabel.textContent = Math.round(p1.hp) + '%';
  p2HpLabel.textContent = Math.round(p2.hp) + '%';

  p1SuperBar.style.width = p1.superEnergy + '%';
  p2SuperBar.style.width = p2.superEnergy + '%';

  p1SuperTag.style.display = p1.superEnergy >= 100 ? 'inline-block' : 'none';
  p2SuperTag.style.display = p2.superEnergy >= 100 ? 'inline-block' : 'none';
}

function performAttack(attacker, defender, type) {
  if (matchOver || activeSuper || (attacker.state !== 'IDLE' && attacker.state !== 'WALK')) return;

  attacker.state = type;
  attacker.stateTimer = type === 'PUNCH' ? 0.25 : type === 'KICK' ? 0.4 : 0.48;
  SFX.whoosh();

  if (type === 'KICK') {
    showMoveBanner(attacker.cfg.kickName, 900);
  } else if (type === 'SPECIAL') {
    showMoveBanner(attacker.cfg.specialName, 1000);
  }

  const dist = Math.abs(attacker.root.position.x - defender.root.position.x);
  const range = type === 'PUNCH' ? 1.45 : type === 'KICK' ? 1.85 : 2.15;

  setTimeout(() => {
    if (matchOver) return;
    if (dist <= range && Math.abs(attacker.root.position.y - defender.root.position.y) < 1.35) {
      const isBlocked = defender.state === 'BLOCK';
      let dmg = type === 'PUNCH' ? 6 : type === 'KICK' ? 11 : 15;

      if (isBlocked) {
        dmg = Math.ceil(dmg * 0.2);
        SFX.blockClang();
        spawnHitRing(defender.root.position.x, 1.5, 0x38bdf8);
        defender.root.position.x = Math.max(-5.0, Math.min(5.0, defender.root.position.x + attacker.facing * 0.2));
      } else {
        defender.hp -= dmg;
        attacker.superEnergy = Math.min(100, attacker.superEnergy + 22);
        defender.superEnergy = Math.min(100, defender.superEnergy + 14);

        // Combo Tracking
        const now = performance.now();
        if (now - attacker.lastHitTime < 2200) {
          attacker.comboCount++;
        } else {
          attacker.comboCount = 1;
        }
        attacker.lastHitTime = now;
        showCombo(attacker.comboCount, attacker.cfg.name);

        defender.state = 'HIT';
        defender.stateTimer = 0.32;

        // Heavy Kicks & Specials launch opponent into the air like Tekken!
        if (type === 'KICK' || type === 'SPECIAL') {
          SFX.heavyKickHit();
          triggerScreenShake(0.18, 0.18);
          defender.vy = type === 'SPECIAL' ? 6.8 : 4.8;
          defender.isGrounded = false;
          defender.vx = attacker.facing * (type === 'SPECIAL' ? 4.5 : 3.2);
        } else {
          SFX.punchHit();
          defender.root.position.x = Math.max(-5.0, Math.min(5.0, defender.root.position.x + attacker.facing * 0.35));
        }

        spawnHitRing(
          (attacker.root.position.x + defender.root.position.x) / 2,
          1.6,
          type === 'SPECIAL' ? 0xc084fc : type === 'KICK' ? 0x86efac : 0xfef08a
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
    loser.state = 'KO';
    winner.roundsWon++;
    updateRoundDots();

    SFX.bellGong();
    triggerScreenShake(0.35, 0.3);
    showMainBanner('K.O.!', 0);

    if (winner.roundsWon >= 2) {
      speakLine(`K O! ${winner.cfg.name} wins the election showdown!`, 0.95, 1.0);
      setTimeout(() => {
        showMainBanner(`${winner.cfg.name} WINS!`, 0);
        showBubble(winner === p1 ? bubbleP1 : bubbleP2, winner.cfg.winQuote, 4500);
      }, 1500);
    } else {
      speakLine(`Round ${currentRound} goes to ${winner.cfg.name}!`, 1.0, 1.05);
      setTimeout(() => {
        currentRound++;
        resetRound();
      }, 2600);
    }
  }
}

// Button Bindings
document.getElementById('btn-p1-super').addEventListener('click', () => triggerSuperpower(p1, p2));
document.getElementById('btn-p2-super').addEventListener('click', () => triggerSuperpower(p2, p1));
document.getElementById('btn-toggle-bgm').addEventListener('click', (e) => {
  initAudio();
  bgmEnabled = !bgmEnabled;
  e.target.textContent = `🎵 Music: ${bgmEnabled ? 'ON' : 'OFF'}`;
});
document.getElementById('btn-toggle-ai').addEventListener('click', (e) => {
  botEnabled = !botEnabled;
  e.target.textContent = `🤖 Bot: ${botEnabled ? 'ON' : 'OFF'}`;
});
document.getElementById('btn-reset').addEventListener('click', () => {
  p1.roundsWon = 0;
  p2.roundsWon = 0;
  currentRound = 1;
  updateRoundDots();
  resetRound();
});

function resetRound() {
  p1.hp = 100;
  p2.hp = 100;
  p1.superEnergy = 100;
  p2.superEnergy = 100;
  p1.root.position.set(-2.2, 0, 0);
  p2.root.position.set(2.2, 0, 0);
  p1.vy = 0;
  p2.vy = 0;
  p1.vx = 0;
  p2.vx = 0;
  p1.state = 'IDLE';
  p2.state = 'IDLE';
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
    showMainBanner('FIGHT!', 900);
    speakLine(`Round ${currentRound}, Fight!`, 1.0, 1.1);
  }, 1050);
}

// Match Countdown Timer
setInterval(() => {
  if (!matchOver && matchTime > 0 && selectScreen.classList.contains('hidden')) {
    matchTime--;
    timerText.textContent = matchTime;
    if (matchTime === 0) {
      if (p1.hp >= p2.hp) p2.hp = 0;
      else p1.hp = 0;
      checkRoundKO();
    }
  }
}, 1000);

// Periodic Chaiwala Drops a Garam Chai Powerup Cup!
setInterval(() => {
  if (!matchOver && selectScreen.classList.contains('hidden')) {
    showBubble(bubbleChai, 'Garam Chai dropped! Grab it!', 2200);
    spawnChaiCupPowerup((Math.random() - 0.5) * 5.5);
  }
}, 9000);

// =========================================================================
// 10. BOT AI & CHARACTER JOINT ANIMATIONS
// =========================================================================
let aiCooldown = 0;

function updateBotAI(dt) {
  if (!botEnabled || matchOver || activeSuper || p2.state === 'KO' || !selectScreen.classList.contains('hidden')) return;
  aiCooldown -= dt;
  if (aiCooldown > 0) return;

  const dist = Math.abs(p1.root.position.x - p2.root.position.x);
  if (dist > 1.7) {
    p2.root.position.x += Math.sign(p1.root.position.x - p2.root.position.x) * 3.2 * dt;
    p2.state = 'WALK';
  } else {
    aiCooldown = 0.5 + Math.random() * 0.45;
    const roll = Math.random();
    if (roll < 0.35) {
      performAttack(p2, p1, 'PUNCH');
    } else if (roll < 0.65) {
      performAttack(p2, p1, 'KICK');
    } else if (roll < 0.85) {
      performAttack(p2, p1, 'SPECIAL');
    } else if (p2.superEnergy >= 100) {
      triggerSuperpower(p2, p1);
    }
  }
}

function animateFighterJoints(f, elapsed, dt) {
  if (f.state !== 'KO') {
    const other = f === p1 ? p2 : p1;
    f.facing = other.root.position.x >= f.root.position.x ? 1 : -1;
    f.bodyPivot.rotation.y = f.facing === 1 ? 0 : Math.PI;
    f.bodyPivot.rotation.z = 0;
    f.bodyPivot.position.y = 0;
  }

  // Air Juggling & Knockback Velocity
  if (!f.isGrounded) {
    f.root.position.y += f.vy * dt;
    f.root.position.x = Math.max(-5.0, Math.min(5.0, f.root.position.x + f.vx * dt));
    f.vy -= 18 * dt;
    if (f.root.position.y <= 0) {
      f.root.position.y = 0;
      f.vy = 0;
      f.vx = 0;
      f.isGrounded = true;
    }
  }

  // Check if fighter picks up the dropped Garam Chai Cup
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
    if (f.stateTimer <= 0 && f.state !== 'KO') {
      f.state = 'IDLE';
    }
  }

  f.shieldMesh.visible = f.state === 'BLOCK';
  f.leftShoulder.rotation.set(0, 0, 0.45);
  f.rightShoulder.rotation.set(0, 0, 0.65);
  f.leftHip.rotation.set(0, 0, 0);
  f.rightHip.rotation.set(0, 0, 0);

  if (f.state === 'IDLE') {
    f.bodyPivot.position.y = Math.sin(elapsed * 6) * 0.04;
  } else if (f.state === 'BLOCK') {
    f.leftShoulder.rotation.z = 1.25;
    f.rightShoulder.rotation.z = 1.25;
    f.bodyPivot.position.y = -0.15;
  } else if (f.state === 'WALK') {
    const walkCycle = Math.sin(elapsed * 14) * 0.55;
    f.leftHip.rotation.z = walkCycle;
    f.rightHip.rotation.z = -walkCycle;
    f.leftShoulder.rotation.z = 0.4 - walkCycle * 0.4;
    f.rightShoulder.rotation.z = 0.4 + walkCycle * 0.4;
  } else if (f.state === 'PUNCH') {
    f.rightShoulder.rotation.z = Math.PI / 2;
  } else if (f.state === 'KICK') {
    f.rightHip.rotation.z = Math.PI / 2.05;
    f.bodyPivot.rotation.z = -0.24;
  } else if (f.state === 'SPECIAL') {
    f.leftShoulder.rotation.z = Math.PI * 0.75;
    f.rightShoulder.rotation.z = Math.PI * 0.75;
    f.rightHip.rotation.z = Math.PI / 2.2;
  } else if (f.state === 'HIT') {
    f.bodyPivot.rotation.z = -0.42;
  } else if (f.state === 'SUPER') {
    if (f.key === 'MODI') {
      f.rightShoulder.rotation.z = Math.PI * 0.95;
    } else {
      f.leftShoulder.rotation.z = Math.PI / 2;
      f.rightShoulder.rotation.z = Math.PI / 2;
    }
  } else if (f.state === 'KO') {
    f.bodyPivot.rotation.z = Math.PI / 2;
    f.bodyPivot.position.y = -0.7;
  }
}

function updateBubblePosition(el, worldPos) {
  const vec = worldPos.clone();
  vec.project(camera);
  const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vec.y * 0.5) + 0.5) * window.innerHeight;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

// =========================================================================
// 11. MAIN GAME LOOP
// =========================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  // Player 1 Input
  if (!matchOver && !activeSuper && p1.state !== 'KO' && selectScreen.classList.contains('hidden')) {
    if (keys['KeyS'] || keys['ArrowDown']) {
      p1.state = 'BLOCK';
    } else {
      let moved = false;
      if (keys['KeyA'] || keys['ArrowLeft']) {
        p1.root.position.x = Math.max(-5.0, p1.root.position.x - 4.3 * dt);
        moved = true;
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        p1.root.position.x = Math.min(5.0, p1.root.position.x + 4.3 * dt);
        moved = true;
      }
      if ((keys['KeyW'] || keys['ArrowUp']) && p1.isGrounded) {
        p1.vy = 7.8;
        p1.isGrounded = false;
        SFX.whoosh();
      }
      if (p1.state === 'IDLE' || p1.state === 'WALK' || p1.state === 'BLOCK') {
        p1.state = moved ? 'WALK' : 'IDLE';
      }
    }
  }

  updateBotAI(dt);
  animateFighterJoints(p1, elapsed, dt);
  animateFighterJoints(p2, elapsed, dt);

  crowdSpectators.forEach((c) => {
    c.mesh.position.y = c.baseY + Math.abs(Math.sin(elapsed * 5 + c.phase)) * 0.18;
  });

  chaiwala.position.x += chaiDir * 1.2 * dt;
  if (chaiwala.position.x > 4.2) chaiDir = -1;
  if (chaiwala.position.x < -4.2) chaiDir = 1;
  chaiwala.rotation.y = chaiDir === 1 ? Math.PI / 2 : -Math.PI / 2;

  if (activeChaiCup) {
    activeChaiCup.rotation.y += 3 * dt;
  }

  // Update Active Ultimate Superpower
  if (activeSuper) {
    activeSuper.age += dt;
    activeSuper.mesh.rotation.y += 16 * dt;

    if (activeSuper.age < 1.35) {
      const s = 0.6 + activeSuper.age * 0.7;
      activeSuper.mesh.scale.set(s, s, s);
      camera.position.lerp(
        new THREE.Vector3(activeSuper.attacker.root.position.x * 0.4, defaultCamPos.y + 0.4, defaultCamPos.z + 1.4),
        0.08
      );
    } else {
      const def = activeSuper.defender;
      const targetPos = new THREE.Vector3(def.root.position.x, 1.5, 0);
      activeSuper.mesh.position.lerp(targetPos, 0.24);

      if (activeSuper.mesh.position.distanceTo(targetPos) < 0.75) {
        SFX.superBoom();
        triggerScreenShake(0.4, 0.35);
        spawnHitRing(def.root.position.x, 1.5, 0xfacc15);

        const isBlocked = def.state === 'BLOCK';
        def.hp -= isBlocked ? 15 : 42;
        def.state = 'HIT';
        def.stateTimer = 0.6;
        def.vy = 7.5;
        def.vx = activeSuper.attacker.facing * 5.2;
        def.isGrounded = false;

        scene.background.copy(normalSkyColor);
        scene.remove(activeSuper.mesh);
        activeSuper = null;
        updateHUD();
        checkRoundKO();
      }
    }
  } else {
    const midX = (p1.root.position.x + p2.root.position.x) * 0.35;
    camera.position.lerp(new THREE.Vector3(midX, defaultCamPos.y, defaultCamPos.z), 0.1);
  }

  // Apply Camera Screen Shake on Heavy Impacts
  if (screenShakeTime > 0) {
    screenShakeTime -= dt;
    camera.position.x += (Math.random() - 0.5) * screenShakeIntensity;
    camera.position.y += (Math.random() - 0.5) * screenShakeIntensity;
  }

  // Update Hit Rings & 3D Sparks
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
  updateBubblePosition(bubbleChai, new THREE.Vector3(chaiwala.position.x, 2.35, -3.8));

  renderer.render(scene, camera);
}

window.addEventListener('resize', updateResponsiveCamera);
window.addEventListener('orientationchange', () => setTimeout(updateResponsiveCamera, 150));

animate();
