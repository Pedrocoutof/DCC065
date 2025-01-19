import * as THREE from "three";
import { GLTFLoader } from '../../build/jsm/loaders/GLTFLoader.js';

export default class Player extends THREE.Group {
    constructor() {
        super();
        this.loader = new GLTFLoader();
        this.playerModel = null;
        this.movement = { forward: false, backward: false, left: false, right: false };
        this.isJumping = false;
        this.yInverted = false;
        this.speed = 0.1;
        this.rotationSpeed = 0.002;

        this.thirdPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.thirdPersonCamera.position.set(0, 5, -10);
        this.add(this.thirdPersonCamera);

        this.cameraTarget = new THREE.Vector3();
        this.mixer = null;
    }

    loadModel(x, z, y) {
        this.loader.load(
            "./assets/steve.glb",
            (gltf) => {
                this.playerModel = gltf.scene;
                this.playerModel.scale.set(1, 1, 1);
                this.playerModel.position.set(x, y + 1.5, z);
                this.add(this.playerModel);

                this.mixer = new THREE.AnimationMixer(this.playerModel);
                gltf.animations.forEach((clip) => {
                    this.mixer.clipAction(clip).play();
                });
                
            }
        );
    }

    updateCameraPosition() {
        if (this.playerModel) {
            const offset = new THREE.Vector3(0, 5, -10);
            offset.applyQuaternion(this.playerModel.quaternion);
            this.thirdPersonCamera.position.copy(this.playerModel.position).add(offset);

            this.cameraTarget.copy(this.playerModel.position);
            this.thirdPersonCamera.lookAt(this.cameraTarget);
        }
    }

    updateCameraRotation(movementX, movementY) {
        const rotationY = this.yInverted ? -movementY * this.rotationSpeed : movementY * this.rotationSpeed;
        this.thirdPersonCamera.rotation.y -= movementX * this.rotationSpeed;
        this.thirdPersonCamera.rotation.x += rotationY;

        if (this.playerModel) {
            this.playerModel.rotation.y -= movementX * this.rotationSpeed;
        }
    }

    handleKeyDown(key) {
        switch (key.toLowerCase()) {
            case 'w': this.movement.forward = true; break;
            case 's': this.movement.backward = true; break;
            case 'a': this.movement.left = true; break;
            case 'd': this.movement.right = true; break;
            case ' ': this.jump(); break;
        }
    }

    handleKeyUp(key) {
        switch (key.toLowerCase()) {
            case 'w': this.movement.forward = false; break;
            case 's': this.movement.backward = false; break;
            case 'a': this.movement.left = false; break;
            case 'd': this.movement.right = false; break;
        }
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            setTimeout(() => { this.isJumping = false; }, 1000);
        }
    }

    update() {
        if (this.playerModel) {
            const direction = new THREE.Vector3();
            this.playerModel.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();

            const right = new THREE.Vector3();
            right.crossVectors(this.thirdPersonCamera.up, direction).normalize();

            let isMoving = false; // Variável para verificar se o player está se movendo

            if (this.movement.forward) {
                this.playerModel.position.addScaledVector(direction, this.speed);
                isMoving = true;
            }
            if (this.movement.backward) {
                this.playerModel.position.addScaledVector(direction, -this.speed);
                isMoving = true;
            }
            if (this.movement.left) {
                this.playerModel.position.addScaledVector(right, this.speed);
                isMoving = true;
            }
            if (this.movement.right) {
                this.playerModel.position.addScaledVector(right, -this.speed);
                isMoving = true;
            }

            if (isMoving) {
                this.playAnimation('Walking');
                    if (this.mixer) {
                        this.mixer.update(0.016);
                    }
            }

            this.updateCameraPosition();
        }
    }

    playAnimation() {
        if (this.mixer) {
            const action = this.mixer.clipAction(null);
        }
    }
}
