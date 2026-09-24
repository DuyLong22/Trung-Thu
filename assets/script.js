const container = document.getElementById("webgl-container");
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) || window.innerWidth < 768;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060312, 0.008);

const camera = new THREE.PerspectiveCamera(
  isMobile ? 60 : 45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const DEFAULT_CAM_POS = isMobile
  ? new THREE.Vector3(0, 12, 45)
  : new THREE.Vector3(0, 10, 40);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 6.0, 0);

camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.05;
controls.minDistance = 8;
controls.maxDistance = 85;
controls.target.copy(DEFAULT_CAM_TARGET);
controls.enableRotate = true;
controls.enablePan = false;
controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;

// LIGHTS
const ambientLight = new THREE.AmbientLight(0x2a103d, 1.4);
scene.add(ambientLight);

const treeLight = new THREE.PointLight(0xffb6c1, 2.5, 45);
treeLight.position.set(0, 8, 0);
scene.add(treeLight);

const warmLight = new THREE.PointLight(0xffaa33, 2.0, 30);
warmLight.position.set(0, -2, 0);
scene.add(warmLight);

// ISLAND
const islandGroup = new THREE.Group();
scene.add(islandGroup);

const islandGeo = new THREE.CylinderGeometry(
  8.5,
  2.2,
  7.5,
  isMobile ? 32 : 48,
  12,
);
const posAttr = islandGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const vx = posAttr.getX(i);
  const vy = posAttr.getY(i);
  const vz = posAttr.getZ(i);

  const distFromCenter = Math.sqrt(vx * vx + vz * vz);
  const noise =
    Math.sin(vx * 0.8) * Math.cos(vz * 0.8) * 0.6 +
    Math.sin(vx * 1.8 + vz * 1.5) * 0.3;

  if (vy > 0) {
    posAttr.setY(i, vy + noise * (1.0 - distFromCenter / 12));
  } else {
    posAttr.setX(i, vx + (Math.random() - 0.5) * 1.4);
    posAttr.setZ(i, vz + (Math.random() - 0.5) * 1.4);
  }
}
islandGeo.computeVertexNormals();

const islandMat = new THREE.MeshStandardMaterial({
  color: 0x3d231b,
  roughness: 0.85,
  flatShading: true,
});
const islandMesh = new THREE.Mesh(islandGeo, islandMat);
islandGroup.add(islandMesh);

const topGeo = new THREE.CylinderGeometry(8.6, 7.8, 0.8, isMobile ? 32 : 48, 4);
const topPos = topGeo.attributes.position;
for (let i = 0; i < topPos.count; i++) {
  const vx = topPos.getX(i);
  const vy = topPos.getY(i);
  const vz = topPos.getZ(i);
  const noise = Math.sin(vx * 0.9) * Math.cos(vz * 0.9) * 0.5;
  topPos.setY(i, vy + noise * 0.4);
}
topGeo.computeVertexNormals();
const topMat = new THREE.MeshStandardMaterial({
  color: 0x22130e,
  roughness: 0.9,
  flatShading: true,
});
const topMesh = new THREE.Mesh(topGeo, topMat);
topMesh.position.y = 3.6;
islandGroup.add(topMesh);

// BỆ MẶT ĐÁ NHỎ & ĐÁ TẢNG RẢI RÁC ÍT HƠN
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x4a4d52,
  roughness: 0.85,
  metalness: 0.1,
  flatShading: true,
});

// 1. Bệ đá nhỏ dẹt ẩn nhẹ dưới gốc cây
const mainStonePlatformGeo = new THREE.CylinderGeometry(2.5, 3.0, 0.15, 6);
const mainStonePlatform = new THREE.Mesh(mainStonePlatformGeo, stoneMat);
mainStonePlatform.position.set(0, 3.9, 0);
islandGroup.add(mainStonePlatform);

