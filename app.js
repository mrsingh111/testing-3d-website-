const sceneFrame = document.getElementById("sceneFrame");
const hero = document.getElementById("hero");
const launchButton = document.getElementById("launchButton");
const boostButton = document.getElementById("boostButton");
const stopButton = document.getElementById("stopButton");
const speedReadout = document.getElementById("speedReadout");
const threeLayer = document.getElementById("threeLayer");
const carBody = document.getElementById("carBody");
const laneGrid = document.querySelector(".lane-grid");
const roadShine = document.querySelector(".road-shine");
const speedLines = document.querySelectorAll(".speed-lines span");
const THREE_NS = window.THREE;

let boosted = false;
let started = false;
let speed = 0;
let targetSpeed = 0;

const pointer = {
  x: 0,
  y: 0
};

function syncUiState() {
  document.documentElement.style.setProperty("--road-speed", boosted ? "1.1s" : "2.2s");
  document.documentElement.style.setProperty("--wheel-speed", boosted ? "0.28s" : "0.5s");
  document.documentElement.style.setProperty("--line-speed", boosted ? "0.6s" : "1.2s");
  targetSpeed = started ? (boosted ? 232 : 148) : 0;
  boostButton.textContent = boosted ? "Normal Speed" : "Boost Speed";
  launchButton.textContent = started ? "Running" : "Launch Scene";
  stopButton.textContent = started ? "Stop" : "Stopped";
  sceneFrame.classList.toggle("is-launched", started || boosted);
  sceneFrame.classList.toggle("is-running", started);
}

function animateSpeed() {
  speed += (targetSpeed - speed) * 0.08;
  speedReadout.textContent = `${Math.round(speed)} KM/H`;
}

function launchScene() {
  started = true;
  sceneFrame.classList.add("is-launched");
  sceneFrame.classList.add("is-running");
  sceneFrame.style.animation = "scenePulse 600ms ease";
  sceneFrame.scrollIntoView({ behavior: "smooth", block: "center" });
  syncUiState();
  window.setTimeout(() => {
    sceneFrame.style.animation = "";
  }, 650);
}

function stopScene() {
  started = false;
  boosted = false;
  syncUiState();
}

