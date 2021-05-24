import GameManager from "./GameManager";
import { Vector3 } from "three";
import { randInt } from "three/src/math/MathUtils";
import { rand } from "three/examples/jsm/renderers/nodes/functions/MathFunctions";
import Constants from "./Constants";
const overlay = document.getElementById("overlay");
const ctx = document.getElementById("mmOnScreen").getContext("2d");

class minimap {
  constructor(pCon) {
    this.pCon = pCon;
    this.mapControls();
    this.placePos();
    this.x = pCon.camera.position.x;
    this.z = pCon.camera.position.z;
  }
  mapControls() {
    const onKeyDown = (event) => {
      switch (event.code) {
        case "KeyM":
          overlay.hidden = !overlay.hidden;
          break;
        //
        // case "KeyK":
        //     ctx.clearRect(0, 0, 500, 500);
        //     ctx.fillStyle = "red";
        //     ctx.fillRect(randInt(100, 250), randInt(0, 250), 3, 3);
        //     break;
      }
    };
    document.addEventListener("keydown", onKeyDown);
  }

  drawMaze(maze, grid) {
    ctx.fillStyle = "yellow";

    // var wallSize = 10;

    var playerX = -this.x / 2 + 140;
    var playerY = this.z / 2 + 140;
    ctx.save();
    ctx.translate(105, 120);
    for (var y = 0; y < 2 * maze.height + 1; y++) {
      for (var x = 0; x < 2 * maze.width + 1; x++) {
        if (grid[maze.getThickIndex(x, y)]) {
          ctx.fillRect(
            y * Constants.WALL_SIZE_MINIMAP,
            -x * Constants.WALL_SIZE_MINIMAP,
            Constants.WALL_SIZE_MINIMAP,
            Constants.WALL_SIZE_MINIMAP
          );
        }
      }
    }
    ctx.restore();
  }

  placePos() {
    var playerSize = 2;
    this.x = this.pCon.camera.position.x;
    this.z = this.pCon.camera.position.z;
    ctx.clearRect(0, 0, 500, 500);
    ctx.fillStyle = "red";
    ctx.fillRect(this.z / 2 + 109, -this.x / 2 + 125, playerSize, playerSize);
  }
}
export default minimap;