// 2. Chỉ 3 viên đá nhỏ điểm xuyết trên mặt đất
const rockCount = 3;
for (let i = 0; i < rockCount; i++) {
  const rockGeo = new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.25, 0);
  const rockMesh = new THREE.Mesh(rockGeo, stoneMat);

  const angle = (i / rockCount) * Math.PI * 2 + 0.5;
  const dist = 3.8 + Math.random() * 2.0;

  rockMesh.position.set(Math.cos(angle) * dist, 3.9, Math.sin(angle) * dist);
  rockMesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );
  islandGroup.add(rockMesh);
}

// TREE TRUNK & BRANCHES
const treeGroup = new THREE.Group();
treeGroup.position.set(0, 4.0, 0);
islandGroup.add(treeGroup);

const trunkMat = new THREE.MeshStandardMaterial({
  color: 0x2b140e,
  roughness: 0.85,
});

const trunkCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.15, 2.5, -0.1),
  new THREE.Vector3(-0.1, 5.0, 0.1),
  new THREE.Vector3(0.0, 7.5, 0.0),
]);

const trunkGeo = new THREE.TubeGeometry(trunkCurve, 32, 0.28, 8, false);
const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
treeGroup.add(trunkMesh);

const branchClusters = [];
const mainBranchCount = 12;
for (let i = 0; i < mainBranchCount; i++) {
  const angle = (i / mainBranchCount) * Math.PI * 2 + Math.random() * 0.3;
  const h = 3.0 + Math.random() * 4.0;
  const startP = trunkCurve.getPointAt(h / 7.5);
  const len = 3.0 + Math.random() * 2.2;

  const endP = new THREE.Vector3(
    startP.x + Math.cos(angle) * len,
    startP.y + 0.8 + Math.random() * 1.0,
    startP.z + Math.sin(angle) * len,
  );

  const midP = new THREE.Vector3().addVectors(startP, endP).multiplyScalar(0.5);
  midP.y += 0.4;

  const bCurve = new THREE.CatmullRomCurve3([startP, midP, endP]);
  const bGeo = new THREE.TubeGeometry(bCurve, 10, 0.09, 6, false);
  const bMesh = new THREE.Mesh(bGeo, trunkMat);
  treeGroup.add(bMesh);

  branchClusters.push({ center: endP, radius: 3.2 + Math.random() * 1.0 });
}

// HỆ THỐNG TÁN LÁ
const particleCount = isMobile ? 22000 : 38000;
const blossomGeo = new THREE.BufferGeometry();
const blossomPos = new Float32Array(particleCount * 3);
const blossomColors = new Float32Array(particleCount * 3);

const colorDustyPink = new THREE.Color(0xe8a2a8);
const colorSoftPink = new THREE.Color(0xf0b6bc);
const colorPaleRose = new THREE.Color(0xf7d1d5);
const colorSoftWhite = new THREE.Color(0xfdf0f2);

const clusters = [
  { center: new THREE.Vector3(0, 9.5, 0), radius: 6.2 },
  { center: new THREE.Vector3(0, 7.5, 0), radius: 7.0 },
  { center: new THREE.Vector3(0, 5.5, 0), radius: 6.0 },
  ...branchClusters,
];

for (let i = 0; i < particleCount; i++) {
  const c = clusters[Math.floor(Math.random() * clusters.length)];

  const u = Math.random();
  const r = Math.pow(u, 0.65) * c.radius;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = c.center.x + r * Math.sin(phi) * Math.cos(theta);
  const y = c.center.y + r * Math.sin(phi) * Math.sin(theta) * 0.8;
  const z = c.center.z + r * Math.cos(phi);

  blossomPos[i * 3] = x;
  blossomPos[i * 3 + 1] = y;
  blossomPos[i * 3 + 2] = z;

  const heightFactor = THREE.MathUtils.clamp((y - 3) / 7, 0, 1);
  const randC = Math.random();
  let col;

  if (heightFactor < 0.3) {
    col = randC < 0.6 ? colorDustyPink : colorSoftPink;
  } else if (heightFactor < 0.7) {
    col =
      randC < 0.4
        ? colorSoftPink
        : randC < 0.8
          ? colorPaleRose
          : colorDustyPink;
  } else {
    col = randC < 0.5 ? colorSoftWhite : colorPaleRose;
  }

  blossomColors[i * 3] = col.r;
  blossomColors[i * 3 + 1] = col.g;
  blossomColors[i * 3 + 2] = col.b;
}