hero.addEventListener("pointermove", (event) => {
  const bounds = hero.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
  pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

  const rotateY = pointer.x * 8;
  const rotateX = pointer.y * -5;
  sceneFrame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

hero.addEventListener("pointerleave", () => {
  pointer.x = 0;
  pointer.y = 0;
  sceneFrame.style.transform = "rotateX(0deg) rotateY(0deg)";
});

launchButton.addEventListener("click", launchScene);
boostButton.addEventListener("click", () => {
  if (!started) {
    started = true;
  }
  boosted = !boosted;
  syncUiState();
  launchScene();
});
stopButton.addEventListener("click", stopScene);

let domOffset = 0;
let domTick = 0;

function animateDomLayer() {
  domTick += started ? (boosted ? 0.18 : 0.1) : 0.02;
  domOffset += started ? (boosted ? 22 : 10) : 0;

  laneGrid.style.backgroundPosition = `0 0, 0 ${domOffset}px`;
  roadShine.style.opacity = started ? (boosted ? "0.9" : "0.45") : "0.15";
  roadShine.style.transform = `translateY(${(domOffset % 160) * 0.06}px)`;

  const bob = started ? Math.sin(domTick * 2.4) * (boosted ? 12 : 7) : 0;
  const drift = started ? Math.sin(domTick) * (boosted ? 8 : 4) : 0;
  const scale = started ? (boosted ? 1.04 : 1.015) : 1;
  carBody.style.transform = `translateX(calc(-50% + ${drift}px)) translateY(${bob}px) translateZ(140px) scale(${scale})`;

  speedLines.forEach((line, index) => {
    const base = started ? 0.25 + ((index + 1) / speedLines.length) * 0.6 : 0.08;
    line.style.opacity = String(base);
  });

  animateSpeed();
  requestAnimationFrame(animateDomLayer);
}

syncUiState();
animateDomLayer();

if (THREE_NS) {
  const scene = new THREE_NS.Scene();
  scene.fog = new THREE_NS.Fog(0x07020e, 18, 58);

  const camera = new THREE_NS.PerspectiveCamera(52, 1, 0.1, 140);
  camera.position.set(0, 4.8, 10.8);

  const renderer = new THREE_NS.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  threeLayer.appendChild(renderer.domElement);

  const ambient = new THREE_NS.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const magentaLight = new THREE_NS.PointLight(0xff4fd8, 9, 40, 2);
  magentaLight.position.set(-5, 6, 2);
  scene.add(magentaLight);

  const cyanLight = new THREE_NS.PointLight(0x5cecff, 10, 44, 2);
  cyanLight.position.set(6, 5, 4);
  scene.add(cyanLight);

  const sunLight = new THREE_NS.PointLight(0xff9a41, 8, 48, 2);
  sunLight.position.set(0, 10, -10);
  scene.add(sunLight);

  const roadMaterial = new THREE_NS.MeshStandardMaterial({
    color: 0x12081d,
    metalness: 0.25,
    roughness: 0.55,
    emissive: 0x17071f,
    emissiveIntensity: 0.45
  });

  const road = new THREE_NS.Mesh(new THREE_NS.PlaneGeometry(16, 140, 1, 1), roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -1.55, -44);
  scene.add(road);

  const laneMaterial = new THREE_NS.MeshBasicMaterial({ color: 0x8ef6ff });
  const laneMarkers = [];

  for (let index = 0; index < 36; index += 1) {
    const marker = new THREE_NS.Mesh(new THREE_NS.PlaneGeometry(0.12, 2.4), laneMaterial);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0, -1.53, -index * 4);
    scene.add(marker);
    laneMarkers.push(marker);
  }

  const roadEdgeMaterial = new THREE_NS.MeshBasicMaterial({ color: 0xff4fd8 });
  const edgeRails = [];

  [-4.8, 4.8].forEach((x) => {
    for (let index = 0; index < 24; index += 1) {
      const rail = new THREE_NS.Mesh(new THREE_NS.BoxGeometry(0.12, 0.12, 2.6), roadEdgeMaterial);
      rail.position.set(x, -1.15, -index * 5.8);
      scene.add(rail);
      edgeRails.push(rail);
    }
  });

  const cityMaterial = new THREE_NS.MeshStandardMaterial({
    color: 0x16213f,
    emissive: 0x2ee6ff,
    emissiveIntensity: 0.28,
    metalness: 0.2,
    roughness: 0.65
  });

  const skyline = [];

  for (let index = 0; index < 34; index += 1) {
    const width = THREE_NS.MathUtils.randFloat(0.8, 1.8);
    const height = THREE_NS.MathUtils.randFloat(1.6, 6.2);
    const depth = THREE_NS.MathUtils.randFloat(0.8, 1.6);
    const tower = new THREE_NS.Mesh(new THREE_NS.BoxGeometry(width, height, depth), cityMaterial);
    const side = index % 2 === 0 ? -1 : 1;
    tower.position.set(
      side * THREE_NS.MathUtils.randFloat(7.5, 14),
      height / 2 - 1.5,
      -THREE_NS.MathUtils.randFloat(10, 90)
    );
    tower.userData.baseX = tower.position.x;
    scene.add(tower);
    skyline.push(tower);
  }

  const mountainMaterial = new THREE_NS.MeshStandardMaterial({
    color: 0x251436,
    emissive: 0x110717,
    emissiveIntensity: 0.2,
    roughness: 0.95
  });

  for (let index = 0; index < 7; index += 1) {
    const mountain = new THREE_NS.Mesh(
      new THREE_NS.ConeGeometry(THREE_NS.MathUtils.randFloat(3.2, 6.8), THREE_NS.MathUtils.randFloat(5, 9), 4),
      mountainMaterial
    );
    mountain.rotation.y = Math.PI * 0.25;
    mountain.position.set(
      THREE_NS.MathUtils.randFloatSpread(30),
      1.3,
      -THREE_NS.MathUtils.randFloat(24, 70)
    );
    scene.add(mountain);
  }

  const starGeometry = new THREE_NS.BufferGeometry();
  const starCount = 900;
  const starPositions = new Float32Array(starCount * 3);

  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = THREE_NS.MathUtils.randFloatSpread(90);
    starPositions[index * 3 + 1] = THREE_NS.MathUtils.randFloat(2, 34);
    starPositions[index * 3 + 2] = -THREE_NS.MathUtils.randFloat(10, 120);
  }

  starGeometry.setAttribute("position", new THREE_NS.BufferAttribute(starPositions, 3));

  const stars = new THREE_NS.Points(
    starGeometry,
    new THREE_NS.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.9
    })
  );
  scene.add(stars);

  const carAura = new THREE_NS.Mesh(
    new THREE_NS.SphereGeometry(1.35, 20, 20),
    new THREE_NS.MeshBasicMaterial({
      color: 0xff4fd8,
      transparent: true,
      opacity: 0.08
    })
  );
  carAura.scale.set(1.8, 0.7, 3.4);
  carAura.position.set(0, -0.35, 5.4);
  scene.add(carAura);

  const clock = new THREE_NS.Clock();

  function resizeRenderer() {
    const { clientWidth, clientHeight } = threeLayer;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    const travel = started ? (boosted ? 0.92 : 0.48) : 0;

    laneMarkers.forEach((marker) => {
      marker.position.z += travel;
      if (marker.position.z > 6) {
        marker.position.z = -136;
      }
    });

    edgeRails.forEach((rail) => {
      rail.position.z += travel * 1.12;
      if (rail.position.z > 8) {
        rail.position.z = -136;
      }
    });

    skyline.forEach((tower, index) => {
      tower.position.x = tower.userData.baseX + Math.sin(elapsed * 0.18 + index) * 0.06 + pointer.x * 0.3;
    });

    stars.rotation.y = elapsed * 0.015;
    stars.position.x = pointer.x * 0.9;
    stars.position.y = pointer.y * 0.35;

    carAura.material.opacity = started ? (boosted ? 0.14 : 0.08) : 0.04;
    carAura.scale.z = started ? (boosted ? 4.2 : 3.4) : 2.8;

    camera.position.x += ((pointer.x * 1.2) - camera.position.x) * 0.03;
    camera.position.y += ((4.8 - pointer.y * 0.55) - camera.position.y) * 0.03;
    camera.lookAt(pointer.x * 0.9, 0.1, -14);

    magentaLight.intensity = boosted ? 12 : 9;
    cyanLight.intensity = boosted ? 13 : 10;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resizeRenderer);

  resizeRenderer();
  animate();
}
