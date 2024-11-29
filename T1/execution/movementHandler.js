import * as THREE from 'three';

export default class MovementHandler {
  constructor(object, camera, isFirstPersonFn, speed = 0.1) {
    this.object = object;
    this.speed = speed;
    this.runningConst = 2.5;
    this.keysPressed = {};
    this.camera = camera;
    this.isFirstPerson = isFirstPersonFn;
    this.lastDirection = new THREE.Vector3(0, 0, -1);

    window.addEventListener('keydown', (event) => {
      this.keysPressed[event.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (event) => {
      this.keysPressed[event.key.toLowerCase()] = false;
    });
  }

  handleMovement() {
    let finalSpeed = this.speed;
    if (this.keysPressed['shift']) {
      finalSpeed *= this.runningConst;
    }

    let movement = new THREE.Vector3();

    if (this.keysPressed['w']) {
      movement.z -= 1;
    }
    if (this.keysPressed['s']) {
      movement.z += 1;
    }
    if (this.keysPressed['a']) {
      movement.x -= 1;
    }
    if (this.keysPressed['d']) {
      movement.x += 1;
    }

    if (movement.length() > 0) {
      movement.normalize();

      if (this.isFirstPerson()) {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

        const moveDirection = new THREE.Vector3();
        moveDirection.addScaledVector(direction, -movement.z);
        moveDirection.addScaledVector(right, movement.x);
        moveDirection.normalize().multiplyScalar(finalSpeed);

        this.object.position.add(moveDirection);
      } else {
        movement.multiplyScalar(finalSpeed);
        this.object.position.add(movement);

        let angle = Math.atan2(-movement.x, -movement.z);
        this.object.rotation.y = angle;
      }
    }
  }
}
