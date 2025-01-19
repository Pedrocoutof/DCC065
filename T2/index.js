import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial } from 'util';
import { buildInterface } from 'ui';
import { World } from 'world';
import GlobalConfig from "./GlobalConfig.js";

let scene = new THREE.Scene();
let renderer = initRenderer();
let camera = initCamera(new THREE.Vector3(160, 30, 160));
let material = setDefaultMaterial();
let light = initDefaultBasicLight(scene);
let orbit = new OrbitControls(camera, renderer.domElement);

const world = new World();
world.generate();
scene.add(world);
scene.fog = new THREE.Fog( 0xcccccc, GlobalConfig.fogValue, GlobalConfig.fogValue + 25 );

let firstPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1);
let activeCamera = camera;

let firstPersonCameraVerticalRotation = 0;
let firstPersonCameraHorizontalRotation = 0;

const { stats } = buildInterface((type, value) => {
    if (type === 'fog') {
        scene.fog.near = value;
        scene.fog.far = value + 50;
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'c') {
        if (activeCamera === camera) {
            activeCamera = firstPersonCamera;
            orbit.enabled = false;
            document.body.requestPointerLock(); 
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

    const maxRotation = Math.PI / 2 - 0.1;
    const minRotation = -Math.PI / 2 + 0.1;
    firstPersonCameraHorizontalRotation = Math.max(minRotation, Math.min(maxRotation, firstPersonCameraHorizontalRotation));
}

function render() {
    if (activeCamera === firstPersonCamera) {
        firstPersonCamera.position.copy(world.position);  // Usa a posição do mundo para a câmera
        firstPersonCamera.position.y += 0.5;
        firstPersonCamera.rotation.order = 'YXZ';
        firstPersonCamera.rotation.y = firstPersonCameraVerticalRotation;
        firstPersonCamera.rotation.x = firstPersonCameraHorizontalRotation;
    }

    stats.update();

    requestAnimationFrame(render);
    renderer.render(scene, activeCamera);
}

render();
