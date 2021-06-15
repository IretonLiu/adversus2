import Utils from "./Utils";
import Constants from "./Constants";
import Monster from "./Monster";
import SoundManager from "./SoundManager";
import * as THREE from "three";
import { StaticReadUsage } from "three";
import state from "./State";

class MonsterManager {
  constructor(scene, player, grid, clock) {
    this.fear = 0;
    this.player = player;
    this.scene = scene;
    this.grid = grid;
    this.monster = null;
    this.soundmanager = null
    // TODO: this clock can potentially cause problems
    this.clock = clock;

    this.playerSpawnRadius = 4;
    this.minRadius = 2;
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
    console.log("this is called")
    if (this.monster) {
      this.monster.remove();
      this.monster = null;
    }
  }

  spawnMonster(monsterGridLoc) {
    var monsterWorldPos = Utils.convertThickGridToWorld(monsterGridLoc);
    this.monster = new Monster(monsterWorldPos, this.scene);
    var playerPosition = Utils.convertThickGridToWorld(
      Utils.convertWorldToThickGrid(this.player.position)
    );
    this.monster.getAstarPath(
      this.grid,
      playerPosition
      // new THREE.Vector3(1 * Constants.WALL_SIZE, 0, 1 * Constants.WALL_SIZE)
    );
    this.soundmanager= new SoundManager(
      this.monster.Mesh,
      this.player.playerController,
      "assets/Sounds/JockeySounds.mp3"
    )
  
  }

  backtrackMonster() {
    // cause the monster to retrace its steps
    // only start the backtrack if we aren't already doing so
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
      if (this.monster.path == "") {
        this.despawnMonster();
        this.fear -= 15;
        return;
      } else if (
        !this.monster.backtracking && // optimisation to prevent unnecessary raycasts in isVisible
        this.monster.isVisible(this.player.playerController, true)
      ) {
        // if the monster is caught in the torch, we want it to start backtracking
        this.backtrackMonster();
        return;
      }
      this.monster.update();
    }
    this.monsterSoundTracker()
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

   monsterSoundTracker()
{
    if (this.monster != null) {
      if (this.soundmanager == null) {
        this.soundmanager = new SoundManager(
          this.monster.Mesh,
          player.playerController,
          "assets/Sounds/monster.mp3"
        );
      } else {
        if (this.monster.Mesh != null) {
          this.soundmanager.bind(this.monster.Mesh);
        } else {
          this.soundmanager.pause();
        }
      }
    } else {
      if (this.soundmanager != null) {
        this.soundmanager.pause();
      }
      this.soundmanager = null;
    }
  }
}

export default MonsterManager;
