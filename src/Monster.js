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
  Vector2,
  Clock,
  AnimationMixer,
  SphereBufferGeometry,
  Material,
  PointLight,
  Group,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Astar } from "./pathfinder/astar";
import Constants from "./Constants";
import Utils from "./Utils";
import playerController from "./PlayerController";

class Monster {
  constructor(position, scene, onLoaded) {
    // position is the monster's current position in world coordinates
    this.position = new Vector3(position.x, position.y, position.z);
    // local refernce to the scene
    this.scene = scene;

    //this.playerController = playerController;

    // keep track of the game clock
    this.clock = new Clock();

    // monster's speed
    this.speed = Constants.MONSTER_SPEED;

    // path is the list of points monster must go through to get to target
    // NB - last element is the next point
    this.path = [];

    // have a backtracking flag
    this.backtracking = false;

    // monster 3D object
    this.monsterObject = null;

    // animation mixer
    this.animMixer = null;

    // record the monster's size - Vector3
    // have a buffer
    this.size = new Vector3(2, 2, 2);

    // create the monster visuals
    this.initThreeObject(onLoaded);
  }

  initThreeObject(onLoaded) {
    const loader = new GLTFLoader();
    loader.load("assets/models/monster.glb", (gltf) => {
      // load custom model
      const model = gltf.scene;

      // set model size and position
      model.scale.set(7, 8, 7);
      model.translateY(-7);
      model.rotateY(-Math.PI / 2)

      const eye = new Group();
      const eyeLight = new PointLight(0xab1600, 1, 10);
      const eyeBall = new Mesh(new SphereBufferGeometry(0.1, 2, 2), new MeshStandardMaterial({ emissive: 0xff0000 }));
      eye.add(eyeLight);
      eye.add(eyeBall);
      eye.position.set(-0.8, 12, 11.5)


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
      this.monsterObject.add(eye)
      this.monsterObject.position.set(
        this.position.x,
        this.position.y,
        this.position.z
      );

      // add the monster to the scene
      this.scene.add(this.monsterObject);
      console.log(model.animations)
      this.animMixer = new AnimationMixer(model);
      this.animMixer.timeScale = 1;

      var chase = this.animMixer.clipAction(gltf.animations[1]);
      chase.play();

      console.log(model);
      // setup animation
      // this.animMixer = new AnimationMixer(model);


      onLoaded();
    });
  }

  remove() {
    this.scene.remove(this.monsterObject);
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
    // convert target and monster position to grid coordinates
    const targetGrid = Utils.convertWorldToThickGrid(target);
    const monsterGrid = Utils.convertWorldToThickGrid(this.position);

    const astar = new Astar(
      grid,
      monsterGrid.x,
      monsterGrid.y,
      targetGrid.x,
      targetGrid.y
    );

    // calculate path from current position to aforementioned target, using astar
    astar.calculatePath();
    this.path = astar.getCurrentPath();

    // we have a new path, so we don't have any backtracking available yet
    // this.backtrackPath = [];
    // this.backtracking = false;

    // have a new path - moving forwards
    this.setSpeed(Constants.MONSTER_SPEED);
  }

  isInViewAngle(playerController, viewAngle) {
    // this function will determine if the monster is within the angle to the normal (defined by looking direction)
    // viewAngle is in radians

    // create a copy so don't alter real values
    let monsterPosition = this.monsterObject.position.clone();

    // get direction of monster from current point
    const monsterDirection = monsterPosition
      .sub(playerController.camera.position)
      .normalize();

    // get direction camera is pointing
    const cameraDirection = Utils.detLookingDirection(
      playerController.camera
    ).normalize();

    // check the angle between the directions - needs to be less than torch angle
    const angle = monsterDirection.angleTo(cameraDirection);

    // get the angle corresponding to the monster's width
    let bufferAngle = this.getBufferAngle(playerController.camera);
    if (viewAngle < ((playerController.camera.fov / 180) * Math.PI) / 2) {
      // torch
      bufferAngle = 0;
    } else {
      // viewport
      bufferAngle = 0;
    }

    // console.log(angle, viewAngle + bufferAngle);
    return angle <= viewAngle + bufferAngle;
  }

