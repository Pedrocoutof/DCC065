import * as THREE from "three";
import { GLTFLoader } from '../../build/jsm/loaders/GLTFLoader.js';

export default class Player extends THREE.Group {
    constructor() {
        super();
        this.loader = new GLTFLoader();
        this.playerModel = null;
        this.movement = { forward: false, backward: false, left: false, right: false, up: false, down: false, shift: false };
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = -0.005;
        this.baseSpeed = 0.1;
        this.speed = this.baseSpeed;
        this.rotationSpeed = 0.002;
        this.yInverted = false; // Controle para inverter o movimento no eixo Y

        // Inicializa a câmera em terceira pessoa, atrás do personagem.
        this.thirdPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraDistance = 10; // Distância da câmera ao personagem
        this.thirdPersonCamera.position.set(0, 5, this.cameraDistance);  // Coloca a câmera atrás inicialmente
        this.add(this.thirdPersonCamera);

        this.cameraTarget = new THREE.Vector3();
        this.mixer = null;
        this.cameraHorizontalRotation = 0;
        this.cameraVerticalRotation = 0;
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

                // Inicializa a câmera atrás do personagem após carregar o modelo
                this.updateCameraPosition();
            }
        );
    }

    updateCameraPosition() {
        if (this.playerModel) {
            // Calcula a posição da câmera ao redor do personagem com base nas rotações
            const offset = new THREE.Vector3(
                Math.sin(this.cameraHorizontalRotation) * this.cameraDistance,
                5 + Math.sin(this.cameraVerticalRotation) * 2,  // Ajuste na altura da câmera
                Math.cos(this.cameraHorizontalRotation) * this.cameraDistance
            );

            offset.applyQuaternion(this.playerModel.quaternion);

            this.thirdPersonCamera.position.copy(this.playerModel.position).add(offset);
            this.cameraTarget.copy(this.playerModel.position);
            this.thirdPersonCamera.lookAt(this.cameraTarget);
        }
    }

    updateCameraRotation(movementX, movementY) {
        const rotationY = this.yInverted ? -movementY * this.rotationSpeed : movementY * this.rotationSpeed;
    
        this.cameraHorizontalRotation -= movementX * this.rotationSpeed;
    
        // Limitação da rotação no eixo vertical (X)
        const maxVerticalAngle = Math.PI / 2.5; // (~72°)
        const minVerticalAngle = -Math.PI / 2.5; // (~-72°)
        this.cameraVerticalRotation = THREE.MathUtils.clamp(
            this.cameraVerticalRotation + rotationY,
            minVerticalAngle,
            maxVerticalAngle
        );
    
        // Garantir rotação contínua para 360 graus no eixo Y (horizontal)
        // Normaliza a rotação para o intervalo de -π a π (sem restrições)
        if (this.cameraHorizontalRotation > Math.PI) {
            this.cameraHorizontalRotation -= 2 * Math.PI;
        } else if (this.cameraHorizontalRotation < -Math.PI) {
            this.cameraHorizontalRotation += 2 * Math.PI;
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
        if (button === 2) { // Botão direito do mouse
            this.jump();
        }
    }

    jump() {
        if (!this.isJumping && this.playerModel) {
            this.isJumping = true;
            this.jumpVelocity = 0.15; // Inicializando a força do pulo
        }
    }

    update() {
        if (this.playerModel) {
            // Obtemos a direção da câmera para mover o player
            const direction = new THREE.Vector3();
            const right = new THREE.Vector3();
    
            // Direção para frente/backward
            this.thirdPersonCamera.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();
    
            // Direção para esquerda/direita (perpendicular à direção da câmera)
            right.crossVectors(this.thirdPersonCamera.up, direction).normalize();
    
            let isMoving = false;
    
            // Movimento horizontal
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
    
            // Atualização da gravidade e salto
            if (this.isJumping) {
                this.playerModel.position.y += this.jumpVelocity;
                this.jumpVelocity += this.gravity;
    
                if (this.playerModel.position.y <= 1.5) {
                    this.playerModel.position.y = 1.5;
                    this.isJumping = false;
                }
            }
    
            if (isMoving) {
                this.playAnimation('Walking');
                if (this.mixer) {
                    // Ajusta a velocidade da animação com base na velocidade do movimento
                    this.mixer.update(0.026 * (this.speed / this.baseSpeed));
                }
            }
    
            // Rotaciona o jogador na horizontal para seguir o movimento do mouse
            // Use a rotação contínua sem limite (garantindo que o jogador rode 360 graus)
            this.playerModel.rotation.y = this.cameraHorizontalRotation;
    
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
