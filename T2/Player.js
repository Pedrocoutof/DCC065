import * as THREE from "three";
import { GLTFLoader } from '../../build/jsm/loaders/GLTFLoader.js';
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
        this.thirdPersonCamera.position.set(0, 5, -10);
        this.add(this.thirdPersonCamera);

        this.referenceObject = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.0
            })
        );
        this.referenceObject.position.set(0, 0, 5);
        this.add(this.referenceObject);

        this.cameraTarget = new THREE.Vector3();
        this.mixer = null;

        this.cameraAngle = 0;
        this.verticalOffset = 0;
        this.cameraVerticalAngle = 0;
        this.maxVerticalAngle = Math.PI / 4;
        this.minVerticalAngle = -Math.PI / 4;

        this.dirLight = null;
        
        this.dirLightTarget = new THREE.Object3D();
    }

    loadModel(x, z, y) {
        this.loader.load(
            "./assets/steve.glb",
            (gltf) => {
                this.playerModel = gltf.scene;
                this.playerModel.scale.set(0.75, 0.75, 0.75);
                this.playerModel.position.set(x, y + 1.5, z);
                this.add(this.playerModel);

                this.playerModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
    
                this.mixer = new THREE.AnimationMixer(this.playerModel);
                gltf.animations.forEach((clip) => {
                    this.mixer.clipAction(clip).play();
                });
            }
        );
        this.initDirLight()
        this.dirLightTarget.position.set(x, y, z);
        this.dirLight.target = this.dirLightTarget;
        this.add(this.dirLight);
        this.add(this.dirLightTarget)
    }

    updateCameraPosition() {
        if (this.playerModel) {
            const radius = 10;
            const height = 5;

            this.referenceObject.position.set(
                this.playerModel.position.x + radius * Math.sin(this.playerModel.rotation.y),
                this.playerModel.position.y + this.verticalOffset,
                this.playerModel.position.z + radius * Math.cos(this.playerModel.rotation.y)
            );


            this.thirdPersonCamera.position.set(
                this.playerModel.position.x - radius * Math.sin(this.playerModel.rotation.y),
                this.playerModel.position.y + height + Math.sin(this.cameraVerticalAngle) * radius,
                this.playerModel.position.z - radius * Math.cos(this.playerModel.rotation.y)
            );

            this.thirdPersonCamera.lookAt(this.referenceObject.position);
        }
    }

    updateCameraRotation(movementX, movementY) {
        if (typeof movementX !== 'number' || typeof movementY !== 'number') {
            return;
        }
    
        const rotationY = movementX * this.rotationSpeed;
        if (this.playerModel) {
            this.playerModel.rotation.y -= rotationY;
        }
    
        const verticalMovement = this.yInverted ? -movementY : movementY;
    
        this.cameraVerticalAngle -= verticalMovement * this.rotationSpeed;
        this.cameraVerticalAngle = THREE.MathUtils.clamp(
            this.cameraVerticalAngle,
            this.minVerticalAngle,
            this.maxVerticalAngle
        );
    
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
            return this.world.hasVoxel(x, z, y);
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

            if (this.movement.forward && !this.canMove(this.playerModel, 'forward')) {
                this.playerModel.position.addScaledVector(direction, this.speed);
                isMoving = true;
            }
            if (this.movement.backward && !this.canMove(this.playerModel, 'backward')){
                this.playerModel.position.addScaledVector(direction, -this.speed);
                isMoving = true;
            }
            if (this.movement.left && !this.canMove(this.playerModel, 'left')) {
                this.playerModel.position.addScaledVector(right, this.speed);
                isMoving = true;
            }
            if (this.movement.right && !this.canMove(this.playerModel, 'right')) {
                this.playerModel.position.addScaledVector(right, -this.speed);
                isMoving = true;
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
                const groundHeight = this.world.getHeightByXZ(Math.floor(this.playerModel.position.x), Math.floor(this.playerModel.position.z));
                if (this.playerModel.position.y > groundHeight + 1.5) {
                    this.fall();
                }
            }

            if (isMoving) {
                if (this.mixer) {
                    this.mixer.update(0.026 * (this.speed / this.baseSpeed));
                }
            }
            this.updateDirLightPosition();
            this.updateCameraPosition();
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
}