blossomGeo.setAttribute("position", new THREE.BufferAttribute(blossomPos, 3));
blossomGeo.setAttribute("color", new THREE.BufferAttribute(blossomColors, 3));

function createParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.4, "rgba(240,182,188,0.6)");
  grad.addColorStop(1, "rgba(240,182,188,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

const blossomMat = new THREE.PointsMaterial({
  size: isMobile ? 0.5 : 0.42,
  vertexColors: true,
  map: createParticleTexture(),
  transparent: true,
  opacity: 0.75,
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const blossomParticles = new THREE.Points(blossomGeo, blossomMat);
treeGroup.add(blossomParticles);

// ẢNH CẶP ĐÔI DƯỚI TÁN CÂY
// Sprite luôn hướng về camera, vì vậy ảnh không bị lật mặt sau khi đảo xoay.
const coupleTexture = new THREE.TextureLoader().load("./assets/couple.png");
coupleTexture.encoding = THREE.sRGBEncoding;

const coupleMaterial = new THREE.SpriteMaterial({
  map: coupleTexture,
  transparent: true,
  alphaTest: 0.03,
  depthWrite: false,
});

const coupleSprite = new THREE.Sprite(coupleMaterial);
coupleSprite.center.set(0.5, 0);
coupleSprite.position.set(-1.45, 4.02, 1.15);
coupleSprite.scale.set(2.7, 4.05, 1);
coupleSprite.renderOrder = 3;
islandGroup.add(coupleSprite);

// Bóng tiếp xúc giúp hai người trông như đang đứng trên mặt đảo.
const coupleShadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.15, 32),
  new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  }),
);
coupleShadow.rotation.x = -Math.PI / 2;
coupleShadow.scale.set(1.25, 0.55, 1);
coupleShadow.position.set(-1.45, 4.035, 1.12);
islandGroup.add(coupleShadow);

// RABBITS
function createRabbit() {
  const group = new THREE.Group();
  const rabbitMat = new THREE.MeshStandardMaterial({
    color: 0xf8f8ff,
    roughness: 0.5,
  });

  const bodyGeo = new THREE.SphereGeometry(0.5, 12, 12);
  bodyGeo.scale(0.8, 1, 0.9);
  const bodyMesh = new THREE.Mesh(bodyGeo, rabbitMat);
  bodyMesh.position.y = 0.4;
  group.add(bodyMesh);

  const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
  const headMesh = new THREE.Mesh(headGeo, rabbitMat);
  headMesh.position.set(0, 0.85, 0.2);
  group.add(headMesh);

  const earGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.5, 8);
  const earLeft = new THREE.Mesh(earGeo, rabbitMat);
  earLeft.position.set(-0.12, 1.25, 0.18);
  earLeft.rotation.z = 0.15;
  earLeft.rotation.x = -0.1;
  group.add(earLeft);

  const earRight = earLeft.clone();
  earRight.position.x = 0.12;
  earRight.rotation.z = -0.15;
  group.add(earRight);

  return group;
}

const rabbits = [];

