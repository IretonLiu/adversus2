import SoundManager from "./SoundManager"
import {
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  MeshStandardMaterial,
  Vector2,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Astar } from "./pathfinder/astar";
import Constants from "./Constants";
import Utils from "./Utils";
import playerController from "./PlayerController"

class Monster {
  constructor(position, scene, clock, playerController) {
    // position is the monster's current position in world coordinates
    this.position = new Vector3(position.x, position.y, position.z);

    // local refernce to the scene
    this.scene = scene;

    this.playerController = playerController;

    // keep track of the game clock
    this.clock = clock;

    // monster's speed
    this.speed = Constants.MONSTER_SPEED;

    // path is the list of points monster must go through to get to target
    // NB - last element is the next point
    this.path = [];

    this.Mesh = new Mesh;

    this.monsterObject = null;
    this.initThreeObject();
    

  }

  initThreeObject() {
    // const monsterGeometry = new CylinderGeometry(5, 5, 10, 20);
    // const monsterMaterial = new MeshStandardMaterial({ color: 0xff0000 });
    // const monster = new Mesh(monsterGeometry, monsterMaterial);
    // monster.position.set(this.position.x, this.position.y, this.position.z);
    // return monster;

    const loader = new GLTFLoader();
    loader.load("../assets/models/monster/scene.gltf", (gltf) => {
      this.monsterObject = gltf.scene;
      this.monsterObject.position.set(
        this.position.x,
        this.position.y - 10,
        this.position.z,
      );
      this.monsterObject.scale.set(10, 10, 10);
      this.scene.add(this.monsterObject);
    });
    this.soundmanager = new SoundManager(this.Mesh ,this.playerController, 'assets/Sounds/monster.mp3');
  }

  remove(){
    this.scene.remove(this.monsterObject);
  }

  getAstarPath(grid, target) {
    const astar = new Astar(
      grid,
      Math.floor(this.position.x / Constants.WALL_SIZE),
      Math.floor(this.position.z / Constants.WALL_SIZE),
      Math.floor(target.x / Constants.WALL_SIZE),
      Math.floor(target.z / Constants.WALL_SIZE)
    );
    astar.calculatePath();
    this.path = astar.getCurrentPath();
  }

  setSpeed(speed) {
    // update the monster's speed
    this.speed = speed;
  }

  update() {
    // don't do anything if the monster doesn't exist
    if (!this.monsterObject) return;

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
    const deltaTime = this.clock.getDelta();

    this.position.x += deltaTime * this.speed * worldDirection.x;
    this.position.z += deltaTime * this.speed * worldDirection.z;
    this.monsterObject.position.x = this.position.x;
    this.monsterObject.position.z = this.position.z;
    this.monsterObject.lookAt(
      new Vector3(worldDirection.x, -10, worldDirection.z).add(this.position)
    );

    if (
      Utils.isInRadiusOfPoint(
        this.position,
        expectedWorldPosition,
        Constants.MONSTER_RADIUS
      )
    ) {
      // if monster is within a radius around the next point in the path, then remove that point from the path (we have reached it)
      this.path.pop();
    }
    this.soundmanager.bind(this.monsterObject);
  }
}

export default Monster;
