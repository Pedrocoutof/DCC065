import * as THREE from 'three';

export function saveScene(filename, voxels) {
    console.log('Salvar cena...');

    const json = voxels.map((voxel) => ({
        position: voxel.position,
        materialProps: voxel.material ? { color: voxel.material.color.getHex() } : {},
    }));

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

export function selectFile(callback) {
    const input = document.createElement('input');
    input.type = 'file';

    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    const scene = new THREE.Scene();

                    console.log('Dados carregados:', json);

                    if (callback) callback(scene, json);
                } catch (error) {
                    console.error('Erro ao carregar o arquivo:', error);
                }
            };
            reader.readAsText(file);
        }
    });

    input.click();
}

export function loadScene(callback) {
    console.log('Carregando cena...');

    selectFile((_, json) => {
        const loadedVoxels = [];

        json.forEach((voxelData) => {
            try {
                const geometry = new THREE.BoxGeometry(1, 1, 1); // Baseado no tipo do voxel
                const material = new THREE.MeshBasicMaterial(voxelData.materialProps || { color: 0xffffff });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(voxelData.position.x, voxelData.position.y, voxelData.position.z);

                loadedVoxels.push(mesh);
            } catch (error) {
                console.error('Erro ao reconstruir voxel:', voxelData, error);
            }
        });

        if (callback) callback(null, loadedVoxels);
    });
}
