import Constants from "../Constants";
class Cell {
  constructor(x, y) {
    this.north = true;
    this.east = true;
    this.south = true;
    this.west = true;

    this.x = x;
    this.y = y;

    this.visited = false;
  }
}

class Maze {
  constructor(width, height, probabilityWallsRemoved) {
    this.width = width;
    this.height = height;
    this.probabilityWallsRemoved = probabilityWallsRemoved;
    this.grid = this.newCellGrid();
  }

  shuffleArray(array) {
    /**
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
     */
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width - 1 && y < this.height - 1;
  }

  newCellGrid() {
    var grid = [];
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        grid.push(new Cell(x, y));
      }
    }
    return grid;
  }

  carvePassage(firstCell, secondCell) {
    //Assume adjacent

    if (firstCell.y < secondCell.y) {
      //Above
      firstCell.south = false;
      secondCell.north = false;
    } else if (firstCell.x > secondCell.x) {
      //Right
      firstCell.west = false;
      secondCell.east = false;
    } else {
      this.carvePassage(secondCell, firstCell);
    }
  }

  getPositionFromIndex(index) {
    var y = Math.floor(index / this.width);
    var x = index % this.width;
    return [x, y];
  }

  getCellAt(x, y) {
    return this.grid[this.width * y + x];
  }

  getRandomCell(arr) {
    if (!arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  getCellNeighbours(x, y) {
    var neighbours = [];

    //Left neighbour
    if (x > 0) {
      neighbours.push(this.getCellAt(x - 1, y));
    }

    //Right neighbour
    if (x < this.width - 1) {
      neighbours.push(this.getCellAt(x + 1, y));
    }

    //Top neighbour
    if (y > 0) {
      neighbours.push(this.getCellAt(x, y - 1));
    }

    //Bottom neighbour
    if (y < this.height - 1) {
      neighbours.push(this.getCellAt(x, y + 1));
    }

    return neighbours;
  }

  getCellUnvisitedNeighbours(neighbours) {
    return neighbours.filter((cell) => cell.visited == false);
  }

  getRandomUnvisitedNeighbour(x, y) {
    var allNeighbours = this.getCellNeighbours(x, y);
    var unvisited = this.getCellUnvisitedNeighbours(allNeighbours);

    return this.getRandomCell(unvisited);
  }

  chooseNextCellIndex(frontier, ratio) {
    //0 = Recursive backtracking
    //1 = Prims
    if (Math.random() > ratio) {
      return frontier.length - 1;
    } else {
      return Math.floor(Math.random() * frontier.length);
    }
  }

  growingTree() {
    //Get random cell from grid
    var initial = this.getRandomCell(this.grid);

    //Initialize the frontier
    var frontier = [];

    //Populate the frontier with the initial cell
    frontier.push(initial);
    initial.visited = true;

    while (frontier.length) {
      var nextCellIndex = this.chooseNextCellIndex(frontier, 0.4);
      var nextCell = frontier[nextCellIndex];
      var neighbourToCarve = this.getRandomUnvisitedNeighbour(
        nextCell.x,
        nextCell.y
      );

      if (!neighbourToCarve) {
        //No neighbour to carve to, remove from frontier
        frontier.splice(nextCellIndex, 1);
        continue;
      }

      //Neighbour exists. Carve then add to frontier
      this.carvePassage(nextCell, neighbourToCarve);

      neighbourToCarve.visited = true;
      frontier.push(neighbourToCarve);
    }

    this.removeWalls();
  }

  removeWalls() {
    let count = 0;
    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width - 1; x++) {
        // loop over all walls
        // only check if can remove east/south walls
        const cell = this.getCellAt(x, y);
        if (cell.east && Math.random() < this.probabilityWallsRemoved) {
          this.carvePassage(cell, this.getCellAt(cell.x + 1, cell.y));
          count++;
        }
        if (cell.south && Math.random() < this.probabilityWallsRemoved) {
          this.carvePassage(cell, this.getCellAt(cell.x, cell.y + 1));
          count++;
        }
      }
    }
    console.log("Number of walls removed:", count);
  }

  drawRect(ctx, x, y, size) {
    ctx.fillRect(x, y, size, size);
  }

  getThickGrid() {
    var grid = [];
    var drawWidth = 2 * this.width + 1;
    var drawHeight = 2 * this.height + 1;
    for (var y = 0; y < drawHeight; y++) {
      let row = [];
      for (var x = 0; x < drawWidth; x++) {
        row.push(true);
      }
      grid.push(row);
    }

    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        var cell = this.getCellAt(x, y);

        // set actual cell as clear
        grid[2 * y + 1][2 * x + 1] = false;
        // grid[(2 * y + 1) * drawWidth + (2 * x + 1)] = false;

        if (!cell.east) {
          grid[2 * y + 1][2 * x + 2] = false;
          // grid[(2 * y + 1) * drawWidth + (2 * x + 2)] = false;
        }
        if (!cell.south) {
          grid[2 * y + 2][2 * x + 1] = false;
          // grid[(2 * y + 2) * drawWidth + (2 * x + 1)] = false;
        }
      }
    }

    return grid;
  }

  getThickIndex(x, y) {
    return y * (2 * this.width + 1) + x;
  }

  getGridExitPosition() {
    exit = {
      x: 2 * this.height - 1,
      z: 2 * this.width - 1
    }
    return exit;
  }

  drawThickMaze(ctx) {
    var thickMaze = this.getThickGrid();
    var stepSize = 20;
    for (var y = 0; y < 2 * this.height + 1; y++) {
      for (var x = 0; x < 2 * this.width + 1; x++) {
        if (!thickMaze[y * (2 * this.width + 1) + x]) continue;
        this.drawRect(ctx, x * stepSize, y * stepSize, stepSize);
      }
    }
  }
}

export default Maze;
