import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const sceneFrame = document.getElementById("sceneFrame");
const threeLayer = document.getElementById("threeLayer");
const launchButton = document.getElementById("launchButton");
const boostButton = document.getElementById("boostButton");
const stopButton = document.getElementById("stopButton");
const soundButton = document.getElementById("soundButton");
const speedReadout = document.getElementById("speedReadout");
const modeReadout = document.getElementById("modeReadout");
const audioReadout = document.getElementById("audioReadout");
const bgMusic = document.getElementById("bgMusic");

const state = {
  started: false,
  boosted: false,
  musicPlaying: false,
  speed: 0,
  targetSpeed: 0,
  pointerX: 0,
  pointerY: 0
};

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x080a11, 18, 58);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
camera.position.set(0, 3.9, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
threeLayer.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfbf2df, 2.4);
keyLight.position.set(6, 10, 8);
scene.add(keyLight);

const cyanLight = new THREE.PointLight(0x64f2ff, 20, 60, 2);
cyanLight.position.set(-6, 4, 10);
scene.add(cyanLight);

const roseLight = new THREE.PointLight(0xff6f8f, 18, 56, 2);
roseLight.position.set(8, 3, 7);
scene.add(roseLight);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 180),
  new THREE.MeshStandardMaterial({
    color: 0x10131b,
    roughness: 0.86,
    metalness: 0.08,
    emissive: 0x080d16,
    emissiveIntensity: 0.55
  })
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, -1.48, -58);
scene.add(road);

const laneMarkers = [];
const laneMaterial = new THREE.MeshBasicMaterial({ color: 0x64f2ff });
for (let index = 0; index < 36; index += 1) {
  const marker = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 2.8), laneMaterial);
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(0, -1.46, -index * 5.2);
  scene.add(marker);
  laneMarkers.push(marker);
}

const railMaterial = new THREE.MeshBasicMaterial({ color: 0xf8c86a });
const rails = [];
[-5.4, 5.4].forEach((x) => {
  for (let index = 0; index < 30; index += 1) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 3.2), railMaterial);
    rail.position.set(x, -1.08, -index * 6);
    scene.add(rail);
    rails.push(rail);
  }
});

const skyline = [];
const skylineMaterial = new THREE.MeshStandardMaterial({
  color: 0x172133,
  emissive: 0x1d3854,
  emissiveIntensity: 0.75,
  roughness: 0.66,
  metalness: 0.2
});
for (let index = 0; index < 48; index += 1) {
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(
      THREE.MathUtils.randFloat(0.7, 1.8),
      THREE.MathUtils.randFloat(2.6, 8.6),
      THREE.MathUtils.randFloat(0.7, 1.6)
    ),
    skylineMaterial
  );
  const side = index % 2 === 0 ? -1 : 1;
  tower.position.set(
    side * THREE.MathUtils.randFloat(7.5, 16),
    tower.geometry.parameters.height / 2 - 1.4,
    -THREE.MathUtils.randFloat(8, 95)
  );
  tower.userData.baseX = tower.position.x;
  scene.add(tower);
  skyline.push(tower);
}

const starsGeometry = new THREE.BufferGeometry();
const stars = new Float32Array(1100 * 3);
for (let index = 0; index < 1100; index += 1) {
  stars[index * 3] = THREE.MathUtils.randFloatSpread(120);
  stars[index * 3 + 1] = THREE.MathUtils.randFloat(6, 36);
  stars[index * 3 + 2] = -THREE.MathUtils.randFloat(8, 150);
}
starsGeometry.setAttribute("position", new THREE.BufferAttribute(stars, 3));
const starField = new THREE.Points(
  starsGeometry,
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    transparent: true,
    opacity: 0.9
  })
);
scene.add(starField);

const underGlow = new THREE.Mesh(
  new THREE.CircleGeometry(2.7, 32),
  new THREE.MeshBasicMaterial({
    color: 0x64f2ff,
    transparent: true,
    opacity: 0.16
  })
);
underGlow.rotation.x = -Math.PI / 2;
underGlow.position.set(0, -1.4, 6.1);
scene.add(underGlow);

const loader = new GLTFLoader();
let carModel = null;

loader.load(
  "assets/sports-car.glb",
  (gltf) => {
    carModel = gltf.scene;
    carModel.scale.set(1.75, 1.75, 1.75);
    carModel.position.set(0, -1.15, 6.2);
    carModel.rotation.y = Math.PI;

    carModel.traverse((child) => {
      if (!child.isMesh) {
        return;
      }
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material && "roughness" in child.material) {
        child.material.roughness = 0.55;
        child.material.metalness = 0.25;
      }
    });

    scene.add(carModel);
  },
  undefined,
  () => {
    modeReadout.textContent = "Model Error";
  }
);