// Thay thỏ hình học cũ bằng mô hình GLB có texture từ SupaVoxel.
// Các bản sao dùng chung geometry/texture để nhẹ hơn trên trình duyệt.
const rabbitLoader = new THREE.GLTFLoader();
rabbitLoader.load(
  "./assets/rabbit-web.glb",
  (gltf) => {
    const rabbitTemplate = gltf.scene;
    rabbitTemplate.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(rabbitTemplate);
    const modelHeight = Math.max(bounds.max.y - bounds.min.y, 0.001);
    const baseScale = 1.25 / modelHeight;

    rabbitTemplate.traverse((object) => {
      if (object.isMesh) {
        object.frustumCulled = true;
        object.material.side = THREE.FrontSide;
      }
    });

    for (let i = 0; i < 4; i++) {
      const rabbitMesh = rabbitTemplate.clone(true);
      const rabbitScale = baseScale * (0.88 + Math.random() * 0.18);
      rabbitMesh.scale.setScalar(rabbitScale);
      islandGroup.add(rabbitMesh);

      rabbits.push({
        mesh: rabbitMesh,
        orbitRadius: 2.8 + Math.random() * 2.4,
        orbitSpeed:
          (0.1 + Math.random() * 0.1) * (i % 2 === 0 ? 1 : -1),
        phase: (i / 4) * Math.PI * 2,
        baseY: 4.03,
        hopSpeed: 3.5 + Math.random() * 1.5,
        hopHeight: 0.1,
      });
    }
  },
  undefined,
  (error) => {
    console.error("Không thể tải mô hình thỏ:", error);
  },
);

function updateRabbits(time) {
  rabbits.forEach((r) => {
    const angle = r.phase + time * r.orbitSpeed;
    const sign = Math.sign(r.orbitSpeed) || 1;

    const x = Math.cos(angle) * r.orbitRadius;
    const z = Math.sin(angle) * r.orbitRadius;
    const hop = Math.abs(Math.sin(time * r.hopSpeed)) * r.hopHeight;

    r.mesh.position.set(x, r.baseY + hop, z);

    const dx = -Math.sin(angle) * sign;
    const dz = Math.cos(angle) * sign;
    r.mesh.rotation.y = Math.atan2(dx, dz);
  });
}

// LANTERNS & MESSAGES WITH IMAGES
const lanternsGroup = new THREE.Group();
scene.add(lanternsGroup);

const lanterns = [];
const interactiveObjects = [];

const wishList = [
  {
    text: "Chúc người anh yêu thương luôn vui vẻ, hạnh phúc và bên nhau thật lâu.",
    img: "./assets/hinh1.jpg",
  },
  {
    text: "Cầu chúc cho mọi nguyện ước của em yêu đêm nay sẽ trở thành hiện thực.",
    img: "./assets/hinh2.jpg",
  },
  {
    text: "Chúc tình yêu của chúng mình luôn tròn đầy như ánh trăng đêm rằm.",
    img: "./assets/hinh3.jpeg",
  },
  {
    text: "Chúc em yêu luôn giữ được tâm hồn trong trẻo, yêu đời như ánh trăng rằm.",
    img: "./assets/hinh1.jpg",
  },
  {
    text: "Trung Thu bình an, vạn sự như ý, công danh thăng tiến rực rỡ!",
    img: "./assets/hinh2.jpg",
  },
  {
    text: "Chúc riêng em yêu một đêm trăng thật lãng mạn và ngọt ngào.",
    img: "./assets/hinh3.jpeg",
  },
  {
    text: "Sức khỏe dồi dào, tâm an yên, miệng luôn mỉm cười rạng rỡ.",
    img: "./assets/hinh1.jpg",
  },
];

function createLanternTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#ff4d4d");
  grad.addColorStop(0.5, "#e63946");
  grad.addColorStop(1, "#ffb703");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);
  return new THREE.CanvasTexture(canvas);
}

const lanternTex = createLanternTexture();

