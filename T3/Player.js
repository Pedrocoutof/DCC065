import * as THREE from "three";
import { GLTFLoader } from 'GLTFLoader';
import { CameraHelper } from 'three';
import GlobalConfig from "./GlobalConfig.js";

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
        this.baseSpeed = 0.18;
        this.speed = this.baseSpeed;
        this.rotationSpeed = 0.002;
        this.yInverted = false;

        this.thirdPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.thirdPersonCamera.position.set(10, 5, 50);
        this.add(this.thirdPersonCamera);

        this.cameraTarget = new THREE.Vector3();
        this.mixer = null;

        this.cameraAngle = 0;
        this.verticalOffset = 0;
        this.cameraVerticalAngle = 0;
        this.maxVerticalAngle = Math.PI / 4;
        this.minVerticalAngle = -Math.PI / 4;

        this.dirLight = null;
        
        this.dirLightTarget = new THREE.Object3D();
        this.crosshairVisible = false;
        this.createCrosshair();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.lastHighlightedVoxel = null;
        // Adiciona o listener de clique do mouse
        window.addEventListener('click', (event) => this.onMousePicking(event), false);
    } 


loadModel(x, z, y) {
    this.playerModel = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1), // Cubo com dimensões semelhantes a um personagem
        new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            transparent: true, // Ativa a transparência
            opacity: 0 // Define o nível de opacidade (0 é totalmente transparente, 1 é totalmente opaco)
        })
    );

    this.playerModel.position.set(x, y + 1, z); // Ajuste para centralizar o cubo no chão
    this.add(this.playerModel);

    this.initDirLight();
    this.dirLightTarget.position.set(x, y, z);
    this.dirLight.target = this.dirLightTarget;
    this.add(this.dirLight);
    this.add(this.dirLightTarget);
}


updateCameraPosition() {
    if (this.playerModel) {
        // Define a posição da câmera na altura dos olhos do jogador
        this.thirdPersonCamera.position.set(
            this.playerModel.position.x,
            this.playerModel.position.y + 1.6, // Altura dos olhos do jogador
            this.playerModel.position.z
        );

        // Calcula a direção com base na rotação horizontal e vertical
        const direction = new THREE.Vector3(0, 0, -1);
        const euler = new THREE.Euler(this.cameraVerticalAngle, this.playerModel.rotation.y, 0, "YXZ");
        direction.applyEuler(euler);

        // Aponta a câmera para onde o jogador está olhando
        this.thirdPersonCamera.lookAt(
            this.thirdPersonCamera.position.clone().add(direction)
        );
    }
}

