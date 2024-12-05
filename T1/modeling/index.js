import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { controls } from "ui";
import { saveScene, loadScene } from "io";
import {
  initRenderer,
  initCamera,
  createGroundPlaneXZ,
  initDefaultBasicLight,
  setDefaultMaterial,
} from "util";
import voxelTypes from "./voxelTypes.js";
import GUI from "../../libs/util/dat.gui.module.js";

const SIZE_X = 10;
const SIZE_Z = 10;
const SIZE_Y = 10;

let scene, renderer, camera, light, orbit;
let currentVoxelType = 0;
let position = new THREE.Vector3(0.5, 0.5, 0.5);
let voxels = [];
let sphereObjects = [];

scene = new THREE.Scene();
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(4, 8, 15));
light = initDefaultBasicLight(scene);
orbit = new OrbitControls(camera, renderer.domElement);

const gridHelper = new THREE.GridHelper(SIZE_X, SIZE_Z, "grey", "darkgrey");
scene.add(gridHelper);

const groundPlane = createGroundPlaneXZ(SIZE_X, SIZE_Z);
scene.add(groundPlane);

let wireframePreview = new THREE.Group();

scene.add(wireframePreview);
updateWireframePreview();

function updateWireframePreviewPosition() {
  wireframePreview.position.set(position.x, position.y, position.z);
  refreshWireframeReference(wireframePreview);
}

function updateWireframePreview() {
  if (wireframePreview.parent) {
    wireframePreview.parent.remove(wireframePreview);
  }

  wireframePreview = new THREE.Group();
  let objCurrentVoxel = voxelTypes[currentVoxelType];

  const wireframeGeometry = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(
      objCurrentVoxel.width,
      objCurrentVoxel.height,
      objCurrentVoxel.depth
    )
  );
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: objCurrentVoxel.color,
  });
  const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

  wireframePreview.add(wireframe);

  scene.add(wireframePreview);
  updateWireframePreviewPosition();
}

function refreshWireframeReference(wireframe) {
  sphereObjects.forEach(sphere => scene.remove(sphere));
  sphereObjects = [];

  const radius = 0.1;
  const segments = 16;
  const sphereGeometry = new THREE.SphereGeometry(radius, segments, segments);
  const sphereMaterial = new setDefaultMaterial("red");

  for (let i = 1; i <= wireframe.position.y; i++) {
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(position.x, position.y - i - 0.5, position.z);
    scene.add(sphere);
    sphereObjects.push(sphere);
  }
}

function addVoxel() {
  let objCurrentVoxel = voxelTypes[currentVoxelType];

  const voxelGeometry = new THREE.BoxGeometry(
    objCurrentVoxel.width,
    objCurrentVoxel.height,
    objCurrentVoxel.depth
  );
  const voxelMaterial = setDefaultMaterial(objCurrentVoxel.color);

  const voxel = new THREE.Mesh(voxelGeometry, voxelMaterial);

  voxel.position.set(position.x, position.y, position.z);
  voxel.additionalData = objCurrentVoxel;
  console.log(voxel);
  scene.add(voxel);
  voxels.push(voxel);

  updateWireframePreviewPosition(); 
}

function refreshWireframePreview() {
  wireframePreview = new THREE.Group();
  scene.add(wireframePreview);
  updateWireframePreview();
}

function simulateKeyPress(keyCode) {
  const event = new KeyboardEvent("keydown", { code: keyCode });
  document.dispatchEvent(event);
}

function removeVoxel() {
  const voxel = voxels.find((v) => {
    return (
      v.position.x === position.x &&
      v.position.y === position.y &&
      v.position.z === position.z
    );
  });

  if (voxel) {
    scene.remove(voxel);
    voxels = voxels.filter((v) => v !== voxel);
  }

  updateWireframePreviewPosition(); 
}

document.addEventListener("keydown", function (event) {
  switch (event.code) {
    case "ArrowUp":
      position.z - 1 >= -SIZE_Z / 2 ? (position.z -= 1) : null;
      break;
    case "ArrowDown":
      position.z + 1 <= SIZE_Z / 2 ? (position.z += 1) : null;
      break;
    case "ArrowLeft":
      position.x - 1 >= -SIZE_X / 2 ? (position.x -= 1) : null;
      break;
    case "ArrowRight":
      position.x + 1 <= SIZE_X / 2 ? (position.x += 1) : null;
      break;
    case "Equal": // Tecla '+'
      position.y + 1 <= SIZE_Y ? (position.y += 1) : null;
      break;
    case "Minus": // Tecla '-'
      position.y - 1 >= 0 ? (position.y -= 1) : null;
      break;
    case "Numpad9": // Tecla 'Page Up'
      position.y + 1 <= SIZE_Y ? (position.y += 1) : null;
      break;
    case "Numpad3": // Tecla 'Page Down'
      position.y - 1 >= 0 ? (position.y -= 1) : null;
      break;
    case "KeyQ":
      addVoxel();
      break;
    case "KeyE":
      removeVoxel();
      break;
    case "Period":
      currentVoxelType = (currentVoxelType + 1) % voxelTypes.length;
      updateWireframePreview();
      break;
    case "Comma":
      currentVoxelType =
        (currentVoxelType - 1 + voxelTypes.length) % voxelTypes.length;
      updateWireframePreview();
      break;
    case "KeyS":
      saveScene("scene.json");
      break;
    case "KeyL":
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const helpers = { gridHelper, groundPlane, light };
          loadScene(file, scene, helpers);
        }
      });

      input.click();
      break;
  }
  updateWireframePreviewPosition();
});

function buildInterface() {
  let gui = new GUI();
  gui
    .add(
      {
        loadScene: () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";

          input.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
              const helpers = { gridHelper, groundPlane, light };
              loadScene(file, scene, helpers); 
              refreshWireframePreview();
              simulateKeyPress("Comma");
            }
          });

          input.click();
        },
      },
      "loadScene"
    )
    .name("Carregar Cena");

  gui
    .add(
      {
        saveScene: () => {
          saveScene("scene.json", voxels);
        },
      },
      "saveScene"
    )
    .name("Salvar Cena");
}

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

buildInterface();
render();
