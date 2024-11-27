import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { controls } from 'ui';
import { saveScene, loadScene } from 'io';
import { 
    initRenderer, 
    initCamera,
    createGroundPlaneXZ,
    initDefaultBasicLight
} from 'util';
import voxelTypes from './voxelTypes.js';

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

const gridHelper = new THREE.GridHelper(SIZE_X, SIZE_Z, 'grey', 'darkgrey');
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

    if (typeof voxelTypes[currentVoxelType].createWireframe === 'function') {
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
    if (typeof voxelTypes[currentVoxelType].create === 'function') {
        voxel = voxelTypes[currentVoxelType].create();
        voxel.isGroup = true;
    } else {
        voxel = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            voxelTypes[currentVoxelType].meshBasicMaterial
        );
        const wireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(voxel.geometry),
            voxelTypes[currentVoxelType].wireframe
        );
        voxel.add(wireframe);
    }

    voxel.position.set(position.x, position.y, position.z);
    scene.add(voxel);
    voxels.push(voxel);
}

function removeVoxel() {
    const voxel = voxels.find(v => {
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
        voxels = voxels.filter(v => v !== voxel);
    }
}

document.addEventListener('keydown', function(event) {
    switch (event.code) {
        case 'ArrowUp':
            position.z - 1 >= -SIZE_Z/2 ? position.z -= 1 : null;
            break;
        case 'ArrowDown':
            position.z + 1 <= SIZE_Z/2 ? position.z += 1 : null;
            break;
        case 'ArrowLeft':
            position.x - 1 >= -SIZE_X/2 ? position.x -= 1 : null;
            break;
        case 'ArrowRight':
            position.x + 1 <= SIZE_X/2 ? position.x += 1 : null;
            break;
        case 'Equal':
            position.y + 1 <= SIZE_Y ? position.y += 1 : null;
            break;
        case 'Minus':
            position.y - 1 >= 0 ? position.y -= 1 : null;
            break;
        case 'KeyQ':
            addVoxel();
            break;
        case 'KeyE':
            removeVoxel();
            break;
        case 'Period':
            currentVoxelType = (currentVoxelType + 1) % voxelTypes.length;
            updateWireframePreview();
            break;
        case 'Comma':
            currentVoxelType = (currentVoxelType - 1 + voxelTypes.length) % voxelTypes.length;
            updateWireframePreview();
            break;
        case 'KeyS':
            saveScene('scene.json', voxels);
            break;
        case 'KeyL':
            loadScene((newScene, loadedVoxels) => {
                scene.clear();
        
                scene.add(gridHelper);
                scene.add(groundPlane);
                scene.add(light);
                light = initDefaultBasicLight(scene);

                loadedVoxels.forEach((voxel) => {
                    scene.add(voxel);
                });
        
                voxels = loadedVoxels;
        
                wireframePreview = new THREE.Group();
                scene.add(wireframePreview);
                updateWireframePreview();
            });
            break;
    }
    updateWireframePreviewPosition();
});

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

render();
