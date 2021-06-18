import {
  PerspectiveCamera,
  Vector3,
  SpotLight,
  Object3D,
  Raycaster,
  BoxBufferGeometry,
  MeshBasicMaterial,
  Mesh,
  Group,
  DoubleSide,
  AnimationMixer,
} from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import Constants from "./Constants";
import state from "./State";
import Candle from "./Candle";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

class PlayerController {
  constructor(domElement, onInteractCB) {
    // setup player object for ammo
    const playerPos = Constants.PLAYER_INITIAL_POS;
    this.playerObject = new Group();
    this.playerObject.position.set(playerPos.x, playerPos.y, playerPos.z);
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
      0.01,
      Constants.CAMERA_FAR
    );
    this.camera.position.set(playerPos.x, playerPos.y, playerPos.z);
    this.camera.lookAt(playerPos.x + 1, playerPos.y, playerPos.z);

    // the torch that is used by the player
    this.torch = this.initTorch();
    this.torchOn = false;

    this.camera.add(this.torch);

    // the candle that is used by the player
    this.candle = null;

    this.target = new Object3D();

    //this.position = new Vector3(x, y, z);
    // set up the player controller to use the pointer lock controls
    this.controls = this.initControls(domElement, this);
    this.setUpControls(this);
    this.setUpInteraction();

    // setting up object interaction raycaster
    this.raycaster = new Raycaster();
    this.raycaster.near = 0.1;
    this.raycaster.far = 20;
    this.intersect = null;
    // this.scene = null;
    this.onInteractCB = onInteractCB;

