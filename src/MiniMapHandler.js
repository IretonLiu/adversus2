import Constants from "./Constants";
import * as THREE from "three";

const ctx = document.createElement("canvas").getContext("2d");
document.body.appendChild(ctx.canvas);

class MiniMap {
  constructor(playerController, maze) {
    this.playerController = playerController;
    this.x = playerController.camera.position.x;
    this.y = playerController.camera.position.z;

    this.maze = maze;

    this.visited = this.initializeVisited();

    this.isFullScreen = false;

    this.mapInnerSize =
      Math.min(window.innerWidth, window.innerHeight) *
      Constants.MINIMAP_FULLSCREEN_PERC;
    this.verticalGap = (window.innerHeight - this.mapInnerSize) / 2;
    this.horizontalGap = (window.innerWidth - this.mapInnerSize) / 2;
    this.blockSize = this.mapInnerSize / this.maze.length;

    this.minimize();
    this.setUpControls();
  }

  setUpControls() {
    const onKeyDown = (event) => {
      switch (event.code) {
        case "KeyM":
          this.isFullScreen = !this.isFullScreen;
          if (this.isFullScreen) {
            this.fullScreen();
          } else {
            this.minimize();
          }
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

  initializeVisited() {
    return Array.from({ length: this.maze.length }, () =>
      Array.from({ length: this.maze[0].length }, () => false)
    );
  }

  drawTriangle() {
    ctx.fillStyle = "#ff0000";
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.lineTo(0.5, -0.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-0.5, -0.5);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  worldUpdate() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.updatePosition();
    this.drawMaze();
    this.drawPlayer();
    // console.log(this.playerController.camera.rotation.y);
  }

  drawCenterdMaze() {
    ctx.save();
    var angle = -(this.getYAngle(this.playerController.camera)-Math.PI/2);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = ctx.fillStyle;
    ctx.translate(this.width / 2, this.height / 2);
    ctx.translate(Math.floor(Constants.WALL_SIZE_MINIMAP/2),Math.floor(Constants.WALL_SIZE_MINIMAP/2));
    ctx.rotate(angle);
    ctx.translate(Math.floor(-Constants.WALL_SIZE_MINIMAP/2),Math.floor(-Constants.WALL_SIZE_MINIMAP/2));
    for (var row = 0; row < this.maze.length; row++) {
      for (var col = 0; col < this.maze[0].length; col++) {
        if (this.maze[row][col]) continue;

        var x = this.x / Constants.WALL_SIZE;
        var y = this.y / Constants.WALL_SIZE;

        var playerCellX = x;
        var playerCellY = y;

        if (
          Math.abs(playerCellX - col) < 0.5 &&
          Math.abs(playerCellY - row) < 0.5
        ) {
          this.visited[row][col] = true;
        }

        if (!this.visited[row][col]) continue;

        var dx = x - col;
        var dy = y - row;

        ctx.save();
        ctx.translate(
          -Math.floor(dy * Constants.WALL_SIZE_MINIMAP),
          Math.floor(dx * Constants.WALL_SIZE_MINIMAP)
        );
        ctx.fillRect(
          0,
          0,
          Constants.WALL_SIZE_MINIMAP,
          Constants.WALL_SIZE_MINIMAP
        );
        ctx.restore();
      }
    }
    ctx.restore();
  }

  updateFullScreenSizes() {
    this.mapInnerSize =
      Math.min(window.innerWidth, window.innerHeight) *
      Constants.MINIMAP_FULLSCREEN_PERC;
    this.verticalGap = (window.innerHeight - this.mapInnerSize) / 2;
    this.horizontalGap = (window.innerWidth - this.mapInnerSize) / 2;
    this.blockSize = Math.floor(this.mapInnerSize / this.maze.length);
  }

  drawWorldMaze() {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = ctx.fillStyle;

    this.updateFullScreenSizes();

    for (var row = 0; row < this.maze.length; row++) {
      for (var col = 0; col < this.maze[0].length; col++) {
        if (this.maze[row][col]) continue;

        var x = this.x / Constants.WALL_SIZE;
        var y = this.y / Constants.WALL_SIZE;

        var playerCellX = x;
        var playerCellY = y;

        if (
          Math.abs(playerCellX - col) < 0.5 &&
          Math.abs(playerCellY - row) < 0.5
        ) {
          this.visited[row][col] = true;
        }

        if (!this.visited[row][col]) continue;

        var dx = x - col;
        var dy = y - row;

        ctx.save();
        ctx.translate(
          Math.floor(col * this.blockSize + this.horizontalGap),
          Math.floor(row * this.blockSize + this.verticalGap)
        );
        ctx.fillRect(0, 0, this.blockSize, this.blockSize);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawMaze() {
    if (this.isFullScreen) {
      this.drawWorldMaze();
    } else {
      this.drawCenterdMaze();
    }
  }

  fullScreen() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    ctx.canvas.width = this.width;
    ctx.canvas.height = this.height;

    ctx.canvas.style.background = "#222222aa";
  }

  minimize() {
    this.width = Constants.MINIMAP_SIDE_LENGTH;
    this.height = Constants.MINIMAP_SIDE_LENGTH;

    ctx.canvas.width = this.width;
    ctx.canvas.height = this.height;
    ctx.canvas.style.fill = "#000";
    ctx.canvas.style.background = "#22222250";
    ctx.canvas.style.position = "absolute";
    ctx.canvas.style.top = 10;
    ctx.canvas.style.right = 10;
    ctx.canvas.style.zIndex = 3000;
    ctx.canvas.style.filter = "blur(0.4px)";
  }

  drawPlayer() {
    if (this.isFullScreen) {
      this.drawWorldPlayer();
    } else {
      this.drawCenterPlayer();
    }
  }

  drawWorldPlayer() {
    ctx.save();
    var x = this.x / Constants.WALL_SIZE;
    var y = this.y / Constants.WALL_SIZE;
    ctx.fillStyle = "#FF0000";
    ctx.translate(
      x * this.blockSize + this.horizontalGap,
      y * this.blockSize + this.verticalGap
    );
    ctx.translate(this.blockSize / 2, this.blockSize / 2);
    ctx.rotate(this.getYAngle(this.playerController.camera));
    ctx.scale(Constants.PLAYER_SIZE_MINIMAP, -Constants.PLAYER_SIZE_MINIMAP);
    this.drawTriangle();
    ctx.restore();
  }

  getYAngle(obj) {
    var direction = obj
      .getWorldDirection(new THREE.Vector3(0, 0, 0))
      .normalize();
    direction.y = 0;
    var z = new THREE.Vector3(0, 0, -1);
    var angle = z.angleTo(direction);
    if (direction.x < 0) {
      return 2 * Math.PI - angle;
    }

    return angle;
  }

  drawCenterPlayer() {
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.fillStyle = "#FF0000";
    ctx.translate(
      Constants.WALL_SIZE_MINIMAP / 2,
      Constants.WALL_SIZE_MINIMAP / 2
    );
    // ctx.rotate(this.getYAngle(this.playerController.camera) - Math.PI / 2);
    ctx.scale(Constants.PLAYER_SIZE_MINIMAP, -Constants.PLAYER_SIZE_MINIMAP);
    this.drawTriangle();
    ctx.restore();
  }

  updatePosition() {
    this.x = this.playerController.camera.position.x;
    this.y = this.playerController.camera.position.z;
    // console.log(this.y);
  }
}

export default MiniMap;
