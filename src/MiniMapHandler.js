import Constants from "./Constants";

const ctx = document.createElement("canvas").getContext("2d");
document.body.appendChild(ctx.canvas);

class MiniMap {
  constructor(playerController, maze) {
    this.playerController = playerController;
    this.x = playerController.camera.position.x;
    this.y = playerController.camera.position.z;

    this.maze = maze;

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
    // ctx.canvas.style.opacity = 0.9;
    ctx.canvas.style.filter = "blur(0.4px)";
    // ctx.canvas.style.boxShadow = "0 0 5px 5px #000000";
  }

  worldUpdate() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.updatePosition();
    this.drawMaze();
    this.drawPlayer();
  }

  drawMaze() {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = ctx.fillStyle;
    ctx.translate(this.width / 2, this.height / 2);
    for (var row = 0; row < this.maze.length; row++) {
      for (var col = 0; col < this.maze[0].length; col++) {
        if (this.maze[row][col]) continue;

        var x = this.x / Constants.WALL_SIZE - col;
        var y = this.y / Constants.WALL_SIZE - row;

        ctx.save();
        ctx.translate(
          -y * Constants.WALL_SIZE_MINIMAP,
          x * Constants.WALL_SIZE_MINIMAP
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

  drawPlayer() {
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(
      0,
      0,
      Constants.PLAYER_SIZE_MINIMAP,
      Constants.PLAYER_SIZE_MINIMAP
    );
    ctx.restore();
  }

  updatePosition() {
    this.x = this.playerController.camera.position.x;
    this.y = this.playerController.camera.position.z;
    // console.log(this.y);
  }
}

export default MiniMap;