function createLanternMesh() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.6, 0.45, 1.4, 6);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: lanternTex,
    emissive: 0xff7700,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const capGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.1, 6);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.5,
  });
  const capTop = new THREE.Mesh(capGeo, capMat);
  capTop.position.y = 0.7;
  group.add(capTop);

  const tagGeo = new THREE.PlaneGeometry(0.35, 0.7);
  const tagMat = new THREE.MeshBasicMaterial({
    color: 0xd90429,
    side: THREE.DoubleSide,
  });
  const tag = new THREE.Mesh(tagGeo, tagMat);
  tag.position.set(0, -1.1, 0);
  group.add(tag);

  const spriteMat = new THREE.SpriteMaterial({
    map: createParticleTexture(),
    color: 0xffaa00,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(spriteMat);
  glow.scale.set(3.2, 3.2, 1);
  group.add(glow);

  const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  group.add(hitMesh);

  return { group, hitMesh };
}

const lanternCount = isMobile ? 18 : 28;

function addLanternToScene(lantern, hitMesh, i) {
  const radius = 9 + Math.random() * 25;
  const angle = Math.random() * Math.PI * 2;
  const y = -1 + Math.random() * 30;

  lantern.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

  const wishData = wishList[Math.floor(Math.random() * wishList.length)];

  lantern.userData = {
    speedY: 0.008 + Math.random() * 0.012,
    swingSpeed: 0.8 + Math.random() * 1.2,
    initialX: lantern.position.x,
    initialZ: lantern.position.z,
    wish: wishData.text,
    imgUrl: wishData.img,
    id: i,
  };

  const sc = 0.75 + Math.random() * 0.5;
  lantern.scale.set(sc, sc, sc);

  hitMesh.userData.parentLantern = lantern;

  lanternsGroup.add(lantern);
  lanterns.push(lantern);
  interactiveObjects.push(hitMesh);
}

// Mô hình đèn lồng GLB có texture từ SupaVoxel.
const lanternLoader = new THREE.GLTFLoader();
lanternLoader.load(
  "./assets/lantern-web.glb",
  (gltf) => {
    const lanternTemplate = gltf.scene;
    lanternTemplate.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(lanternTemplate);
    const modelHeight = Math.max(bounds.max.y - bounds.min.y, 0.001);
    const modelCenterY = (bounds.min.y + bounds.max.y) * 0.5;
    const baseScale = 1.65 / modelHeight;

    lanternTemplate.traverse((object) => {
      if (object.isMesh) {
        object.material = object.material.clone();
        object.material.emissive = new THREE.Color(0xff6a00);
        object.material.emissiveIntensity = 0.22;
        object.material.needsUpdate = true;
      }
    });

    for (let i = 0; i < lanternCount; i++) {
      const lantern = new THREE.Group();
      const model = lanternTemplate.clone(true);
      model.scale.setScalar(baseScale);
      model.position.y = -modelCenterY * baseScale;
      lantern.add(model);

      const glowMaterial = new THREE.SpriteMaterial({
        map: createParticleTexture(),
        color: 0xffaa22,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.set(3.2, 3.2, 1);
      lantern.add(glow);

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      lantern.add(hitMesh);

      addLanternToScene(lantern, hitMesh, i);
    }
  },
  undefined,
  (error) => {
    console.error("Không thể tải mô hình đèn lồng:", error);

    // Giữ đèn hình học cũ làm phương án dự phòng nếu GLB không tải được.
    for (let i = 0; i < lanternCount; i++) {
      const { group: lantern, hitMesh } = createLanternMesh();
      addLanternToScene(lantern, hitMesh, i);
    }
  },
);

// FALLING PETALS & STARS
const fallingPetalsCount = isMobile ? 80 : 180;
const petalsGeo = new THREE.BufferGeometry();
const petalsPos = new Float32Array(fallingPetalsCount * 3);
const petalsData = [];

for (let i = 0; i < fallingPetalsCount; i++) {
  petalsPos[i * 3] = (Math.random() - 0.5) * 36;
  petalsPos[i * 3 + 1] = Math.random() * 36;
  petalsPos[i * 3 + 2] = (Math.random() - 0.5) * 36;

  petalsData.push({
    speedY: 0.02 + Math.random() * 0.03,
  });
}

petalsGeo.setAttribute("position", new THREE.BufferAttribute(petalsPos, 3));
const petalsMat = new THREE.PointsMaterial({
  size: isMobile ? 0.35 : 0.3,
  color: 0xf7d1d5,
  transparent: true,
  opacity: 0.75,
  map: createParticleTexture(),
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const petalsParticles = new THREE.Points(petalsGeo, petalsMat);
scene.add(petalsParticles);

const starCount = isMobile ? 400 : 900;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 180;
  starPos[i * 3 + 1] = Math.random() * 90;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.4,
  transparent: true,
  opacity: 0.7,
});
scene.add(new THREE.Points(starGeo, starMat));

// SHOOTING STARS
// The sprites live in camera space so they always cross the visible sky, while
// their depth keeps the island and lanterns naturally in front of them.
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const shootingStarsGroup = new THREE.Group();
camera.add(shootingStarsGroup);
scene.add(camera);

function createShootingStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const tailGradient = ctx.createLinearGradient(0, 0, 240, 0);
  tailGradient.addColorStop(0, "rgba(170, 205, 255, 0)");
  tailGradient.addColorStop(0.42, "rgba(190, 220, 255, 0.04)");
  tailGradient.addColorStop(0.76, "rgba(210, 228, 255, 0.2)");
  tailGradient.addColorStop(0.92, "rgba(255, 236, 198, 0.72)");
  tailGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(177, 211, 255, 0.8)";
  ctx.strokeStyle = tailGradient;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(4, 32);
  ctx.lineTo(236, 32);
  ctx.stroke();
  ctx.restore();

  const headGlow = ctx.createRadialGradient(230, 32, 0, 230, 32, 13);
  headGlow.addColorStop(0, "rgba(255, 255, 255, 1)");
  headGlow.addColorStop(0.16, "rgba(255, 235, 190, 0.88)");
  headGlow.addColorStop(0.5, "rgba(172, 211, 255, 0.2)");
  headGlow.addColorStop(1, "rgba(172, 211, 255, 0)");
  ctx.fillStyle = headGlow;
  ctx.fillRect(216, 18, 28, 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

const shootingStarTexture = createShootingStarTexture();
const shootingStars = [];
const shootingStarPoolSize = 10;
const shootingStarBurstSize = 10;
let shootingStarTimer = isMobile ? 0.35 : 0.2;

for (let i = 0; i < shootingStarPoolSize; i++) {
  const material = new THREE.SpriteMaterial({
    map: shootingStarTexture,
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.visible = false;
  shootingStarsGroup.add(sprite);
  shootingStars.push({
    sprite,
    active: false,
    delay: 0,
    age: 0,
    duration: 1,
    maxOpacity: 1,
    velocity: new THREE.Vector3(),
  });
}

function launchShootingStar(burstIndex = 0, burstSize = 1) {
  const meteor = shootingStars.find((item) => !item.active);
  if (!meteor) return;

  const depth = 135 + Math.random() * 55;
  const halfHeight =
    Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * depth;
  const halfWidth = halfHeight * camera.aspect;
  const lane = burstSize > 1
    ? (burstIndex * 0.61803398875) % 1
    : Math.random();
  const depthScale = THREE.MathUtils.clamp(1 - (depth - 135) / 120, 0.68, 1);
  const direction = new THREE.Vector2(
    -(0.88 + Math.random() * 0.1),
    -(0.24 + Math.random() * 0.14),
  ).normalize();
  const duration = 0.58 + Math.random() * 0.3;
  const travelDistance = halfWidth * (0.34 + Math.random() * 0.16);
  const trailLength = Math.min(halfWidth * 0.19, 19) *
    (0.78 + Math.random() * 0.37) * depthScale;

  meteor.active = true;
  meteor.delay = burstIndex * (0.18 + Math.random() * 0.07) +
    Math.random() * 0.1;
  meteor.age = 0;
  meteor.duration = duration;
  meteor.maxOpacity = 0.6 + depthScale * 0.25 + Math.random() * 0.08;
  meteor.velocity.set(
    (direction.x * travelDistance) / duration,
    (direction.y * travelDistance) / duration,
    0,
  );

  meteor.sprite.position.set(
    THREE.MathUtils.lerp(halfWidth * 0.28, halfWidth * 1.02, Math.random()),
    THREE.MathUtils.lerp(halfHeight * 0.2, halfHeight * 0.9, lane) +
      (Math.random() - 0.5) * halfHeight * 0.06,
    -depth,
  );
  meteor.sprite.scale.set(trailLength, trailLength * 0.16, 1);
  meteor.sprite.material.rotation = Math.atan2(direction.y, direction.x);
  meteor.sprite.material.opacity = 0;
  meteor.sprite.visible = false;
}

function updateShootingStars(delta) {
  if (document.hidden || reducedMotionQuery.matches) return;

  shootingStarTimer -= delta;
  if (shootingStarTimer <= 0) {
    for (let i = 0; i < shootingStarBurstSize; i++) {
      launchShootingStar(i, shootingStarBurstSize);
    }
    shootingStarTimer = isMobile
      ? 5 + Math.random() * 2
      : 4.2 + Math.random() * 1.8;
  }

  shootingStars.forEach((meteor) => {
    if (!meteor.active) return;

    if (meteor.delay > 0) {
      meteor.delay -= delta;
      if (meteor.delay > 0) return;
      meteor.sprite.visible = true;
    }

    meteor.age += delta;
    const progress = meteor.age / meteor.duration;

    if (progress >= 1) {
      meteor.active = false;
      meteor.sprite.visible = false;
      meteor.sprite.material.opacity = 0;
      return;
    }

    meteor.sprite.position.addScaledVector(meteor.velocity, delta);
    const fadeIn = THREE.MathUtils.smoothstep(progress, 0, 0.12);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(progress, 0.42, 1);
    meteor.sprite.material.opacity = meteor.maxOpacity * fadeIn * fadeOut;
  });
}

function handleReducedMotionChange(event) {
  if (!event.matches) {
    shootingStarTimer = 0.2;
    return;
  }

  shootingStars.forEach((meteor) => {
    meteor.active = false;
    meteor.sprite.visible = false;
    meteor.sprite.material.opacity = 0;
  });
}

if (reducedMotionQuery.addEventListener) {
  reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
} else {
  reducedMotionQuery.addListener(handleReducedMotionChange);
}

// FIREWORKS
let fireworks = [];
function createFirework(pos) {
  const pCount = 50;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);
  const velocities = [];

  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = pos.x;
    pPositions[i * 3 + 1] = pos.y;
    pPositions[i * 3 + 2] = pos.z;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.08 + Math.random() * 0.12;

    velocities.push(
      new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi),
      ),
    );
  }

  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.35,
    color: 0xffd700,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
  });

  const pMesh = new THREE.Points(pGeo, pMat);
  scene.add(pMesh);

  fireworks.push({ mesh: pMesh, velocities: velocities, life: 1.0 });
}

