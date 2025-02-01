import * as THREE from "three";
import { GLTFLoader } from '../../build/jsm/loaders/GLTFLoader.js';
export default class Player extends THREE.Group {
    constructor(world) {
        super();
        this.world = world;
        this.loader = new GLTFLoader();
        this.playerModel = null;
        this.movement = { 
            forward: false, backward: false, left: false, right: false, 
            up: false, down: false, shift: false, 
            cameraUp: false, cameraDown: false
        };
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = -0.005;
        this.baseSpeed = 0.1;
        this.speed = this.baseSpeed;
        this.rotationSpeed = 0.002;
        this.yInverted = false;

        // Câmera
        this.thirdPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.thirdPersonCamera.position.set(0, 5, -10); // Posição inicial da câmera (atrás do personagem)
        this.add(this.thirdPersonCamera);

        // Objeto de referência (à frente do personagem)
        this.referenceObject = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ 
                color: 0xff0000, // Cor do objeto (pode ser qualquer cor)
                transparent: true, // Habilita a transparência
                opacity: 0.0 // Define a opacidade (0 = totalmente transparente, 1 = totalmente opaco)
            })
        );
        this.referenceObject.position.set(0, 0, 5); // Posição inicial à frente do personagem
        this.add(this.referenceObject);

        this.cameraTarget = new THREE.Vector3();
        this.mixer = null;

        // Ângulo de rotação da câmera e do objeto de referência
        this.cameraAngle = 0; // Ângulo inicial da câmera
        this.verticalOffset = 0; // Deslocamento vertical da esfera
        this.cameraVerticalAngle = 0; // Ângulo vertical da câmera
        this.maxVerticalAngle = Math.PI / 4; // Limite máximo de rotação vertical (45 graus)
        this.minVerticalAngle = -Math.PI / 4; // Limite mínimo de rotação vertical (-45 graus)
    }

    loadModel(x, z, y) {
        this.loader.load(
            "./assets/steve.glb",
            (gltf) => {
                this.playerModel = gltf.scene;
                this.playerModel.scale.set(0.75, 0.75, 0.75);
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
            const radius = 10; // Distância da câmera e do objeto de referência ao personagem
            const height = 5; // Altura da câmera em relação ao personagem

            // Atualizar a posição do objeto de referência (à frente do personagem)
            this.referenceObject.position.set(
                this.playerModel.position.x + radius * Math.sin(this.playerModel.rotation.y),
                this.playerModel.position.y + this.verticalOffset, // Aplicar deslocamento vertical
                this.playerModel.position.z + radius * Math.cos(this.playerModel.rotation.y)
            );

            // Atualizar a posição da câmera (atrás do personagem)
            this.thirdPersonCamera.position.set(
                this.playerModel.position.x - radius * Math.sin(this.playerModel.rotation.y),
                this.playerModel.position.y + height + Math.sin(this.cameraVerticalAngle) * radius, // Ajustar altura com base no ângulo vertical
                this.playerModel.position.z - radius * Math.cos(this.playerModel.rotation.y)
            );

            // A câmera sempre aponta para o objeto de referência
            this.thirdPersonCamera.lookAt(this.referenceObject.position);
        }
    }

    updateCameraRotation(movementX, movementY) {
        if (typeof movementX !== 'number' || typeof movementY !== 'number') {
            return;
        }
    
        // Movimento no eixo X: gira o personagem e a câmera
        const rotationY = movementX * this.rotationSpeed;
        if (this.playerModel) {
            this.playerModel.rotation.y -= rotationY;
        }
    
        // Inverter o movimento no eixo Y se yInverted for true
        const verticalMovement = this.yInverted ? -movementY : movementY;
    
        // Movimento no eixo Y: ajusta o ângulo vertical da câmera
        this.cameraVerticalAngle -= verticalMovement * this.rotationSpeed;
        this.cameraVerticalAngle = THREE.MathUtils.clamp(
            this.cameraVerticalAngle,
            this.minVerticalAngle,
            this.maxVerticalAngle
        );
    
        // Atualizar a posição da câmera e do objeto de referência
        this.updateCameraPosition();
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
            case 'y': 
                this.yInverted = !this.yInverted; 
                break;
            case 'q': 
                this.movement.cameraUp = true;
                break;
            case 'e': 
                this.movement.cameraDown = true;
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
            case 'q': 
                this.movement.cameraUp = false;
                break;
            case 'e': 
                this.movement.cameraDown = false;
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

            if (this.isJumping) {
                this.playerModel.position.y += this.jumpVelocity;
                this.jumpVelocity += this.gravity;

                const groundHeight = this.world.getHeightByXZ(Math.floor(this.playerModel.position.x), Math.floor(this.playerModel.position.z));
                if (this.playerModel.position.y <= groundHeight + 1.5) {
                    this.playerModel.position.y = groundHeight + 1.5;
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                }
            }

            if (!this.isJumping) {
                const groundHeight = this.world.getHeightByXZ(Math.floor(this.playerModel.position.x), Math.floor(this.playerModel.position.z));
                if (this.playerModel.position.y > groundHeight + 1.5) {
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
     toggleYInversion(){
        this.yInverted = !this.yInverted
    }
}