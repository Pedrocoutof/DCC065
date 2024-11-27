import * as THREE from 'three';

const SIZE_X = 35;
const SIZE_Z = 35;
const HEIGHT = 3;

const height_colors = ['green', 'saddlebrown', 'white'];

function distanceBetweenCoordinates(x1, z1, x2, z2) {
    let _x = x1 - x2;
    let _z = z1 - z2;

    return {
        x: Math.abs(_x),
        z: Math.abs(_z),
        xz: Math.sqrt((_x) * (_x) + (_z) * (_z))
    }
}

function distanceFromCenter(x, z) {
    return distanceBetweenCoordinates(x, z, 0, 0);
}

function calculateHeight(x, z) {
    const distance = distanceFromCenter(x, z).x;
    
    return distance <= 4 ? 1 :
            distance <= 13 ? 2 :
            HEIGHT;
}

function generateGroundVoxelStyle() {
    const group = new THREE.Group();

    const voxelSize = 1;
    const halfSizeX = SIZE_X / 2;
    const halfSizeZ = SIZE_Z / 2;

    const voxelGeometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    for (let x = -halfSizeX; x < halfSizeX; x += voxelSize) {
        for (let z = -halfSizeZ; z < halfSizeZ; z += voxelSize) {
            const height = calculateHeight(x, z);

            for (let y = 0; y < height; y++) {
                const voxelMaterial = new THREE.MeshLambertMaterial({ color: height_colors[y] });
                const voxel = new THREE.Mesh(voxelGeometry, voxelMaterial);
                voxel.position.set(x + voxelSize / 2, y * voxelSize, z + voxelSize / 2);
                voxel.castShadow = true;
                voxel.receiveShadow = true;
                group.add(voxel);
            }
        }
    }

    return group;
}

export default { generateGroundVoxelStyle };