function resizeScene() {
  const width = threeLayer.clientWidth;
  const height = threeLayer.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateUi() {
  state.targetSpeed = state.started ? (state.boosted ? 248 : 154) : 0;
  boostButton.textContent = state.boosted ? "Cruise" : "Boost";
  soundButton.textContent = state.musicPlaying ? "Pause Music" : "Play Music";
  modeReadout.textContent = state.started ? (state.boosted ? "Hyper" : "Cruising") : "Idle";
  audioReadout.textContent = state.musicPlaying ? "Playing" : "Muted";
  sceneFrame.classList.toggle("is-running", state.started);
}

async function toggleMusic(forcePlay) {
  const shouldPlay = typeof forcePlay === "boolean" ? forcePlay : !state.musicPlaying;

  if (!shouldPlay) {
    bgMusic.pause();
    state.musicPlaying = false;
    updateUi();
    return;
  }

  try {
    await bgMusic.play();
    state.musicPlaying = true;
  } catch (error) {
    state.musicPlaying = false;
  }
  updateUi();
}

function launchScene() {
  state.started = true;
  sceneFrame.style.animation = "scenePulse 640ms ease";
  window.setTimeout(() => {
    sceneFrame.style.animation = "";
  }, 700);
  updateUi();
}

function stopScene() {
  state.started = false;
  state.boosted = false;
  updateUi();
}

function onPointerMove(event) {
  const bounds = sceneFrame.getBoundingClientRect();
  state.pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
  state.pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  sceneFrame.style.transform = `rotateX(${state.pointerY * -4}deg) rotateY(${state.pointerX * 5}deg)`;
}

function onPointerLeave() {
  state.pointerX = 0;
  state.pointerY = 0;
  sceneFrame.style.transform = "rotateX(0deg) rotateY(0deg)";
}

launchButton.addEventListener("click", () => {
  launchScene();
  if (!state.musicPlaying) {
    toggleMusic(true);
  }
});

boostButton.addEventListener("click", () => {
  state.started = true;
  state.boosted = !state.boosted;
  updateUi();
});

stopButton.addEventListener("click", stopScene);
soundButton.addEventListener("click", () => {
  toggleMusic();
});

sceneFrame.addEventListener("pointermove", onPointerMove);
sceneFrame.addEventListener("pointerleave", onPointerLeave);
window.addEventListener("resize", resizeScene);

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  const travel = state.started ? (state.boosted ? 1.1 : 0.48) : 0;

  state.speed += (state.targetSpeed - state.speed) * 0.045;
  speedReadout.textContent = `${String(Math.round(state.speed)).padStart(3, "0")} KM/H`;

  laneMarkers.forEach((marker) => {
    marker.position.z += travel;
    if (marker.position.z > 10) {
      marker.position.z = -180;
    }
  });

  rails.forEach((rail) => {
    rail.position.z += travel * 1.15;
    if (rail.position.z > 12) {
      rail.position.z = -180;
    }
  });

  skyline.forEach((tower, index) => {
    tower.position.x = tower.userData.baseX + Math.sin(elapsed * 0.18 + index) * 0.03 + state.pointerX * 0.25;
  });

  starField.rotation.y = elapsed * 0.02;
  starField.position.x = state.pointerX * 0.7;
  starField.position.y = state.pointerY * 0.25;

  underGlow.material.opacity = state.started ? (state.boosted ? 0.28 : 0.18) : 0.08;
  underGlow.scale.setScalar(state.started ? (state.boosted ? 1.2 : 1.05) : 1);

  if (carModel) {
    carModel.position.y = -1.15 + Math.sin(elapsed * 3.4) * (state.started ? 0.06 : 0.02);
    carModel.position.x = Math.sin(elapsed * 1.5) * (state.started ? 0.1 : 0.02) + state.pointerX * 0.08;
    carModel.rotation.z = Math.sin(elapsed * 2.2) * (state.started ? 0.014 : 0.004);
    carModel.rotation.x = Math.cos(elapsed * 2.8) * (state.started ? 0.012 : 0.004);
    carModel.rotation.y = Math.PI + state.pointerX * -0.08;
  }

  cyanLight.intensity = state.boosted ? 24 : 18;
  roseLight.intensity = state.boosted ? 21 : 16;

  camera.position.x += ((state.pointerX * 1.1) - camera.position.x) * 0.03;
  camera.position.y += ((3.9 - state.pointerY * 0.45) - camera.position.y) * 0.03;
  camera.position.z += (((state.boosted ? 12.5 : 14) - camera.position.z)) * 0.03;
  camera.lookAt(state.pointerX * 0.8, -0.6, -8);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

resizeScene();
updateUi();
animate();
