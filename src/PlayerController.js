import {
  PerspectiveCamera,
  Vector3,
  SpotLight,
  PointLight,
  Object3D,
} from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";

class PlayerController {
  constructor(x, y, z, domElement) {
    // initializing all the variables
    this.velocity = new Vector3();
    this.direction = new Vector3();
    this.prevTime = performance.now();

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    // setting up the main player controller camera
    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      3000
    );
    this.camera.position.set(x, y, z);
    this.camera.lookAt(x + 1, y, z);

    this.torch = this.initTorch();
    this.camera.add(this.torch);

    this.target = new Object3D();

    //this.position = new Vector3(x, y, z);
    // set up the player controller to use the pointer lock controls
    this.controls = this.initControls(domElement);
    this.setUpControls(this);
  }

  initControls(domElement) {
    // var controls = new PointerLockControls(this.camera, domElement);
    const controls = new PointerLockControls(this.camera, domElement);
    controls.addEventListener("lock", function () {
      //   menu.style.display = "none";
    });

    controls.addEventListener("unlock", function () {
      //   menu.style.display = "block";
    });
    return controls;
  }

  setUpControls(self) {
    const onKeyDown = (event) => {
      console.log("keyDown");
      switch (event.code) {
        case "KeyW":
          self.moveForward = true;
          break;

        case "KeyA":
          self.moveLeft = true;
          break;

        case "KeyS":
          self.moveBackward = true;
          break;

        case "KeyD":
          self.moveRight = true;
          break;

        case "Space":
          self.velocity.y = 2;
          break;

        case "KeyZ":
          self.velocity.y = -2;
          break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case "KeyW":
          self.moveForward = false;
          self.velocity = new Vector3(0, 0, 0);
          break;

        case "KeyA":
          self.moveLeft = false;
          break;

        case "KeyS":
          self.moveBackward = false;
          break;

        case "KeyD":
          self.moveRight = false;
          break;
        case "Space":
          self.velocity.y = 0;
          break;
        case "KeyZ":
          self.velocity.y = 0;
          break;
      }
    };

    const onClick = (event) => {
      switch (event.button) {
        case 0:
          self.controls.lock();
          break;
        case 2:
          self.torch.intensity = 1 - self.torch.intensity;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("click", onClick);
  }

  update() {
    this.handleMovement();
    this.handleTorch();
  }

  initTorch() {
    var torch = new SpotLight(0xffffff);
    torch.castShadow = false;

    torch.shadow.mapSize.width = 1024;
    torch.shadow.mapSize.height = 1024;
    torch.penumbra = 1;
    torch.decay = 0.4;
    torch.distance = 200;
    torch.shadow.mapSize.width = 2048;
    torch.shadow.mapSize.height = 2048;
    torch.shadow.camera.far = 20;
    torch.angle = Math.PI / 6;
    return torch;
  }

  handleTorch() {
    this.torch.position.set(0, 0, 1);
    this.torch.target = this.camera;
  }

  handleMovement() {
    const speed = 20;
    const time = performance.now();
    const delta = (time - this.prevTime) / 1000;

    // get the direction by subtracting booleans
    // since only one of the 2 can be true at any instance
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize(); // this ensures consistent movements in all directions

    // example code with acceleration
    // if ( this.moveForward || this.moveBackward ) this.velocity.z -= this.direction.z * 400.0 * delta;
    // if ( this.moveLeft || this.moveRight ) this.velocity.x -= this.direction.x * 400.0 * delta;

    // constant velocity
    if (this.moveForward || this.moveBackward)
      this.velocity.z = -1 * this.direction.z * speed;
    else this.velocity.z = 0;
    if (this.moveLeft || this.moveRight)
      this.velocity.x = -1 * this.direction.x * speed;
    else this.velocity.x = 0;

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);

    this.camera.position.y += this.velocity.y;

    this.prevTime = time;
  }


}

export default PlayerController;