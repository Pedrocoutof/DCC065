
import * as THREE from 'three';
import voxelTypes from './voxelTypes.js';
import { setDefaultMaterial } from "util";


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

        if (voxel.additionalData) {
            voxelData.additionalData = voxel.additionalData
        }

        console.log(voxelData);
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
          const geometry = new THREE.BoxGeometry(
            voxelData.additionalData.width,
            voxelData.additionalData.height,
            voxelData.additionalData.depth
          );

          const material = new setDefaultMaterial(
            voxelData.materialProps.color ||  0xffffff
          );

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(
            voxelData.position.x,
            voxelData.position.y,
            voxelData.position.z
          );
          loadedVoxels.push(mesh);
      });

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