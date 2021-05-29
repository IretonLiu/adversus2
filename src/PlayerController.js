import {
  PerspectiveCamera,
  Vector3,
  SpotLight,
  PointLight,
  Object3D,
} from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import Constants from "./Constants";
import state from "./State";
class PlayerController {
  constructor(x, y, z, domElement) {
    // setup player object for ammo
    this.playerObject = new Object3D();
    this.playerObject.position.set(x, y, z);
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
      0.1,
      Constants.CAMERA_FAR
    );
    this.camera.position.set(x, y, z);
    this.camera.lookAt(x + 1, y, z);

    this.torch = this.initTorch();
    this.camera.add(this.torch);

    this.target = new Object3D();

    //this.position = new Vector3(x, y, z);
    // set up the player controller to use the pointer lock controls
    this.controls = this.initControls(domElement, this);
    this.setUpControls(this);
  }

  initControls(domElement, self) {
    const controls = new PointerLockControls(this.camera, domElement);
    controls.maxPolarAngle = 29 * Math.PI / 30;
    controls.minPolarAngle = 1 * Math.PI / 30;
    controls.addEventListener("unlock", function () {
      self.openPauseMenu();
    });
    return controls;
  }

  initPlayerRB() {
    const pos = this.camera.position;
    const quat = this.camera.quaternion;
    // setup ammo.js tranform object
    const mass = 1;
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    // setup the shape of the collider that matches the shape of the mesh
    let colliderShape = new Ammo.btBoxShape(5, 5, 5);
    colliderShape.setMargin(0.05);

    // setup inertia of the object
    let localInertia = new Ammo.btVector3(0, 0, 0);
    colliderShape.calculateLocalInertia(mass, localInertia);

    // generate the rigidbody
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colliderShape,
      localInertia
    );
    let rb = new Ammo.btRigidBody(rbInfo);
    rb.setFriction(4);


    //this.rigidbody = threeObj;

  }

  openPauseMenu() {
    var pauseMenu = document.getElementById("pause");
    pauseMenu.classList.remove("hidden");
    state.isPlaying = false;
  }

  setUpPauseScreen() {
    var pause = document.getElementById("pause");

    document.getElementById("resume-button").onclick = () => {
      this.controls.lock();
      pause.classList.add("hidden");
      state.isPlaying = true;
    };
  }

  setUpControls(self) {
    self.controls.lock();
    this.setUpPauseScreen();
    const onKeyDown = (event) => {
      if (!state.isPlaying) return;
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
      if (!state.isPlaying) return;
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
        case "KeyE":
          this.turnTorchOff();
          break;
      }
    };

    const onClick = (event) => {
      if (!state.isPlaying) return;
      switch (event.button) {
        // case 0:
        //   self.controls.lock();
        //   break;
        case 2:
          this.turnTorchOff();
          break;
      }
    };

    const onRightClick = (event) => {
      if (!state.isPlaying) return;
      this.turnTorchOff();
    };
    document.addEventListener("contextmenu", onRightClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("click", onClick);
  }

  turnTorchOff() {
    this.torch.visible = !this.torch.visible;
  }

  update() {
    this.handleMovement();

    this.handleTorch();
  }

  updatePosition() {
    const pos = this.playerObject.position;
    //console.log(pos);
    this.camera.position.set(pos.x, pos.y, pos.z);
  }

  initTorch() {
    const mapSize = Constants.MAP_SIZE;
    var torch = new SpotLight(0xffffff);
    torch.shadow.bias = -0.0001;
    torch.castShadow = true;
    torch.intensity = 1.5;
    torch.shadow.mapSize.width = 1024;
    torch.shadow.mapSize.height = 1024;
    torch.penumbra = 1;
    torch.decay = 5;
    torch.distance = 2000;
    torch.shadow.mapSize.width = 2048;
    torch.shadow.mapSize.height = 2048;
    torch.shadow.camera.far = 100;
    torch.angle = Math.PI / 7;
    return torch;
  }

  handleTorch() {
    this.torch.position.set(0, 0, 1);
    this.torch.target = this.camera;
  }

  handleMovement() {
    const speed = Constants.PLAYER_MOVE_SPEED_DEV; // TODO: change to normal 
    const time = performance.now();
    const delta = (time - this.prevTime) / 1000;

    // get the direction by subtracting booleans
    // since only one of the 2 can be true at any instance
    this.direction.x = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.z = Number(this.moveRight) - Number(this.moveLeft);
    //this.direction.normalize(); // this ensures consistent movements in all directions

    // example code with acceleration
    // if ( this.moveForward || this.moveBackward ) this.velocity.z -= this.direction.z * 400.0 * delta;
    // if ( this.moveLeft || this.moveRight ) this.velocity.x -= this.direction.x * 400.0 * delta;


    // constant velocity

    // the direction of the impulse;
    let moveDirection = new Vector3(0, 0, 0);

    const lookDirection = this.controls.getDirection(new Vector3(0, 0, 0));

    if (this.moveForward || this.moveBackward) {
      moveDirection.addVectors(moveDirection, lookDirection.multiplyScalar(this.direction.x));
    }

    const rightDirection = new Vector3(lookDirection.x, lookDirection.y, lookDirection.z).applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
    if (this.moveLeft || this.moveRight) {
      let d = 1;
      if (this.moveBackward) d = -1
      moveDirection.addVectors(moveDirection, rightDirection.multiplyScalar(d * this.direction.z));

    }
    moveDirection.y = 0;

    moveDirection.normalize();

    // set up the impulse for movement
    if (moveDirection.x == 0 && moveDirection.y == 0 && moveDirection == 0) return;

    let resultantImpulse = new Ammo.btVector3(moveDirection.x, moveDirection.y, moveDirection.z)
    resultantImpulse.op_mul(Constants.PLAYER_MOVE_SPEED_DEV);
    // let resultantImpulse = new Ammo.btVector3(1, 0, 0)
    // resultantImpulse.op_mul(20);

    let physicsBody = this.playerObject.userData.physicsBody;
    physicsBody.setLinearVelocity(resultantImpulse);

    // this.controls.moveRight(-this.velocity.x * delta);
    // this.controls.moveForward(-this.velocity.z * delta);

    this.camera.position.y += this.velocity.y;
    // this.camera.position.x += 1;
    this.prevTime = time;
  }

}

export default PlayerController;