    // animation for the player
    this.animMixer = null;
  }

  // reset the player position to the initial position
  // this is used when scene changing takes player
  reset() {
    const playerPos = Constants.PLAYER_INITIAL_POS;

    this.playerObject.position.set(playerPos.x, playerPos.y, playerPos.z);
    this.camera.position.set(playerPos.x, playerPos.y, playerPos.z);
    this.camera.lookAt(playerPos.x + 1, playerPos.y, playerPos.z);
  }

  // set the player's position to anywhere in the world
  // sets where the camera should look at
  setPosition(x, z, lx, lz) {
    console.log(x, z, lx, lz);
    this.playerObject.position.set(
      x * Constants.WALL_SIZE,
      this.playerObject.position.y,
      z * Constants.WALL_SIZE
    );
    this.camera.position.set(
      x * Constants.WALL_SIZE,
      this.camera.position.y,
      z * Constants.WALL_SIZE
    );
    this.camera.lookAt(lx * Constants.WALL_SIZE, 10, lz * Constants.WALL_SIZE);
  }

  //s load the 3d model
  loadModel() {
    const loader = new GLTFLoader();
    const path = "assets/models/";
    const extension = ".glb";
    return new Promise((resolve, reject) => {
      loader.load(path + "Grim" + extension, (gltf) => {
        const scene = gltf.scene;
        scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            // child.material.side = DoubleSide;
          }
        })
        console.log(scene);
        scene.position.set(0, -7, 3);
        scene.rotateY(Math.PI / 2)
        scene.scale.set(5, 8, 5);
        this.playerObject.add(gltf.scene);

        // setups the animation 
        this.animMixer = new AnimationMixer(scene);
        this.animMixer.timeScale = 1.5;
        var walk = this.animMixer.clipAction(gltf.animations[4]);
        walk.play()
        resolve("success")
      })
    })
  }

  // initialize the pointer lock controls for the player
  initControls(domElement) {
    const controls = new PointerLockControls(this.camera, domElement);
    controls.maxPolarAngle = (29 * Math.PI) / 30;
    controls.minPolarAngle = (1 * Math.PI) / 30;
    controls.addEventListener("unlock", () => {
      if (!state.gameover) this.openPauseMenu();
    });
    return controls;
  }

  openPauseMenu() {
    var pauseMenu = document.getElementById("pause");
    pauseMenu.classList.remove("hidden");
    state.isPlaying = false;
  }

  setUpPauseScreen() {
    var pause = document.getElementById("pause");

    document.getElementById("resume-button").addEventListener("click", () => {
      state.isPlaying = true;
      this.controls.lock();
      pause.classList.add("hidden");
    });
  }

  // setup the keypress and the corresponding actions
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

        // case "Space":
        //   self.velocity.y = 2;
        //   break;

        // case "KeyZ":
        //   self.velocity.y = -2;
        //   break;
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
        case "KeyF":
          this.toggleTorch();
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
          this.toggleTorch();
          break;
      }
    };

    // what does this do?
    const onRightClick = (event) => {
      if (!state.isPlaying) return;
      this.turnTorchOff();
    };
    document.addEventListener("contextmenu", onRightClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("click", onClick);
  }

  setUpInteraction() {
    const onKeyUp = async (event) => {
      if (!state.isPlaying) return;
      switch (event.code) {
        case "KeyE":
          await this.onInteractCB();
          break;
      }
    };
    document.addEventListener("keyup", onKeyUp);
  }

  // changes the intensity of the torch
  // to give the effect that the torch is being turned on and off
  // visibility is chosen instead of visibility because of performance reasons
  toggleTorch() {
    if (this.torchOn) this.torch.intensity = 0;
    else this.torch.intensity = 1.5;

    this.torchOn = !this.torchOn;
  }
  turnTorchOff() {
    this.torchOn = false;
    this.torch.intensity = 0;
  }

  update(time, scene) {
    this.handleMovement();
    this.raycastForward(scene);
    this.handleTorch();
    if (this.isMoving())
      this.animMixer.update(time);
    this.candle.update(time);
  }
  updatePosition() {
    const pos = this.playerObject.position;
    this.camera.position.set(pos.x, this.camera.position.y, pos.z);
  }
  // changes if the player is moving
  isMoving() {
    if (
      this.moveForward ||
      this.moveLeft ||
      this.moveRight ||
      this.moveBackward
    ) {
      return true;
    } else {
      return false;
    }
  }


  initTorch() {
    // const mapSize = Constants.MAP_SIZE;
    var torch = new SpotLight(0xffffff);
    torch.visible = true;
    torch.shadow.bias = -0.0001;
    torch.castShadow = true;
    torch.intensity = 0;
    // torch.shadow.mapSize.width = 1024;
    // torch.shadow.mapSize.height = 1024;
    torch.penumbra = 1;
    torch.decay = 5;
    torch.distance = 2000;
    torch.shadow.mapSize.width = 2048;
    torch.shadow.mapSize.height = 2048;
    torch.shadow.camera.far = 100;
    torch.angle = Math.PI / 7;
    return torch;
  }

  async initCandle() {
    const candle = new Candle();
    await candle.loadModel();
    this.candle = candle;

    this.playerObject.add(this.candle.model);
    //this.camera.add(this.candle.model);
  }

  handleTorch() {
    this.torch.position.set(0, 0, 1);
    this.torch.target = this.camera;
  }

  handleMovement() {
    const speed = Constants.PLAYER_MOVE_SPEED; // TODO: change to normal
    const time = performance.now();

    // get the direction by subtracting booleans
    // since only one of the 2 can be true at any instance
    this.direction.x = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.z = Number(this.moveRight) - Number(this.moveLeft);
    //this.direction.normalize(); // this ensures consistent movements in all directions

    // constant velocity
    // the direction of the impulse;
    let moveDirection = new Vector3(0, 0, 0);

    const lookDirection = this.controls.getDirection(new Vector3(0, 0, 0));

    if (this.moveForward || this.moveBackward) {
      moveDirection.addVectors(
        moveDirection,
        lookDirection.multiplyScalar(this.direction.x)
      );
    }

    const rightDirection = new Vector3(
      lookDirection.x,
      lookDirection.y,
      lookDirection.z
    ).applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
    if (this.moveLeft || this.moveRight) {
      let d = 1;
      if (this.moveBackward) d = -1;
      moveDirection.addVectors(
        moveDirection,
        rightDirection.multiplyScalar(d * this.direction.z)
      );
    }
    moveDirection.y = 0;

    moveDirection.normalize();

    // set up the impulse for movement
    if (moveDirection.x == 0 && moveDirection.y == 0 && moveDirection == 0)
      return;

    let resultantImpulse = new Ammo.btVector3(
      moveDirection.x,
      moveDirection.y,
      moveDirection.z
    );
    resultantImpulse.op_mul(speed);

    let physicsBody = this.playerObject.userData.physicsBody;
    physicsBody.setLinearVelocity(resultantImpulse);

    this.camera.position.y += this.velocity.y;
    this.playerObject.position.y += this.velocity.y;

    var direction = this.camera
      .getWorldDirection(new Vector3(0, 0, 0))
      .normalize();
    direction.y = 0;
    var z = new Vector3(0, 0, -1);
    var angle = z.angleTo(direction);
    if (direction.x < 0) {
      angle = 2 * Math.PI - angle;
    }
    this.playerObject.rotation.y = -angle;

    // this.camera.position.x += 1;
    this.prevTime = time;
  }

  raycastForward(scene) {
    this.raycaster.set(
      this.controls.getObject().position,
      this.camera.getWorldDirection(new Vector3(0, 0, 0))
    );

    const intersects = this.raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      this.intersect = intersects[0].object;
      if (
        this.intersect.name.includes("saferoom") ||
        this.intersect.name.includes("maze")
      ) {
        const element = document.getElementById("button-prompt");
        element.style.visibility = "visible";

        switch (this.intersect.name) {
          case "saferoom1entrance":
            element.innerText = "Press E to enter Maze 1";
            break;
          case "saferoom1exit":
            element.innerText = "Press E to enter Maze 2";
            break;
          case "saferoom2entrance":
            element.innerText = "Press E to enter Maze 2";
            break;
          case "saferoom2exit":
            element.innerText = "Press E to enter Maze 3";
            break;
          default:
            element.innerText = "Press E";
        }
      }
    } else {
      this.intersect = null;
      const element = document.getElementById("button-prompt");
      element.style.visibility = "hidden";
    }
  }


}

export default PlayerController;
