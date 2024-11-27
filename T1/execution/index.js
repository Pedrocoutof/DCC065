import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import groundGenerator from 'groundGenerator';
import MovementHandler from 'movementHandler';
import { initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize } from 'util';

let scene, renderer, camera, material, light, orbit;

scene = new THREE.Scene();
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 15, 30));
material = setDefaultMaterial();
light = initDefaultBasicLight(scene);
orbit = new OrbitControls(camera, renderer.domElement);

window.addEventListener('resize', function() {
    onWindowResize(camera, renderer);
}, false);

let axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);

let groundPlane = groundGenerator.generateGroundVoxelStyle();
scene.add(groundPlane);

let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
let cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

cube.position.set(0.0, 1, 0.0);
scene.add(cube);

let movementHandler = new MovementHandler(cube);

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
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

render();
