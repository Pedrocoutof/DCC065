import * as THREE from 'three';
import CONSTS from 'consts';

const SIZE_X = CONSTS.ground.width;
const SIZE_Z = CONSTS.ground.depth;
const HEIGHT = CONSTS.ground.height;

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
    const amplitude = 3;
    const frequency = (2 * Math.PI) / SIZE_Z;
    const valleyCenter = amplitude * Math.sin(frequency * z);

    const distance = Math.abs(x - valleyCenter);
    console.log(distance);

    return distance < 3 ? 1 :
        distance < 12 ? 2 :
        3;

    // const maxDistance = 10;

    // const normalizedDistance = Math.min(distance / maxDistance, 1);

    // const exponent = 0.5;
    // const height = 1 + (HEIGHT - 1) * Math.pow(Math.cos(normalizedDistance * (Math.PI / 2)), exponent);
    
    // return (HEIGHT + 1) - Math.max(Math.round(height), 1);
}

function generateGroundVoxelStyle() {
    const group = new THREE.Group();

    const halfSizeX = SIZE_X / 2;
    const halfSizeZ = SIZE_Z / 2;

    const voxelSize = 1;
    const voxelGeometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    for (let x = -halfSizeX; x < halfSizeX; x += voxelSize) {
        for (let z = -halfSizeZ; z < halfSizeZ; z += voxelSize) {
            const height = calculateHeight(x, z);

            for (let y = 0; y < height; y++) {
                const voxelMaterial = new THREE.MeshToonMaterial({ color: height_colors[y] });
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
