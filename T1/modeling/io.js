
import * as THREE from 'three';
import { generateTrunk } from './voxelTypes.js';


// Função para salvar a cena
export function saveScene(filename, voxels) {
  //console.log(voxels)
    const json = voxels.map((voxel) => {
        // Verifica se o voxel é um tipo especial, como uma árvore
        const voxelData = {
            position: {
                x: voxel.position.x,
                y: voxel.position.y,
                z: voxel.position.z,
            },
            materialProps: voxel.material
                ? { color: voxel.material.color.getHex() }
                : { color: 0xffffff },
        };

        // Verifica o tipo de voxel (árvore ou bloco)
        //console.log(voxel)
        if (voxel.userData && voxel.userData.type === 'tree') {
            voxelData.type = 'tree';
            voxelData.treeName = voxel.userData.name; // Guarda o nome da árvore
        }

        return voxelData;
    });

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'scene.json';
    link.click();
    console.log(`Cena salva como "${filename}"`);
}

// Função para carregar a cena
export function loadScene(file, scene, helpers) {
  const { gridHelper, groundPlane, light } = helpers;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      const loadedVoxels = [];

      json.forEach((voxelData) => {
        if (voxelData.type === "tree") {
          let tree;
          switch (voxelData.treeName) {
            case "tree1":
              tree = createTree1();
              break;
            case "tree2":
              tree = createTree2();
              break;
            case "tree3":
              tree = createTree3();
              break;
            default:
              tree = createTree3();
              break;
          }

          if (tree) {
            tree.position.set(
              voxelData.position.x,
              voxelData.position.y,
              voxelData.position.z
            );
            loadedVoxels.push(tree);
          }
        } else {
          // Carregar blocos normais
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshBasicMaterial(
            voxelData.materialProps || { color: 0xffffff }
          );
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(
            voxelData.position.x,
            voxelData.position.y,
            voxelData.position.z
          );
          loadedVoxels.push(mesh);
        }
      });

      // Limpa e restaura a cena
      scene.clear();
      scene.add(gridHelper);
      scene.add(groundPlane);
      scene.add(light);
      loadedVoxels.forEach((voxel) => scene.add(voxel));

      console.log("Cena carregada com sucesso!");
    } catch (error) {
      console.error("Erro ao carregar a cena:", error);
    }
  };
  reader.readAsText(file);
}

// Configurar GUI com dat.GUI
export function setupGUI(scene, voxels) {
    const gui = new dat.GUI();

    const params = {
        saveFilename: 'scene.json',
        salvarCena: () => {
            saveScene(params.saveFilename, voxels);
        },
        carregarCena: () => {
            loadScene((loadedVoxels) => {
                loadedVoxels.forEach((voxel) => scene.add(voxel));
                voxels.push(...loadedVoxels);
            });
        },
    };

    gui.add(params, 'saveFilename').name('Nome do arquivo');
    gui.add(params, 'salvarCena').name('Salvar Cena');
    gui.add(params, 'carregarCena').name('Carregar Cena');
}


//FUNÇÕES AUXILIARES

// const generateTrunk = () => {
//   const geometry = new THREE.BoxGeometry(1, MAX_HEIGHT, 1);
//   const material = new THREE.MeshBasicMaterial({ color: 'brown' })
//   return new THREE.Mesh(geometry, material);
// };

const createTree1 = () => {
  const group = new THREE.Group();
  group.userData = { type: "tree", name: "tree1" };

  const trunk = generateTrunk();
  trunk.position.y = 1;
  group.add(trunk);

  const foliage = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshBasicMaterial({ color: "green" })
  );
  foliage.position.y = 2;
  group.add(foliage);

  return group;
};

const createTree2 = () => {
  const group = new THREE.Group();
  group.userData = { type: "tree", name: "tree2" };

  const trunk = generateTrunk();
  trunk.position.y = 1;
  group.add(trunk);

  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 4, 6),
    new THREE.MeshBasicMaterial({ color: "forestgreen" })
  );
  foliage.position.y = 3;
  group.add(foliage);

  return group;
};

const createTree3 = () => {
  const group = new THREE.Group();
  group.userData = { type: "tree", name: "tree3" };

  const trunk = generateTrunk();
  trunk.position.y = 1;
  group.add(trunk);

  const foliage1 = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 8, 8),
    new THREE.MeshBasicMaterial({ color: "green" })
  );
  foliage1.position.y = 2;
  group.add(foliage1);

  const foliage2 = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshBasicMaterial({ color: "forestgreen" })
  );
  foliage2.position.y = 3.5;
  group.add(foliage2);

  return group;
};