import {
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  MeshStandardMaterial,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Astar } from "./pathfinder/astar";
import Constants from "./Constants";

class Monster {
  constructor(position, inverseSpeed,scene) {
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
    // const monsterGeometry = new CylinderGeometry(5, 5, 10, 20);
    // const monsterMaterial = new MeshStandardMaterial({ color: 0xff0000 });
    // const monster = new Mesh(monsterGeometry, monsterMaterial);
    // monster.position.set(this.position.x, this.position.y, this.position.z);
    // return monster;

    const loader = new GLTFLoader();
    loader.load("../assets/models/monster/scene.gltf", (gltf) => {
      this.monsterObject = gltf.scene;
      this.monsterObject.position.set(this.position.x, this.position.y-10, this.position.z);
      this.monsterObject.scale.set(10,10,10);
      this.scene.add(this.monsterObject)

    });
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

  update(scene) {
    if (!this.monsterObject) return;
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
    this.monsterObject.lookAt(new Vector3(dir.x,-10,dir.z).add(this.position));

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
