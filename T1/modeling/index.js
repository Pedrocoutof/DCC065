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
let textLabel;
scene.add(wireframePreview);
updateWireframePreview();

function updateWireframePreviewPosition() {
  wireframePreview.position.set(position.x, position.y, position.z);
  updateTextLabel();
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

  updateTextLabel();
  scene.add(wireframePreview);
  updateWireframePreviewPosition();
}

function updateTextLabel() {
  if (textLabel && textLabel.parent) {
    textLabel.parent.remove(textLabel);
  }
  const positionText = `x: ${position.x - 0.5}, y: ${position.y - 0.5}, z: ${position.z - 0.5}, name: ${voxelTypes[currentVoxelType].name}`;
  textLabel = makeTextSprite(positionText);

  const bbox = new THREE.Box3().setFromObject(wireframePreview);
  const size = bbox.getSize(new THREE.Vector3());
  textLabel.position.set(0, size.y + 0.1, 0);

  wireframePreview.add(textLabel);
}

function makeTextSprite(message) {
  let fontface = "Arial";
  let fontsize = 18;
  let borderThickness = 10;

  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d");
  context.font = "Bold " + fontsize + "px " + fontface;

  // Medir o texto
  let metrics = context.measureText(message);
  let textWidth = metrics.width;

  // Configurar o canvas
  canvas.width = textWidth + borderThickness * 2;
  canvas.height = fontsize * 1.4 + borderThickness * 2;
  context.font = "Bold " + fontsize + "px " + fontface;

  // Fundo e borda
  context.fillStyle = 'rgb(255,255,255)';
  context.lineWidth = borderThickness;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeRect(0, 0, canvas.width, canvas.height);

  // Texto
  context.fillStyle = "rgba(0, 0, 0, 1.0)";
  context.fillText(message, borderThickness, fontsize + borderThickness);

  // Criar textura e Sprite
  let texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  let spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  let sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(canvas.width / 100, canvas.height / 100, 1);
  return sprite;
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

  // Adiciona a opção "Carregar Cena"
  gui
    .add(
      {
        loadScene: () => {
          // Cria o seletor de arquivos
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";

          input.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
              const helpers = { gridHelper, groundPlane, light };
              loadScene(file, scene, helpers); // Chama a função loadScene passando os parâmetros necessários
              refreshWireframePreview();
              simulateKeyPress("Comma");
            }
          });

          input.click(); // Simula o clique no seletor de arquivos
        },
      },
      "loadScene"
    )
    .name("Carregar Cena");

  // Adiciona a opção "Salvar Cena"
  gui
    .add(
      {
        saveScene: () => {
          saveScene("scene.json", voxels); // Chama a função saveScene diretamente
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
