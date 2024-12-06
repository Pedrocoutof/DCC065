import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import groundGenerator from 'groundGenerator';
import MovementHandler from 'movementHandler';
import { initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox } from 'util';
import { buildInterface } from 'ui';
import CONSTS from 'consts';

let scene, renderer, camera, material, light, orbit;

scene = new THREE.Scene();
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 15, 30));
material = setDefaultMaterial();
light = initDefaultBasicLight(scene);
orbit = new OrbitControls(camera, renderer.domElement);

let firstPersonCamera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1 );

let activeCamera = camera;

let firstPersonCameraVerticalRotation = 0;
let firstPersonCameraHorizontalRotation = 0;

window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'c') {
        if (activeCamera === camera) {
            activeCamera = firstPersonCamera;
            orbit.enabled = false;
            document.body.requestPointerLock(); // função para travar e esconder o mouse no centro da página/elemento
            firstPersonCameraVerticalRotation = cube.rotation.y;
            firstPersonCameraHorizontalRotation = 0;
        } else {
            activeCamera = camera;
            orbit.enabled = true;
            document.exitPointerLock();
        }
    }
});

document.addEventListener('pointerlockchange', onPointerLockChange, false);

function onPointerLockChange() {
    if (document.pointerLockElement === document.body) {
        document.addEventListener('mousemove', onMouseMove, false);
    } else {
        document.removeEventListener('mousemove', onMouseMove, false);
    }
}

function onMouseMove(event) {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    const sensitivity = 0.002;

    firstPersonCameraVerticalRotation -= movementX * sensitivity;
    firstPersonCameraHorizontalRotation -= movementY * sensitivity;

    const maxfirstPersonCameraHorizontalRotation = Math.PI / 2 - 0.1;
    const minfirstPersonCameraHorizontalRotation = -Math.PI / 2 + 0.1;

    firstPersonCameraHorizontalRotation = Math.max(minfirstPersonCameraHorizontalRotation, Math.min(maxfirstPersonCameraHorizontalRotation, firstPersonCameraHorizontalRotation));
}

let axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);

let groundPlane = groundGenerator.generateGroundVoxelStyle();
scene.add(groundPlane);

let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
let cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

cube.position.set(0.0, 1, 0.0);
scene.add(cube);

function isFirstPerson() {
    return activeCamera === firstPersonCamera;
}

let movementHandler = new MovementHandler(cube, firstPersonCamera, isFirstPerson);

let controls = new InfoBox();
controls.add("Basic Scene");
controls.addParagraph();
controls.add("Use o mouse para interagir:");
controls.add("* Botão esquerdo para rotacionar");
controls.add("* Botão direito para transladar (pan)");
controls.add("* Scroll para aproximar/afastar.");
controls.addParagraph();
controls.add("Movimente o bloco vermelho com WASD:");
controls.add("* W: para frente");
controls.add("* S: para trás");
controls.add("* A: para esquerda");
controls.add("* D: para direita");
controls.show();

function render() {
    movementHandler.handleMovement();

    if (activeCamera === firstPersonCamera) {
        firstPersonCamera.position.copy(cube.position);
        firstPersonCamera.position.y += 0.5

        firstPersonCamera.rotation.order = 'YXZ';
        firstPersonCamera.rotation.y = firstPersonCameraVerticalRotation;
        firstPersonCamera.rotation.x = firstPersonCameraHorizontalRotation;
    }

    requestAnimationFrame(render);
    renderer.render(scene, activeCamera);
}

function buildModeling(data, basePosition) {
    data.forEach(voxelData => {
        const geometry = new THREE.BoxGeometry(
            voxelData.additionalData.width,
            voxelData.additionalData.height,
            voxelData.additionalData.depth
        );

        const voxelMaterial = setDefaultMaterial(
            voxelData.materialProps.color || 0xffffff
        );

        const mesh = new THREE.Mesh(geometry, voxelMaterial);
        
        mesh.position.set(
            voxelData.position.x + basePosition.x,
            voxelData.position.y + basePosition.y,
            voxelData.position.z + basePosition.z
        );

        scene.add(mesh);
    });
}

async function buildAssets() {

    const height = 1;

    const basePositions = [
        new THREE.Vector3(12, height, 10),
        new THREE.Vector3(-6, height, 10),

        new THREE.Vector3(10, height, 0),
        new THREE.Vector3(-6, height, 0),

        new THREE.Vector3(6, height, -10),
        new THREE.Vector3(-12, height, -10),
    ];

    try {
        const treeDataArray = await Promise.all(
            CONSTS.assetsPath.three.filesName.map(file => fetch("./assets/" + file).then(response => {
                if (!response.ok) {
                    throw new Error(`${file}: ${response.statusText}`);
                }
                return response.json();
            }))
        );

        basePositions.forEach((basePosition, index) => {
            const assetIndex = index % treeDataArray.length;
            let treeData = treeDataArray[assetIndex];
            buildModeling(treeData, basePosition);
        });

    } catch (error) {
        console.error(error);
    }
}

buildAssets().then(() => {
    render();
});