// RAYCASTER & INTERACTION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetCamPos = null;
let targetCamTarget = null;
let selectedLantern = null;

const wishModal = document.getElementById("wishModal");
const wishText = document.getElementById("wishText");
const wishImage = document.getElementById("wishImage");
const closeWishBtn = document.getElementById("closeWishBtn");

let pointerDownPos = { x: 0, y: 0 };

function onPointerDown(event) {
  pointerDownPos.x =
    event.clientX || (event.touches && event.touches[0].clientX) || 0;
  pointerDownPos.y =
    event.clientY || (event.touches && event.touches[0].clientY) || 0;
}

function onPointerUp(event) {
  if (event.target.closest(".top-bar") || event.target.closest(".wish-modal"))
    return;

  const clientX =
    event.clientX ||
    (event.changedTouches && event.changedTouches[0].clientX) ||
    0;
  const clientY =
    event.clientY ||
    (event.changedTouches && event.changedTouches[0].clientY) ||
    0;

  const distMoved = Math.hypot(
    clientX - pointerDownPos.x,
    clientY - pointerDownPos.y,
  );
  if (distMoved > 8) return;

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, false);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    selectedLantern = hitMesh.userData.parentLantern || hitMesh.parent;
    const lPos = selectedLantern.position;

    createFirework(lPos);

    const offset = new THREE.Vector3()
      .subVectors(camera.position, lPos)
      .normalize()
      .multiplyScalar(5.5);
    targetCamPos = new THREE.Vector3().addVectors(lPos, offset);
    targetCamTarget = lPos.clone();

    wishText.textContent = `"${selectedLantern.userData.wish}"`;
    wishImage.src = selectedLantern.userData.imgUrl;

    setTimeout(() => {
      wishModal.classList.add("active");
    }, 300);
  }
}

