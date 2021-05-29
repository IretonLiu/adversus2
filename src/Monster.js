import {
  Mesh,
  Vector3,
  MeshStandardMaterial,
  Raycaster,
  Frustum,
  Matrix4,
  PerspectiveCamera,
  BoxGeometry,
  Box3,
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

    // record the monster's size - Vector3
    // have a buffer
    this.size = new Vector3(2, 2, 2);

    // create the monster visuals
    this.initThreeObject();
  }

  initThreeObject() {
    // const monsterGeometry = new CylinderGeometry(5, 5, 10, 20);
    // const monsterMaterial = new MeshStandardMaterial({ color: 0xff0000 });

    // this.monsterObject = new Mesh(monsterGeometry, monsterMaterial);

    // this.monsterObject.add(new Mesh(monsterGeometry, monsterMaterial));

    const loader = new GLTFLoader();
    loader.load("../assets/models/monster/scene.gltf", (gltf) => {
      // load custom model
      const model = gltf.scene;

      // set model size and position
      model.scale.set(10, 10, 10);
      model.translateY(-10);

      // determine the size of the model
      let bbox = new Box3().setFromObject(model);
      this.size.add(bbox.getSize(new Vector3())); // get and update the size

      // create an invisible bounding box for the model
      const boundingBoxGeometry = new BoxGeometry(
        this.size.x,
        this.size.y,
        this.size.z
      );
      const boundingBoxMaterial = new MeshStandardMaterial({ color: 0xffffff });
      boundingBoxMaterial.visible = false;

      this.monsterObject = new Mesh(boundingBoxGeometry, boundingBoxMaterial);

      // set the id to be used by raycaster
      this.checkVisibleId = this.monsterObject.geometry.uuid;

      // set monster position
      this.monsterObject.add(model);
      this.monsterObject.position.set(
        this.position.x,
        this.position.y,
        this.position.z
      );

      // add the monster to the scene
      this.scene.add(this.monsterObject);
    });
  }

  getLeftmostPoint(camera) {
    // check the leftmost point from the two horizontal planes
    const leftX = new Vector3(
      this.monsterObject.position.x - this.size.x / 2,
      this.monsterObject.position.y,
      this.monsterObject.position.z
    );

    const leftZ = new Vector3(
      this.monsterObject.position.x,
      this.monsterObject.position.y,
      this.monsterObject.position.z - this.size.z / 2
    );

    camera.updateMatrixWorld();

    // whichever projection puts the monster further left, return the corresponding point
    if (leftX.clone().project(camera).x < leftZ.clone().project(camera).x) {
      return leftX;
    } else {
      return leftZ;
    }
  }

  getRightmostPoint(camera) {
    // check the rightmost point from the two horizontal planes
    const leftX = new Vector3(
      this.monsterObject.position.x + this.size.x / 2,
      this.monsterObject.position.y,
      this.monsterObject.position.z
    );

    const leftZ = new Vector3(
      this.monsterObject.position.x,
      this.monsterObject.position.y,
      this.monsterObject.position.z + this.size.z / 2
    );

    camera.updateMatrixWorld();

    // whichever projection puts the monster further right, return the corresponding point
    if (leftX.clone().project(camera).x > leftZ.clone().project(camera).x) {
      return leftX;
    } else {
      return leftZ;
    }
  }

  getTopmostPoint() {
    // get the topmost point in the vertical plane
    return new Vector3(
      this.monsterObject.position.x,
      this.monsterObject.position.y + this.size.y / 2,
      this.monsterObject.position.z
    );
  }

  getBottommostPoint() {
    // get the bottommost point in the vertical plane
    return new Vector3(
      this.monsterObject.position.x,
      this.monsterObject.position.y - this.size.y / 2,
      this.monsterObject.position.z
    );
  }

  getBufferAngle(camera) {
    camera.updateMatrixWorld();

    // determine the biggest side - will correspond to the biggest buffer angle (approx.)
    const left = this.getLeftmostPoint(camera);
    const right = this.getRightmostPoint(camera);
    const top = this.getTopmostPoint(camera);
    const bottom = this.getBottommostPoint(camera);

    // get the corresponding direction vectors to the monster's extremeties
    const vectLeft = left.sub(camera.position);
    const vectRight = right.sub(camera.position);
    const vectTop = top.sub(camera.position);
    const vectBottom = bottom.sub(camera.position);

    // determine the horizontal and vertical angles
    const horizontal = vectLeft.angleTo(vectRight);
    const vertical = vectBottom.angleTo(vectTop);

    // return the biggest angle
    return Math.max(horizontal, vertical);
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

    // calculate path from current position to aforementioned target, using astar
    astar.calculatePath();
    this.path = astar.getCurrentPath();
  }

  detLookAtVector(camera) {
    let lookAtVector = new Vector3(0, 0, -1);
    lookAtVector.applyQuaternion(camera.quaternion);
    // lookAtVector.x += camera.position.x;
    // lookAtVector.y += camera.position.y;
    // lookAtVector.z += camera.position.z;

    return lookAtVector;
  }

  isInTorchBeam(playerController) {
    // create a copy so don't alter real values
    let monsterPosition = this.monsterObject.position.clone();

    // get direction of monster from current point
    const monsterDirection = monsterPosition
      .sub(playerController.camera.position)
      .normalize();

    // get direction camera is pointing
    const cameraDirection = this.detLookAtVector(
      playerController.camera
    ).normalize();

    // check the angle between the directions - needs to be less than torch angle
    const angle = monsterDirection.angleTo(cameraDirection);

    // get the angle corresponding to the monster's width
    const bufferAngle = this.getBufferAngle(playerController.camera);

    return angle <= playerController.torch.angle + bufferAngle / 2;
  }

  isVisible(playerController) {
    // check if monster actually exists
    if (this.monsterObject === null) return false;

    // need to get the updated matrix representation
    playerController.camera.updateMatrixWorld();

    // cast a ray to the monster's extremeties
    let targets = [
      this.getLeftmostPoint(playerController.camera),
      this.getRightmostPoint(playerController.camera),
      this.getTopmostPoint(playerController.camera),
      this.getBottommostPoint(playerController.camera),
    ];

    // check of the monster is even in the torch
    if (this.isInTorchBeam(playerController)) {
      let raycaster = new Raycaster();

      for (let vector of targets) {
        // cast a ray to this vector
        raycaster.set(
          playerController.camera.position,
          vector.sub(playerController.camera.position).normalize()
        );

        // check if we intersect the monster FIRST (if not first, monster is behind something)
        let intersects = raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length) {
          const intersect = intersects[0];
          // check the mesh id's match
          if (intersect.object.geometry.uuid === this.checkVisibleId)
            return true;
        }
      }

      // if get here, then have tried all the target vectors and none match, so object is obscured
      return false;
    }

    // if get here, monster is obscured, or not in torch
    return false;
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
    this.monsterObject.lookAt(new Vector3(dir.x, 0, dir.z).add(this.position));

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
