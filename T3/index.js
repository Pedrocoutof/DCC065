import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { initRenderer, initCamera } from 'util';
import { buildInterface } from 'ui';
import { World } from 'world';
import GlobalConfig from "./GlobalConfig.js";
import Player from "./Player.js";

// Referência à tela de loading
const loadingScreen = document.getElementById('loading-screen');

// Função para esconder a tela de loading
function hideLoadingScreen() {
    loadingScreen.classList.add('hidden');
}

// Função para carregar recursos
async function loadResources() {
    const textureLoader = new THREE.TextureLoader();
    await textureLoader.loadAsync('./assets/grass.jpg');
    await textureLoader.loadAsync('./assets/ground.jpg');
    await textureLoader.loadAsync('./assets/water.jpg');
    hideLoadingScreen();
}

// Inicializa o jogo após carregar os recursos
async function init() {
    await loadResources();

    let scene = new THREE.Scene();
    let renderer = initRenderer('#6EB1FF', THREE.PCFSoftShadowMap);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xa19c75);
    scene.add(ambientLight);

    let camera = initCamera(new THREE.Vector3(160, 30, 160));
    let orbit = new OrbitControls(camera, renderer.domElement);

    const world = new World(scene); // Passa a cena como parâmetro
    world.generate();
    scene.add(world);
    orbit.target.set(world.getCenterMap().x, 0, world.getCenterMap().z);

    const player = new Player(world);
    scene.add(player);
    player.loadModel(
        world.getCenterMap().x,
        world.getCenterMap().z,
        world.getHeightByXZ(world.getCenterMap().x, world.getCenterMap().z)
    );

    let activeCamera = camera;

    const { stats } = buildInterface((type, value) => {
        if (type === 'fog') {
            scene.fog.near = value;
            scene.fog.far = value + 30;
            player.changeShadowMapVolume(value);
        }
    });

    window.addEventListener('keydown', (event) => {
        switch (event.key.toLowerCase()) {
            case 'f': // Adiciona o controle do fog com a tecla 'F'
                world.toggleFog();
                break;
            case 'c':
                toggleCamera();
                break;
            case 'y':
                player.toggleYInversion();
                break;
            case 'h':
                player.toggleShadowHelperVisibility();
                break;
            case 'q':
                toggleBackgroundMusic();
                break;
            default:
                player.handleKeyDown(event.key);
                break;
        }
    });

    window.addEventListener('mousedown', (event) => {
        switch (event.button) {
            case 0:
                if (activeCamera === player.thirdPersonCamera) {
                    player.handleMouseClick();
                }
                break;
            case 2:
                player.jump();
                break;
        }
    });

    window.addEventListener('keyup', (event) => {
        player.handleKeyUp(event.key);
    });

    document.addEventListener('pointerlockchange', onPointerLockChange, false);

    function toggleCamera() {
        if (activeCamera === camera) {
            activeCamera = player.thirdPersonCamera;
            orbit.enabled = false;
            document.body.requestPointerLock();
        } else {
            activeCamera = camera;
            orbit.enabled = true;
            document.exitPointerLock();
        }
    }

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
        player.updateCameraRotation(movementX, movementY);
    }

    const audioLoader = new THREE.AudioLoader();
    const listener = new THREE.AudioListener();
    const backgroundMusic = new THREE.Audio(listener);

    audioLoader.load('./assets/music.mp3', (buffer) => {
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setLoop(true);
        backgroundMusic.setVolume(0.5);
        backgroundMusic.play();
    });

    function toggleBackgroundMusic() {
        if (backgroundMusic.isPlaying) {
            backgroundMusic.pause();
        } else {
            backgroundMusic.play();
        }
    }

    function render() {
        player.update();
        stats.update();
        requestAnimationFrame(render);
        renderer.render(scene, activeCamera);
    }

    render();
}

init();