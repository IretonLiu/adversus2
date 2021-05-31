import Utils from "./Utils";
import Constants from "./Constants";
import Monster from "./Monster";

import * as THREE from "three";

class MonsterManager {
  constructor(scene, player, grid, clock) {
    this.fear = 0;
    this.player = player;
    this.scene = scene;
    this.grid = grid;
    this.monster = null;
    this.clock = clock;

    this.playerSpawnRadius = 3;
  }

  despawnMonster() {
    this.monster.remove();
    this.monster = null;
  }

  spawnMonster() {
    let monsterPosition = {
      x: (2 * Constants.MAP1_SIZE - 1) * Constants.WALL_SIZE,
      y: 0,
      z: (2 * Constants.MAP1_SIZE - 1) * Constants.WALL_SIZE,
    };
    this.monster = new Monster(monsterPosition, this.scene, this.clock);
    var playerPosition = Utils.convertThickGridToWorld(
      Utils.convertWorldToThickGrid(this.player.position)
    );
    this.monster.getAstarPath(
      this.grid,
      playerPosition
      // new THREE.Vector3(1 * Constants.WALL_SIZE, 0, 1 * Constants.WALL_SIZE)
    );
  }

  update() {
    if (this.monster) {
      if (this.monster.path == "") {
        this.despawnMonster();
        return;
      }
      this.monster.update();
    }
  }

  updateMonsterPath() {
    if (this.monster) {
      var playerPosition = Utils.convertThickGridToWorld(
        Utils.convertWorldToThickGrid(this.player.position)
      );
      this.monster.getAstarPath(this.grid, playerPosition);
    }
  }
}

export default MonsterManager;
