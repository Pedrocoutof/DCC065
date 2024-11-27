export default class MovementHandler {
    constructor(object, speed = 0.1) {
        this.object = object;
        this.speed = speed;
        this.runningConst = 2.5;
        this.keysPressed = {};

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

        if (this.keysPressed['w']) {
            this.object.position.z -= finalSpeed;
        }
        if (this.keysPressed['s']) {
            this.object.position.z += finalSpeed;
        }
        if (this.keysPressed['a']) {
            this.object.position.x -= finalSpeed;
        }
        if (this.keysPressed['d']) {
            this.object.position.x += finalSpeed;
        }
    }
}
