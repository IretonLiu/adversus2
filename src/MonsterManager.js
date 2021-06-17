import Utils from "./Utils";
import Constants from "./Constants";
import Monster from "./Monster";
import SoundManager from "./SoundManager";
import * as THREE from "three";
import { Mesh, StaticReadUsage, Vector2 } from "three";
import state from "./State";

class MonsterManager {
  constructor(scene, player, grid, clock) {
    this.fear = 0;
    this.player = player;
    this.scene = scene;
    this.grid = grid;
    this.monster = null;
    this.soundmanager = null;
    // TODO: this clock can potentially cause problems
    this.clock = new THREE.Clock(); //clock;

    this.playerSpawnRadius = 4;
    this.minRadius = 2;
    this.percentageExplored = 0;
  }

  setNewScene(scene, grid) {
    // remove the monster
    this.despawnMonster();

    // update the active scene
    this.scene = scene;

    // update the active grid
    this.grid = grid;

    // reset parameters
    this.fear = 0;
    this.percentageExplored = 0;
  }

  fearDecision() {
    if (!this.monster) {
      if (this.fear > 20) {
        var spawnableCells = this.getCellsInRadius();
        if (spawnableCells.length == 0) return;
        var spawnLocation =
          spawnableCells[Math.floor(Math.random() * spawnableCells.length)];
        this.spawnMonster(spawnLocation);
      }
    }
  }

  updatePercentageExplored(percExplored) {
    if (percExplored > this.percentageExplored) {
      this.fear += 1.5;
    }
    this.percentageExplored = percExplored;
  }

  despawnMonster() {
    if (this.monster) {
      this.soundmanager.pause();
      this.soundmanager = null;
      this.monster.remove();
      this.monster.mesh = null;
      this.monster = null;
    }
  }

  spawnMonster(monsterGridLoc) {
    var monsterWorldPos = Utils.convertThickGridToWorld(monsterGridLoc);
    this.monster = new Monster(monsterWorldPos, this.scene, () => {
      this.soundmanager = new SoundManager(
        this.monster.monsterObject,
        this.player.playerController,
        "assets/Sounds/JockeySounds.mp3"
      );
    });
    var playerPosition = Utils.convertThickGridToWorld(
      Utils.convertWorldToThickGrid(this.player.position)
    );
    this.monster.getAstarPath(
      this.grid,
      playerPosition
      // new THREE.Vector3(1 * Constants.WALL_SIZE, 0, 1 * Constants.WALL_SIZE)
    );
  }

  backtrackMonster() {
    // cause the monster to retrace its steps
    // only start the backtrack if we aren't already doing so
    const furthestCorner = this.getFurthestCorner();
    console.log(furthestCorner);
    this.monster.getAstarPath(this.grid, Utils.convertThickGridToWorld(furthestCorner));
    if (!this.monster.backtracking) this.monster.startBacktrack();
  }

  update() {
    if (this.monster) {
      //console.log(this.monster.position.distanceTo(this.player.playerController.camera.position))
      if (
        Utils.convertWorldToThickGrid(this.monster.position).equals(
          Utils.convertWorldToThickGrid(
            this.player.playerController.camera.position
          )
        )
      ) {
        state.isPlaying = false;
        var loseScreen = document.getElementById("lose-screen");
        loseScreen.classList.remove("hidden");
        state.gameover = true;
        this.player.playerController.controls.unlock();
        document.getElementById("restart-button-2").onclick = () => {
          location.reload();
        };

        return;
      }
      if (this.monster.backtracking) {
        if (!this.monster.isVisible(this.player.playerController, false)) {
          this.despawnMonster();
          this.fear -= 15;
          return;
        }
      } else if (
        !this.monster.backtracking && // optimisation to prevent unnecessary raycasts in isVisible
        this.monster.isVisible(this.player.playerController, true)
      ) {
        // if the monster is caught in the torch, we want it to start backtracking
        this.backtrackMonster();
        return;
      }

      // this.monsterSoundTracker()
      this.monster.update();
      //this.soundmanager.bind(this.monster.Mesh)
      // this.monster.Mesh.position.setX(this.monster.position.x)
      // this.monster.Mesh.position.setY(this.monster.position.y)
      // this.monster.Mesh.position.setZ(this.monster.position.z)
      // this.soundmanager.listener.position.setX(this.monster.Mesh.position.x)
      // this.soundmanager.listener.position.setY(this.monster.Mesh.position.y)
      // this.soundmanager.listener.position.setZ(this.monster.Mesh.position.z)
    }
    this.fearDecision();
  }

  getCellsInRadius() {
    var cells = [];
    for (
      var row = -this.playerSpawnRadius;
      row <= this.playerSpawnRadius;
      row++
    ) {
      for (
        var col = -this.playerSpawnRadius;
        col <= this.playerSpawnRadius;
        col++
      ) {
        if (Math.abs(row) <= this.minRadius && Math.abs(col) <= this.minRadius)
          continue;

        var gridCoords = Utils.convertWorldToThickGrid(this.player.position);
        var x = gridCoords.x + col;
        var y = gridCoords.y + row;

        if (
          x < 0 ||
          x >= this.grid[0].length ||
          y < 0 ||
          y >= this.grid[0].length
        )
          continue;
        if (x == gridCoords.x && y == gridCoords.y) continue;
        if (this.grid[y][x]) continue;
        cells.push({ x: x, y: y });
      }
    }
    return cells;
  }

  updateMonsterPath() {
    if (this.monster && !this.monster.backtracking) {
      var playerPosition = Utils.convertThickGridToWorld(
        Utils.convertWorldToThickGrid(this.player.position)
      );
      this.monster.getAstarPath(this.grid, playerPosition);
    }
  }

  getFurthestCorner() {
    const corner1 = new Vector2(1, 1) // bottom left
    const corner2 = new Vector2(this.grid.length - 2, 1) //top left
    const corner3 = new Vector2(1, this.grid.length - 2) // bottom right
    const corner4 = new Vector2(this.grid.length - 2, this.grid.length - 2) // bottom right
    const corners = [corner1, corner2, corner3, corner4]
    var maxDistance = -10;
    var furthestCorner = null;
    const playerGridPos = Utils.convertWorldToThickGrid(this.player.position);
    for (var corner of corners) {
      var dist = this.getManhattanDistance(corner.x, corner.y, playerGridPos.x, playerGridPos.y);
      if (dist > maxDistance) {
        maxDistance = dist;
        furthestCorner = corner;
      }
    }
    return furthestCorner;
  }

  getManhattanDistance(x1, z1, x2, z2) {
    return (Math.abs(x1 - x2) + Math.abs(z1 - z2));
  }
}

export default MonsterManager;
