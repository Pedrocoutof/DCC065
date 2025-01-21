import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { initRenderer, initCamera, initDefaultBasicLight, setDefaultMaterial } from 'util';
import { buildInterface } from 'ui';
import { World } from 'world';
import GlobalConfig from "./GlobalConfig.js";

let scene = new THREE.Scene();
let renderer = initRenderer('#6EB1FF');
let camera = initCamera(new THREE.Vector3(160, 30, 160));
let material = setDefaultMaterial();
let light = initDefaultBasicLight(scene);
let orbit = new OrbitControls(camera, renderer.domElement);

const world = new World();
world.generate();
scene.add(world);
orbit.target.set(world.getCenterMap().x, 0, world.getCenterMap().z);
scene.fog = new THREE.Fog(0xcccccc, GlobalConfig.fogValue, GlobalConfig.fogValue + 25);

let activeCamera = camera;

// Criando o player - um cubo vermelho
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshLambertMaterial({ color: 'red' });
const player = new THREE.Mesh(playerGeometry, playerMaterial);

// Definindo a posição inicial do player
player.position.set(world.getCenterMap().x, 1, world.getCenterMap().z); // Colocando o player no centro do mapa
scene.add(player);

const speed = 0.5; // Velocidade de movimento do player
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const { stats } = buildInterface((type, value) => {
    if (type === 'fog') {
        scene.fog.near = value;
        scene.fog.far = value + 50;
    }
});

window.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'c':
            toggleCamera();
            break;
        case 'w':
            moveForward = true;
            break;
        case 's':
            moveBackward = true;
            break;
        case 'a':
            moveLeft = true;
            break;
        case 'd':
            moveRight = true;
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
            moveForward = false;
            break;
        case 's':
            moveBackward = false;
            break;
        case 'a':
            moveLeft = false;
            break;
        case 'd':
            moveRight = false;
            break;
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
}

function render() {
    stats.update();
    movePlayer();
    requestAnimationFrame(render);
    renderer.render(scene, activeCamera);
}

function movePlayer() {
    if (moveForward) player.position.z -= speed;
    if (moveBackward) player.position.z += speed;
    if (moveLeft) player.position.x -= speed;
    if (moveRight) player.position.x += speed;
}

render();
