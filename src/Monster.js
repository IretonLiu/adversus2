import {
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  Vector2,
  Vector3,
  MeshStandardMaterial,
  Raycaster,
  Frustum,
  Matrix4,
  PerspectiveCamera,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Astar } from "./pathfinder/astar";
import Constants from "./Constants";

class Monster {
  constructor(position, inverseSpeed, scene) {
    // position is the monster's current position
    this.position = position;

    this.scene = scene;

    // velocity is constant
    this.velocity = Constants.WALL_SIZE;

    // inverseSpeed is the multiplier to slow down the movement of the monster
    this.inverseSpeed = 1 / inverseSpeed;

    // timeCount is used to decide when to move on to the next direction
    this.timeCount = 0;

    // path is the list of directions monster must follow to get to target
    this.path = "";

    this.monsterObject = null;
    this.initThreeObject();
  }

  initThreeObject() {
    const monsterGeometry = new CylinderGeometry(5, 5, 10, 20);
    const monsterMaterial = new MeshStandardMaterial({ color: 0xff0000 });
    this.monsterObject = new Mesh(monsterGeometry, monsterMaterial);
    this.monsterObject.position.set(
      this.position.x,
      this.position.y - 10,
      this.position.z
    );

    this.scene.add(this.monsterObject);
    // return monster;

    // const loader = new GLTFLoader();
    // loader.load("../assets/models/monster/scene.gltf", (gltf) => {
    //   this.monsterObject = gltf.scene;
    //   this.monsterObject.position.set(
    //     this.position.x,
    //     this.position.y - 10,
    //     this.position.z
    //   );
    //   this.monsterObject.scale.set(10, 10, 10);
    //   this.scene.add(this.monsterObject);
    // });
  }

  // target in world coords
  getAstarPath(grid, target) {
    const astar = new Astar(
      grid,
      Math.ceil(this.position.x / Constants.WALL_SIZE),
      Math.ceil(this.position.z / Constants.WALL_SIZE),
      Math.ceil(target.x / Constants.WALL_SIZE),
      Math.ceil(target.z / Constants.WALL_SIZE)
    );
    astar.calculatePath();
    this.path = astar.getCurrentPath();

    console.log(target, this.path);
  }

  detLookAtVector(camera) {
    var lookAtVector = new Vector3(0, 0, -1);
    lookAtVector.applyQuaternion(camera.quaternion);
    lookAtVector.x += camera.position.x;
    lookAtVector.y += camera.position.y;
    lookAtVector.z += camera.position.z;

    return lookAtVector;
  }

  isInTorchBeam(playerController) {
    let camera = new PerspectiveCamera(
      (180 * playerController.torch.angle) / Math.PI + 10,
      window.innerWidth / window.innerHeight,
      0.1,
      Constants.CAMERA_FAR
    );
    camera.position.set(
      playerController.camera.position.x,
      playerController.camera.position.y,
      playerController.camera.position.z
    );

    const lookAtVector = this.detLookAtVector(playerController.camera);
    camera.lookAt(lookAtVector.x, lookAtVector.y, lookAtVector.z);

    var frustum = new Frustum();
    var cameraViewProjectionMatrix = new Matrix4();

    // every time the camera or objects change position (or every frame)

    camera.updateMatrixWorld(); // make sure the camera matrix is updated
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    cameraViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    // frustum is now ready to check all the objects you need

    return frustum.intersectsObject(this.monsterObject);
  }

  isVisible(playerController) {
    if (this.monsterObject === null) return;

    playerController.camera.updateMatrixWorld();

    if (this.isInTorchBeam(playerController)) {
      let vector = new Vector3(
        this.monsterObject.position.x,
        this.monsterObject.position.y,
        this.monsterObject.position.z
      );

      let raycaster = new Raycaster(
        playerController.camera.position,
        vector.sub(playerController.camera.position).normalize()
      );

      var intersects = raycaster.intersectObjects(this.scene.children, true);

      if (intersects.length) {
        const intersect = intersects[0];
        console.log();
        if (intersect.object.geometry.type === "CylinderGeometry") return true;
        else return false;
      }
      return false;
    } else {
      return false;
    }
  }

  update() {
    if (!this.monsterObject) return;

    if (this.path === "") return;

    this.timeCount++;

    var dirRep = this.path.charAt(this.path.length - 1); // the char representation of the path
    var dir;
    switch (dirRep) {
      case Constants.NORTH:
        dir = { x: 0, z: -1 };
        break;
      case Constants.SOUTH:
        dir = { x: 0, z: 1 };
        break;
      case Constants.WEST:
        dir = { x: -1, z: 0 };
        break;
      case Constants.EAST:
        dir = { x: 1, z: 0 };
        break;
    }

    this.position.x += this.inverseSpeed * this.velocity * dir.x;
    this.position.z += this.inverseSpeed * this.velocity * dir.z;
    this.monsterObject.position.x = this.position.x;
    this.monsterObject.position.z = this.position.z;
    this.monsterObject.lookAt(
      new Vector3(dir.x, -10, dir.z).add(this.position)
    );

    if ((this.timeCount * this.inverseSpeed) % 1 === 0) {
      // const breadCrumb = new CylinderGeometry(2, 2, 5);
      // const bcMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
      // var bc = new Mesh(breadCrumb, bcMaterial);
      // bc.position.x = this.position.x;
      // bc.position.z = this.position.z;
      // scene.add(bc);

      // remove the current direction from the path
      this.path = this.path.slice(0, this.path.length - 1);
    }
  }
}

export default Monster;