updateCameraRotation(movementX, movementY) {
    if (typeof movementX !== 'number' || typeof movementY !== 'number') {
        return;
    }

    // Rotação horizontal (girar o jogador)
    const rotationY = movementX * this.rotationSpeed;
    if (this.playerModel) {
        this.playerModel.rotation.y -= rotationY;
    }

    // Rotação vertical (olhar para cima/baixo)
    const verticalMovement = this.yInverted ? -movementY : movementY;
    this.cameraVerticalAngle -= verticalMovement * this.rotationSpeed;

    // Limita o ângulo da câmera para evitar giros estranhos
    this.cameraVerticalAngle = THREE.MathUtils.clamp(
        this.cameraVerticalAngle,
        this.minVerticalAngle,
        this.maxVerticalAngle
    );

    // Atualiza a posição e rotação da câmera
    this.updateCameraPosition();
}


    handleKeyDown(key) {
        switch (key.toLowerCase()) {
            case 'w': case 'arrowup': this.movement.backward = true; break;
            case 's': case 'arrowdown': this.movement.forward = true; break;
            case 'a': case 'arrowleft': this.movement.right = true; break;
            case 'd': case 'arrowright': this.movement.left = true; break;
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
            case 'w': case 'arrowup': this.movement.backward = false; break;
            case 's': case 'arrowdown': this.movement.forward = false; break;
            case 'a': case 'arrowleft': this.movement.right = false; break;
            case 'd': case 'arrowright': this.movement.left = false; break;
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

    toggleShadowHelperVisibility() {
        if (this.dirLightHelper.visible) {
            this.dirLightHelper.visible = false;
        } else {
            this.dirLightHelper.visible = true;
        }
    }

    toggleYInversion(){
        this.yInverted = !this.yInverted
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
            this.fallSpeed += GlobalConfig.gravity * 10;
    
            this.playerModel.position.y += this.fallSpeed;
    
            const groundHeight = this.world.getHeightByXZ(Math.floor(this.playerModel.position.x), Math.floor(this.playerModel.position.z));
            if (this.playerModel.position.y <= groundHeight + 1.5) {
                this.playerModel.position.y = groundHeight + 1.5;
                this.fallSpeed = 0;
            }
        }
    }
    canMove(playerDirection, directionType) {
        const direction = new THREE.Vector3();
        playerDirection.getWorldDirection(direction);
        direction.y = 0;
    
        let moveVector = new THREE.Vector3();
    
        switch (directionType) {
            case 'forward':
                moveVector.copy(direction);
                break;
            case 'backward':
                moveVector.copy(direction).negate();
                break;
            case 'left':
                moveVector.crossVectors(direction, playerDirection.up).normalize().negate();
                break;
            case 'right':
                moveVector.crossVectors(direction, playerDirection.up).normalize();
                break;
            default:
                throw new Error('Invalid direction type');
        }
    
        const x = Math.floor(playerDirection.position.x + moveVector.x);
        const z = Math.floor(playerDirection.position.z + moveVector.z);
        const y = Math.floor(playerDirection.position.y) - 1;
    
        if (this.world.inBounds(x, z, y)) {
            const block = this.world.data[x][z][y];
            if (block && block.type === "water") {
                return true; // Ignora colisão com blocos de água
            }
            return !this.world.hasVoxel(x, z, y); // Verifica colisão com outros blocos
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
    
            if (this.movement.forward && this.canMove(this.playerModel, 'forward')) {
                this.playerModel.position.addScaledVector(direction, this.speed);
                isMoving = true;
            }
            if (this.movement.backward && this.canMove(this.playerModel, 'backward')) {
                this.playerModel.position.addScaledVector(direction, -this.speed);
                isMoving = true;
            }
            if (this.movement.left && this.canMove(this.playerModel, 'left')) {
                this.playerModel.position.addScaledVector(right, this.speed);
                isMoving = true;
            }
            if (this.movement.right && this.canMove(this.playerModel, 'right')) {
                this.playerModel.position.addScaledVector(right, -this.speed);
                isMoving = true;
            }
    
            // Verifica se o bloco abaixo do jogador é água
            const x = Math.floor(this.playerModel.position.x);
            const z = Math.floor(this.playerModel.position.z);
            const y = Math.floor(this.playerModel.position.y) - 1;
    
            if (this.world.inBounds(x, z, y)) {
                const block = this.world.data[x][z][y];
                if (block && block.type === "water") {
                    // Mantém o jogador flutuando sobre a água
                    this.playerModel.position.y = y + 1.5; // Altura fixa sobre a água
                    isMoving = true;
                }
            }
    
            if (this.isJumping) {
                this.playerModel.position.y += this.jumpVelocity;
                this.jumpVelocity += GlobalConfig.gravity;
    
                const groundHeight = this.world.getHeightByXZ(Math.floor(this.playerModel.position.x), Math.floor(this.playerModel.position.z));
                if (this.playerModel.position.y <= groundHeight + 1.5) {
                    this.playerModel.position.y = groundHeight + 1.5;
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                }
            }
    
            if (!this.isJumping) {
                const x = Math.floor(this.playerModel.position.x);
                const z = Math.floor(this.playerModel.position.z);
                const y = Math.floor(this.playerModel.position.y) - 1;
                if (this.world.inBounds(x, z, y)) {
                    const block = this.world.data[x][z][y];
                    if (block && block.type === "water") {
                        // Se o bloco abaixo for água, o jogador flutua
                        this.playerModel.position.y = y + 1.5; // Altura fixa sobre a água
                        this.fallSpeed = 0; // Reseta a velocidade de queda
                    } else {
                        // Se não for água, aplica a lógica de colisão normal
                        const groundHeight = this.world.getHeightByXZ(x, z);
                        if (this.playerModel.position.y > groundHeight + 1.5) {
                            this.fall();
                        }
                    }
                }
            }
    
            if (isMoving) {
                if (this.mixer) {
                    this.mixer.update(0.026 * (this.speed / this.baseSpeed));
                }
            }
            this.updateDirLightPosition();
            this.updateCameraPosition();
            this.updateCrosshairPosition();
        }
    }
    
    
    updateDirLightPosition() {
        this.dirLightTarget.position.set(this.playerModel.position.x, this.playerModel.position.y, this.playerModel.position.z);
        this.dirLight.position.set(this.playerModel.position.x, this.playerModel.position.y + 50, this.playerModel.position.z + 30);
        this.dirLight.target = this.dirLightTarget;
    }

    changeShadowMapVolume(fogValue) {
        const size = Math.max(Math.min(fogValue, 250), 0);
    
        this.dirLight.shadow.camera.left = -size;
        this.dirLight.shadow.camera.right = size;
        this.dirLight.shadow.camera.top = size;
        this.dirLight.shadow.camera.bottom = -size;
        
        this.dirLight.shadow.camera.updateProjectionMatrix();
        this.dirLightHelper.update();
    }
    
    initDirLight() {
        this.dirLight = new THREE.DirectionalLight('white', 1);
        this.dirLight.position.set(128, 100, 128);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize = new THREE.Vector2(4096, 4096)
        this.dirLight.shadow.radius=0.2;
        this.dirLight.shadow.blurSamples=2;
        this.dirLight.shadow.camera.near = 0.1;
        this.dirLight.shadow.camera.far = 80;
        this.dirLight.shadow.camera.left = -20;
        this.dirLight.shadow.camera.right = 20;
        this.dirLight.shadow.camera.top = 20;
        this.dirLight.shadow.camera.bottom = -20;
        this.dirLightHelper = new CameraHelper(this.dirLight.shadow.camera);
        this.dirLight.shadow.camera.normalBias = 0.0000003;
        this.add(this.dirLightHelper);
    }
    updateCrosshairPosition() {
        if (this.crosshair && this.thirdPersonCamera) {
            // A mira sempre deve ficar no centro da tela, então não precisamos alterar sua posição no mundo 3D
            // Apenas a projetamos no centro da tela

            const vector = new THREE.Vector3(0, 0, -5); // Distância da câmera até a mira
            vector.applyMatrix4(this.thirdPersonCamera.matrixWorld); // Aplica a transformação da câmera à posição da mira

            // Projeta a posição da mira na tela
            const screenPosition = vector.project(this.thirdPersonCamera);

            // Calcula as coordenadas da mira na tela (normaliza entre -1 e 1)
            const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;  // Convertendo para a largura da tela
            const y = (screenPosition.y * -0.5 + 0.5) * window.innerHeight; // Convertendo para a altura da tela

            // Atualiza a posição da mira na tela
            if (!this.crosshairElement) {
                this.crosshairElement = document.createElement("div");
                this.crosshairElement.style.position = "absolute";
                this.crosshairElement.style.width = "20px";
                this.crosshairElement.style.height = "20px";
                this.crosshairElement.style.borderRadius = "50%";
                this.crosshairElement.style.backgroundColor = "red";
                document.body.appendChild(this.crosshairElement);
            }

            // Define a posição da mira na tela
            this.crosshairElement.style.left = `${x - 10}px`; // Ajuste do centro da mira
            this.crosshairElement.style.top = `${y - 10}px`;  // Ajuste do centro da mira
        }
    }
    createCrosshair() {
        // Tamanho do símbolo +
        const size = 0.2;
    
        // Criando o "horizontal" da cruz
        this.horizontalLine = document.createElement("div");
        this.horizontalLine.style.position = "absolute";
        this.horizontalLine.style.width = `${size * 50}px`; // Tamanho proporcional ao tamanho da tela
        this.horizontalLine.style.height = "2px"; // Espessura da linha
        this.horizontalLine.style.backgroundColor = "white"; // Cor da linha
        this.horizontalLine.style.left = "50%"; // Posição horizontal no meio
        this.horizontalLine.style.top = "50%"; // Posição vertical no meio
        this.horizontalLine.style.transform = "translate(-50%, -50%)"; // Ajuste para centralizar no meio da tela
    
        // Criando o "vertical" da cruz
        this.verticalLine = document.createElement("div");
        this.verticalLine.style.position = "absolute";
        this.verticalLine.style.width = "2px"; // Espessura da linha
        this.verticalLine.style.height = `${size * 50}px`; // Tamanho proporcional ao tamanho da tela
        this.verticalLine.style.backgroundColor = "white"; // Cor da linha
        this.verticalLine.style.left = "50%"; // Posição horizontal no meio
        this.verticalLine.style.top = "50%"; // Posição vertical no meio
        this.verticalLine.style.transform = "translate(-50%, -50%)"; // Ajuste para centralizar no meio da tela
    
        // Adicionando as linhas ao corpo do documento
        document.body.appendChild(this.horizontalLine);
        document.body.appendChild(this.verticalLine);
    }
    toggleCrosshairVisibility() {
        if (this.crosshairVisible) {
            this.horizontalLine.style.display = "block";
            this.verticalLine.style.display = "block";
        } else {
            this.horizontalLine.style.display = "none";
            this.verticalLine.style.display = "none";
        }
    }
    onMousePicking(event) {
        // Calcula a posição do mouse em coordenadas normalizadas (-1 a +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        // Configura o raycaster com a posição do mouse e a câmera
        this.raycaster.setFromCamera(this.mouse, this.thirdPersonCamera);
    
        // Verifica a interseção com o terreno ou outros objetos
        const intersects = this.raycaster.intersectObjects([this.world.mesh]);
    
        if (intersects.length > 0) {
            const point = intersects[0].point; // Ponto de interseção no mundo
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            const z = Math.floor(point.z);
    
            // Verifica se há um voxel na posição (x, y, z)
            if (this.world.voxelMap.has(`${x}-${y}-${z}`)) {
                const index = this.world.voxelMap.get(`${x}-${y}-${z}`);
    
                // Destaca o voxel
                this.world.highlightVoxel(index);
    
                // Remove o voxel ao clicar
                if (event.button === 0) { // Botão esquerdo
                    this.world.handleBlockRemoval(x, y, z);
                }
            }
        }
    }
    handleMouseClick() {
        const voxel = this.detectVoxel(); // Detecta o bloco sob a mira
        if (voxel) {
            const position = voxel.position;
            const x = Math.floor(position.x - 0.5);
            const y = Math.floor(position.y - 0.5);
            const z = Math.floor(position.z - 0.5);
    
            this.world.handleBlockRemoval(x, y, z); // Remove o bloco
        }
    }
    detectVoxel() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
    
        // Configura a posição da mira no centro da tela (0, 0)
        mouse.x = 0;
        mouse.y = 0;
    
        // Configura o raycaster para apontar na direção da mira
        raycaster.setFromCamera(mouse, this.thirdPersonCamera);
    
        // Intersecta com objetos no mundo
        const intersects = raycaster.intersectObjects(this.world.children, true);
    
        if (intersects.length > 0) {
            return intersects[0].object; // Retorna o voxel mais próximo
        }
    
        return null;
    }
}