window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });

function resetCamera() {
  targetCamPos = DEFAULT_CAM_POS.clone();
  targetCamTarget = DEFAULT_CAM_TARGET.clone();
  selectedLantern = null;
  islandGroup.rotation.y = 0;
}

document.getElementById("reset-cam-btn").addEventListener("click", resetCamera);

function closeWishCard(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  wishModal.classList.remove("active");
  resetCamera();
}

closeWishBtn.addEventListener("click", closeWishCard);
closeWishBtn.addEventListener("touchend", closeWishCard);

wishModal.addEventListener("click", (e) => {
  if (e.target === wishModal) closeWishCard(e);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeWishCard();
});

// AUDIO
const bgm = document.getElementById("bgm");
const audioBtn = document.getElementById("audio-btn");
let isPlaying = false;

audioBtn.addEventListener("click", () => {
  if (isPlaying) {
    bgm.pause();
    audioBtn.innerHTML = '<i class="fas fa-music" style="opacity:0.5;"></i>';
  } else {
    bgm
      .play()
      .then(() => {
        audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      })
      .catch(() => { });
  }
  isPlaying = !isPlaying;
});

// ANIMATION
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  lanterns.forEach((lantern) => {
    lantern.position.y += lantern.userData.speedY;
    lantern.position.x =
      lantern.userData.initialX +
      Math.sin(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.position.z =
      lantern.userData.initialZ +
      Math.cos(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.rotation.y += 0.005;

    if (lantern.position.y > 30) {
      lantern.position.y = -3;
    }
  });

  const pPos = petalsGeo.attributes.position.array;
  for (let i = 0; i < fallingPetalsCount; i++) {
    pPos[i * 3 + 1] -= petalsData[i].speedY;
    pPos[i * 3] += Math.sin(time + i) * 0.01;
    pPos[i * 3 + 2] += Math.cos(time + i) * 0.01;

    if (pPos[i * 3 + 1] < -3) {
      pPos[i * 3 + 1] = 30;
      pPos[i * 3] = (Math.random() - 0.5) * 36;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
  }
  petalsGeo.attributes.position.needsUpdate = true;

  for (let i = fireworks.length - 1; i >= 0; i--) {
    const fw = fireworks[i];
    fw.life -= delta * 1.2;
    const posArr = fw.mesh.geometry.attributes.position.array;

    for (let j = 0; j < fw.velocities.length; j++) {
      posArr[j * 3] += fw.velocities[j].x;
      posArr[j * 3 + 1] += fw.velocities[j].y;
      posArr[j * 3 + 2] += fw.velocities[j].z;
    }
    fw.mesh.geometry.attributes.position.needsUpdate = true;
    fw.mesh.material.opacity = fw.life;

    if (fw.life <= 0) {
      scene.remove(fw.mesh);
      fireworks.splice(i, 1);
    }
  }

  // Xoay liên tục đủ 360 độ; OrbitControls vẫn cho phép kéo/ vuốt tự do.
  islandGroup.rotation.y =
    (islandGroup.rotation.y + delta * 0.08) % (Math.PI * 2);

  updateRabbits(time);
  updateShootingStars(Math.min(delta, 0.05));

  if (targetCamPos && targetCamTarget) {
    camera.position.lerp(targetCamPos, 0.04);
    controls.target.lerp(targetCamTarget, 0.04);

    if (camera.position.distanceTo(targetCamPos) < 0.1) {
      targetCamPos = null;
      targetCamTarget = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.fov = width < 768 ? 60 : 45;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 2),
  );
});
