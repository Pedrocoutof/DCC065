import * as THREE from "three";
import { GLTFLoader } from '../../build/jsm/loaders/GLTFLoader.js';

export default class Player extends THREE.Group {
    constructor(world) {
        super();
        this.world = world;
        this.loader = new GLTFLoader();
        this.playerModel = null;
        this.movement = { forward: false, backward: false, left: false, right: false, up: false, down: false, shift: false };
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = -0.005;
        this.baseSpeed = 0.1;
        this.speed = this.baseSpeed;
        this.rotationSpeed = 0.002;
        this.yInverted = false;

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
                this.playerModel.position.set(x, y, z);
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

        // Rotação no eixo horizontal (Y)
        this.thirdPersonCamera.rotation.y -= movementX * this.rotationSpeed;

        // Limitação da rotação no eixo vertical (X)
        const maxVerticalAngle = Math.PI / 2.5; // (~72°)
        const minVerticalAngle = -Math.PI / 2.5; // (~-72°)
        this.thirdPersonCamera.rotation.x = THREE.MathUtils.clamp(
            this.thirdPersonCamera.rotation.x + rotationY,
            minVerticalAngle,
            maxVerticalAngle
        );

        // Sincronização com o modelo do personagem
        if (this.playerModel) {
            this.playerModel.rotation.y -= movementX * this.rotationSpeed;
        }
    }

    handleKeyDown(key) {
        switch (key.toLowerCase()) {
            case 'w': case 'arrowup': this.movement.forward = true; break;
            case 's': case 'arrowdown': this.movement.backward = true; break;
            case 'a': case 'arrowleft': this.movement.left = true; break;
            case 'd': case 'arrowright': this.movement.right = true; break;
            case ' ': this.jump(); break;
            case 'shift': 
                this.movement.shift = true; 
                this.speed = this.baseSpeed * 2; 
                break;
            case 'y': // Alternância de inversão do eixo Y
                this.yInverted = !this.yInverted; 
                break;
        }
    }

    handleKeyUp(key) {
        switch (key.toLowerCase()) {
            case 'w': case 'arrowup': this.movement.forward = false; break;
            case 's': case 'arrowdown': this.movement.backward = false; break;
            case 'a': case 'arrowleft': this.movement.left = false; break;
            case 'd': case 'arrowright': this.movement.right = false; break;
            case 'shift': 
                this.movement.shift = false; 
                this.speed = this.baseSpeed; 
                break;
        }
    }

    handleMouseDown(button) {
        if (button === 2) {
            this.jump();
        }
    }

    jump() {
        if (!this.isJumping && this.playerModel) {
            this.isJumping = true;
            this.jumpVelocity = 0.15;
        }
    }

    fall() {
        if (this.playerModel) {
            if (this.fallSpeed < -10) {
                this.fallSpeed = -10;
            }

            this.fallSpeed = this.fallSpeed || 0;
            this.fallSpeed += this.gravity * 10;
    
            this.playerModel.position.y += this.fallSpeed;
    
            const groundHeight = this.world.getHeightByXZ(Math.floor(this.playerModel.position.x), Math.floor(this.playerModel.position.z));
            if (this.playerModel.position.y <= groundHeight + 1.5) {
                this.playerModel.position.y = groundHeight + 1.5;
                this.fallSpeed = 0;
            }
        }
    }

    canMoveForward(playerDirection) {
        const direction = new THREE.Vector3();
        playerDirection.getWorldDirection(direction);
        direction.y = 0;

        const x = Math.floor(playerDirection.position.x + direction.x);
        const z = Math.floor(playerDirection.position.z + direction.z);
        const y = Math.floor(playerDirection.position.y) - 1;

        if(this.world.inBounds(x,z,y)) {
            return this.world.hasVoxel(x,z,y)
        }
        return true;
    }
    
    canMoveBackward(playerDirection) {
        const direction = new THREE.Vector3();
        playerDirection.getWorldDirection(direction);
        direction.y = 0;

        const x = Math.floor(playerDirection.position.x - direction.x);
        const z = Math.floor(playerDirection.position.z - direction.z);
        const y = Math.floor(playerDirection.position.y) - 1;

        if(this.world.inBounds(x,z,y)) {
            return this.world.hasVoxel(x,z,y)
        }
        return true;
    }

    canMoveLeft(playerDirection) {
        const direction = new THREE.Vector3();
        playerDirection.getWorldDirection(direction);
        direction.y = 0;
    
        const right = new THREE.Vector3();
        right.crossVectors(direction, playerDirection.up).normalize();
    
        const x = Math.floor(playerDirection.position.x - right.x);
        const z = Math.floor(playerDirection.position.z - right.z);
        const y = Math.floor(playerDirection.position.y) - 1;
        
        if(this.world.inBounds(x,z,y)) {
            return this.world.hasVoxel(x,z,y)
        }
        return true;
    }
    
    canMoveRight(playerDirection) {
        const direction = new THREE.Vector3();
        playerDirection.getWorldDirection(direction);
        direction.y = 0;
    
        const right = new THREE.Vector3();
        right.crossVectors(direction, playerDirection.up).normalize();
    
        const x = Math.floor(playerDirection.position.x + right.x);
        const z = Math.floor(playerDirection.position.z + right.z);
        const y = Math.floor(playerDirection.position.y) - 1;
        
        if(this.world.inBounds(x,z,y)) {
            return this.world.hasVoxel(x,z,y)
        }
        return true;
    }
    

    update() {
        if (this.playerModel) {
            const direction = new THREE.Vector3();
            this.playerModel.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();

            const right = new THREE.Vector3();
            right.crossVectors(this.thirdPersonCamera.up, direction).normalize();

            let isMoving = false;

            // Movimento horizontal
            if (this.movement.forward && !this.canMoveForward(this.playerModel)) {
                this.playerModel.position.addScaledVector(direction, this.speed);
                isMoving = true;
            }
            if (this.movement.backward && !this.canMoveBackward(this.playerModel) ){
                this.playerModel.position.addScaledVector(direction, -this.speed);
                isMoving = true;
            }
            if (this.movement.left && !this.canMoveLeft(this.playerModel)) {
                this.playerModel.position.addScaledVector(right, this.speed);
                isMoving = true;
            }
            if (this.movement.right && !this.canMoveRight(this.playerModel)) {
                this.playerModel.position.addScaledVector(right, -this.speed);
                isMoving = true;
            }

            // Aplicar a física (gravidade e pulo)
            if (this.isJumping) {
                this.playerModel.position.y += this.jumpVelocity;
                this.jumpVelocity += this.gravity;

                // Verificar se o jogador atingiu o chão
                const groundHeight = this.world.getHeightByXZ(Math.floor(this.playerModel.position.x), Math.floor(this.playerModel.position.z));
                if (this.playerModel.position.y <= groundHeight + 1) {
                    this.playerModel.position.y = groundHeight + 1;
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                }
            }

            if (!this.isJumping) {
                const groundHeight = this.world.getHeightByXZ(Math.floor(this.playerModel.position.x), Math.floor(this.playerModel.position.z));
                if (this.playerModel.position.y > groundHeight + 1) {
                    this.fall();
                }
            }

            if (isMoving) {
                this.playAnimation('Walking');
                if (this.mixer) {
                    this.mixer.update(0.026 * (this.speed / this.baseSpeed));
                }
            }

            this.updateCameraPosition();
        }
    }

    playAnimation(animationName) {
        if (this.mixer) {
            const action = this.mixer.clipAction(animationName);
            if (action) {
                action.play();
            }
        }
    }
}