  isHiddenByFog(playerController) {
    // deterine if the monster is hidden by the fog or not
    // return true if CANNOT see

    // don't do anything if the monster doesn't exist - may as well say can't see it
    if (this.monsterObject === null) return true;

    // can't see anything beyond the fog
    return (
      this.monsterObject.position.distanceTo(playerController.camera.position) >
      Constants.FOG_FAR * 0.88 // add 10% buffer to fog threshold
    );
  }

  isInFront(playerController) {
    // do raycasting to the monster's extremities to see if it is hidden by anything

    // cast a ray to the monster's extremeties - can't move up/down so don't check top/bottom
    let targets = [
      this.getLeftmostPoint(playerController.camera),
      this.getRightmostPoint(playerController.camera),
      this.monsterObject.position,
      // this.getTopmostPoint(playerController.camera),
      // this.getBottommostPoint(playerController.camera),
    ];

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
        // intersects is ordered by distance, so the first is the closest intersection
        const intersect = intersects[0];
        // check the mesh id's match
        // if they do, our first intersection is the monster
        if (intersect.object.geometry.uuid === this.checkVisibleId) return true;
      }
    }

    // if get here, then have tried all the target vectors and none match, so object is obscured
    return false;
  }

  isVisible(playerController, inTorch) {
    // check if the monster is on screen (could be visible in low light)

    // check if monster actually exists
    if (this.monsterObject === null) return false;

    // need to get the updated matrix representation
    playerController.camera.updateMatrixWorld();

    // if want to check in torch, make sure torch is actually turned on
    if (inTorch) {
      if (!playerController.torchOn) return false;
    }

    // inTorch if want to check if it is in the torch's beam
    const viewAngle = inTorch
      ? playerController.torch.angle
      : ((playerController.camera.fov / 180) * Math.PI) / 2; // convert to radians and divide by two (relative to normal)

    // check if the monster is hidden in the fog
    if (this.isHiddenByFog(playerController)) return false;

    // if get here, then the monster is not hidden by fog

    // check of the monster is even in the frustum
    if (this.isInViewAngle(playerController, viewAngle)) {
      // monster is not hidden by fog, and is in the viewing angle
      // check if it is hidden by other objects
      return this.isInFront(playerController);
    }

    // if get here, monster is obscured, or not in view
    return false;
  }

  setSpeed(speed) {
    // update the monster's speed
    this.speed = speed;
  }

  startBacktrack() {
    // set the backtracking flag
    this.backtracking = true;

    // we are backtracking - run away quickly
    this.setSpeed(Constants.MONSTER_SPEED * 2);
  }

  update(deltaTime) {
    // don't do anything if the monster doesn't exist
    if (!this.monsterObject) return;

    // this.Mesh.position.setX(this.monsterObject.position.x)
    // this.Mesh.position.setY(this.monsterObject.position.y)
    // this.Mesh.position.setZ(this.monsterObject.position.z)
    // get movement direction as direction from current position to astar next position
    let nextPoint = this.path[this.path.length - 1]; // the array representation of the path

    // expected world point
    let expectedWorldPosition = Utils.convertThickGridToWorld(nextPoint);

    // direction vector to new world position
    let worldDirection = expectedWorldPosition
      .clone()
      .sub(this.position)
      .normalize();

    // update the monster's position using the delta time
    //const deltaTime = this.clock.getDelta();

    this.position.x += deltaTime * this.speed * worldDirection.x;
    this.position.z += deltaTime * this.speed * worldDirection.z;
    this.monsterObject.position.x = this.position.x;
    this.monsterObject.position.z = this.position.z;
    this.monsterObject.lookAt(
      new Vector3(worldDirection.x, 0, worldDirection.z).add(this.position)
    );

    if (
      Utils.isInRadiusOfPoint(
        this.position,
        expectedWorldPosition,
        Constants.MONSTER_RADIUS
      )
    ) {
      // if monster is within a radius around the next point in the path, then remove that point from the path (we have reached it)
      // keep track of the previously travelled-to points
      // this.backtrackPath.push(this.path.pop());
      this.path.pop();
    }
    this.animMixer.update(deltaTime)
  }
}

export default Monster;
