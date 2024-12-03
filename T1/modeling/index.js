import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { controls } from "ui";
import { generateTrunk, createWireframe } from "./voxelTypes.js";
import { saveScene, loadScene } from "io";
import {
  initRenderer,
  initCamera,
  createGroundPlaneXZ,
  initDefaultBasicLight,
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
scene.add(wireframePreview);
updateWireframePreview();

function updateWireframePreviewPosition() {
  wireframePreview.position.set(position.x, position.y, position.z);
}

function updateWireframePreview() {
  if (wireframePreview.parent) {
    wireframePreview.parent.remove(wireframePreview);
  }

  wireframePreview = new THREE.Group();

  if (typeof voxelTypes[currentVoxelType].createWireframe === "function") {
    const groupWireframe = voxelTypes[currentVoxelType].createWireframe();
    wireframePreview.add(groupWireframe);
  } else {
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      voxelTypes[currentVoxelType].wireframe
    );
    wireframePreview.add(wireframe);
  }

  scene.add(wireframePreview);
  updateWireframePreviewPosition();
}

function addVoxel() {
  let voxel;

  // Verifica se o tipo atual é uma entidade complexa (como uma árvore)
  if (typeof voxelTypes[currentVoxelType].create === "function") {
    voxel = voxelTypes[currentVoxelType].create();
    voxel.isGroup = true;

    // Adiciona informações adicionais ao userData para árvores
    voxel.userData = {
      type: "tree",
      name: voxelTypes[currentVoxelType].name, // Salva o tipo de árvore (tree1, tree2, etc.)
    };
  } else {
    // Criação de voxel padrão (um bloco)
    voxel = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      voxelTypes[currentVoxelType].meshBasicMaterial
    );

    // Adiciona a wireframe ao voxel padrão
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(voxel.geometry),
      voxelTypes[currentVoxelType].wireframe
    );
    voxel.add(wireframe);

    // Adiciona informações adicionais ao userData para blocos
    voxel.userData = {
      type: "block",
      name: voxelTypes[currentVoxelType].name, // Salva o tipo de voxel (v1, v2, etc.)
    };
  }

  // Posiciona o voxel na cena
  voxel.position.set(position.x, position.y, position.z);

  // Adiciona o voxel à cena
  scene.add(voxel);

  // Salva o voxel no array global para gerenciamento
  voxels.push(voxel);
}
// Atualize o wireframe após o carregamento da cena
function refreshWireframePreview() {
  wireframePreview = new THREE.Group(); // Cria um novo grupo vazio
  scene.add(wireframePreview);
  updateWireframePreview(); // Reaplica o wireframe com base no tipo atual
}

function simulateKeyPress(keyCode) {
  const event = new KeyboardEvent("keydown", { code: keyCode });
  document.dispatchEvent(event);
}


function removeVoxel() {
  const voxel = voxels.find((v) => {
    if (v.isGroup) {
      return (
        v.position.x === position.x &&
        v.position.y === position.y &&
        v.position.z === position.z
      );
    } else {
      return (
        v.position.x === position.x &&
        v.position.y === position.y &&
        v.position.z === position.z
      );
    }
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
