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
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = this.newCellGrid();
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

  chooseNextCellIndex(frontier) {
    return frontier.length - 1;
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
      var nextCellIndex = this.chooseNextCellIndex(frontier);
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
  }
}

export default Maze;