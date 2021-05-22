import { CylinderGeometry, Mesh, MeshBasicMaterial } from "three";
import { Astar } from "./pathfinder/astar";
import constants from "./constants";

class Monster {
  constructor(position, inverseSpeed) {
    // position is the monster's current position
    this.position = position;

    // velocity is constant
    this.velocity = 20;

    // inverseSpeed is the multiplier to slow down the movement of the monster
    this.inverseSpeed = 1 / inverseSpeed;

    // timeCount is used to decide when to move on to the next direction
    this.timeCount = 0;

    // path is the list of directions monster must follow to get to target
    this.path = "";

    this.monsterObject = this.initThreeObject();
  }

  initThreeObject() {
    const monsterGeometry = new CylinderGeometry(5, 5, 10, 20);
    const monsterMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const monster = new Mesh(monsterGeometry, monsterMaterial);
    monster.position.set(this.position.x, this.position.y, this.position.z);
    return monster;
  }

  getAstarPath(grid, target) {
    const astar = new Astar(
      grid,
      Math.floor(this.position.x / 20),
      Math.floor(this.position.z / 20),
      Math.floor(target.x / 20),
      Math.floor(target.z / 20)
    );
    astar.calculatePath();
    this.path = astar.getCurrentPath();
  }

  update(scene) {
    this.timeCount++;

    var dirRep = this.path.charAt(this.path.length - 1); // the char representation of the path
    var dir;
    switch (dirRep) {
      case constants.NORTH:
        dir = { x: 0, z: -1 };
        break;
      case constants.SOUTH:
        dir = { x: 0, z: 1 };
        break;
      case constants.WEST:
        dir = { x: -1, z: 0 };
        break;
      case constants.EAST:
        dir = { x: 1, z: 0 };
        break;
    }

    this.position.x += this.inverseSpeed * this.velocity * dir.x;
    this.position.z += this.inverseSpeed * this.velocity * dir.z;
    this.monsterObject.position.x = this.position.x;
    this.monsterObject.position.z = this.position.z;

    if ((this.timeCount * this.inverseSpeed) % 1 === 0) {
      const breadCrumb = new CylinderGeometry(2, 2, 5);
      const bcMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
      var bc = new Mesh(breadCrumb, bcMaterial);
      bc.position.x = this.position.x;
      bc.position.z = this.position.z;
      scene.add(bc);

      // remove the current direction from the path
      this.path = this.path.slice(0, this.path.length - 1);
    }
  }
}

export default Monster;
