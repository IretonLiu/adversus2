import Utils from "./Utils";

class DevMap {
  constructor(grid, player, monsterManager) {
    this.grid = grid;
    this.player = player;
    this.monsterManager = monsterManager;

    this.canvas = document.getElementById("devcanvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.font = "25px Arial";

    this.cellSize = Math.floor(this.canvas.width / this.grid.length);
  }

  update() {
    this.drawMap();
    this.drawPlayer();
    this.drawMonster();

    this.drawSpawnRadius();
    if (this.monsterManager.monster) this.drawMonsterPath();

    this.updateFearText();
  }

  drawMonsterPath() {
    var ctx = this.ctx;
    ctx.fillStyle = "#00f";
    ctx.save();
    this.monsterManager.monster.path.forEach((point) => {
      ctx.beginPath();
      ctx.arc(
        point.x * this.cellSize + 0.5 * this.cellSize,
        point.y * this.cellSize + 0.5 * this.cellSize,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
    ctx.restore();
  }

  updateFearText() {
    var fear = this.monsterManager.fear;
    this.ctx.fillStyle = "black";
    this.ctx.fillText("Fear: " + parseFloat(fear).toFixed(2), 10, this.canvas.height - 10);
  }

  drawMonster() {
    if (this.monsterManager.monster) {
      var pos = Utils.convertWorldToThickGrid(
        this.monsterManager.monster.position
      );

      var ctx = this.ctx;
      ctx.fillStyle = "#f00";
      ctx.fillRect(
        pos.x * this.cellSize,
        pos.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
    }
  }

  drawSpawnRadius() {
    var cells = this.monsterManager.getCellsInRadius();
    var ctx = this.ctx;
    ctx.fillStyle = "#FFFF0050";
    cells.forEach((cell) => {
      ctx.fillRect(
        cell.x * this.cellSize,
        cell.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
    });
  }

  drawPlayer() {
    var pos = Utils.convertWorldToThickGrid(this.player.position);
    var ctx = this.ctx;
    ctx.fillStyle = "#0f0";
    ctx.fillRect(
      pos.x * this.cellSize,
      pos.y * this.cellSize,
      this.cellSize,
      this.cellSize
    );
  }

  drawMap() {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var cellSize = this.cellSize;

    ctx.fillStyle = "#000";
    for (var row = 0; row < this.grid.length; row++) {
      for (var col = 0; col < this.grid[row].length; col++) {
        if (this.grid[row][col]) continue;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }
}

export default DevMap;
