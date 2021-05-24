// NEED:
// maze representation (grid)
// player position (target)
// monster position (initial)
// save path - don't recompute every frame

import Maze from "../lib/MazeGenerator";
import Constants from "../Constants";

class Point {
  constructor(x, y, g, h, isWall) {
    // this point's coordinates
    this.x = x;
    this.y = y;

    // world coordinates
    this.worldX = y * Constants.WALL_SIZE;
    this.worldZ = x * Constants.WALL_SIZE;

    // this point's cost
    this.g = g;
    this.h = h;

    // keep track of if block is visitable
    this.closed = false;

    // keep track if this block is wall
    this.isWall = isWall;

    // keep track of parent (for backtracking)
    this.parent = null;
  }

  getF() {
    return this.g + this.h;
  }

  isEqual(otherPoint) {
    // equal if at the same place
    return this.x === otherPoint.x && this.y === otherPoint.y;
  }
}

export class Astar {
  constructor(grid, initialX, initialY, targetX, targetY) {
    // thick mazem (our search grid)
    this.grid = this.initGrid(grid);

    // starting point (x, y)
    this.initial = this.grid[initialY][initialX]; // new Point(initialX, initialY, 0, 0, false);
    this.initial.h = 0;

    // target point (x, y)
    // todo - confirm target isn't a wall
    this.target = this.grid[targetY][targetX]; // new Point(targetX, targetY, 0, 0, false);
    this.target.h = 0;

    // keep track of current path
    this.path = "";

    // the search grid
    // this.grid = initGrid(maze.width, maze.height);
  }

  getCurrentPath() {
    return this.path;
  }

  initGrid(mazeGrid) {
    let grid = [];
    // make our own grid representation to use with astar
    for (let row = 0; row < mazeGrid.length; row++) {
      let temp = [];
      for (let col = 0; col < mazeGrid[0].length; col++) {
        // maze[row][col] is true if a wall is present
        temp.push(
          new Point(col, row, 0, Number.MAX_SAFE_INTEGER, mazeGrid[row][col])
        );
      }
      grid.push(temp);
    }
    console.log(grid);
    return grid;
    // now have grid representation
  }

  // todo implement open list as priority qeue
  getCheapestIndex(arr) {
    let min = arr[0].getF();
    let index = 0;
    // let minPoint = arr[0];
    for (let i = 1; i < arr.length; i++) {
      if (arr[i].getF() < min) {
        min = arr[i].getF();
        index = i;
        // minPoint = arr[i];
      }
    }

    return index;
  }

  heuristic(x, y) {
    return Math.abs(x - this.target.x) + Math.abs(y - this.target.y);
  }

  isValid(x, y) {
    // check bounds
    if (x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length)
      // check if this is a wall
      return !this.grid[y][x].isWall;
    else return false;
  }

  getValidNeighbours(x, y) {
    // check north, south, east, west
    // if valid, add to neighbours
    let neighbours = [];

    // north
    if (this.isValid(x, y - 1)) neighbours.push(this.grid[y - 1][x]);

    // south
    if (this.isValid(x, y + 1)) neighbours.push(this.grid[y + 1][x]);

    // east
    if (this.isValid(x + 1, y)) neighbours.push(this.grid[y][x + 1]);

    // west
    if (this.isValid(x - 1, y)) neighbours.push(this.grid[y][x - 1]);

    return neighbours;
  }

  // todo - remove when convert to priority queue
  doesInclude(list, point) {
    for (let item of list) {
      if (item.isEqual(point)) return true;
    }
    return false;
  }

  backtrack() {
    // start point will have a parent of null
    let current = this.target;

    let path = "";

    // walk backwards
    while (current.parent !== null) {
      let parent = current.parent;

      // determine relationship of current to its parent to get the travel direction

      if (parent.y === current.y) {
        // same row, diff cols

        if (parent.x > current.x) {
          // parent right
          path += Constants.WEST;
        } else {
          // parent left
          path += Constants.EAST;
        }
      } else {
        // diff rows, same col
        if (parent.y > current.y) {
          // parent below
          path += Constants.NORTH;
        } else {
          // parent above
          path += Constants.SOUTH;
        }
      }
      current = current.parent;
    }

    return path;
  }

  calculatePath() {
    // kepp track of the nodes we can visit; nodes we cannot visit will be marked by their "closed" property
    let open = [this.initial];

    let found = false;

    while (open.length !== 0 && !found) {
      // get the point with the smallest f value
      // we are visiting this cell
      const currentIndex = this.getCheapestIndex(open);
      const current = open[currentIndex];

      // remove the current node
      open.splice(currentIndex, 1);

      // close current
      current.closed = true;

      // if current is goal
      if (current.isEqual(this.target)) {
        found = true;
        break;
      }

      //  get the valid neighbours of the current point
      const neighbours = this.getValidNeighbours(current.x, current.y);

      // loop through all the valid neighbours
      for (let neighbour of neighbours) {
        // calculate updated costs
        const newG = current.g + 1;
        const newH = this.heuristic(neighbour.x, neighbour.y);
        const newF = newG + newH;

        // if this neighbour is not closed
        if (!neighbour.closed) {
          // inOpen if we have considered it before
          const inOpen = this.doesInclude(open, neighbour);
          if (inOpen) {
            if (newF >= neighbour.getF()) {
              // we can't improve, so skip
              continue;
            }
          }

          // if we get here, neighbour has an improved score
          neighbour.g = newG;
          neighbour.h = newH;

          // seeing as this is an improved score, update parent
          neighbour.parent = current;

          // if neighbour isn't in open, add it
          if (!inOpen) {
            open.push(neighbour);
          }
        }
      }
    }

    // backtrack and find the path
    if (found) {
      // have found a path
      this.path = this.backtrack();
    } else {
      // no path exists
      this.spath = "";
    }
  }
}

// https://briangrinstead.com/blog/astar-search-algorithm-in-javascript/

// var astar = {
//   init: function(grid) {

//   },
//   heap: function() {
//       return new BinaryHeap(function(node) {
//           return node.f;
//       });
//   },
//   search: function(grid, start, end, diagonal, heuristic) {
//       astar.init(grid);
//       heuristic = heuristic || astar.manhattan;
//       diagonal = !!diagonal;

//       var openHeap = astar.heap();

//       openHeap.push(start);

//       while(openHeap.size() > ) {

//           // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
//           var currentNode = openHeap.pop();

//           // End case -- result has been found, return the traced path.
//           if(currentNode === end) {
//               var curr = currentNode;
//               var ret = [];
//               while(curr.parent) {
//                   ret.push(curr);
//                   curr = curr.parent;
//               }
//               return ret.reverse();
//           }

//           // Normal case -- move currentNode from open to closed, process each of its neighbors.
//           currentNode.closed = true;

//           // Find all neighbors for the current node. Optionally find diagonal neighbors as well (false by default).
//           var neighbors = astar.neighbors(grid, currentNode, diagonal);

//           for(var i=, il = neighbors.length; i < il; i++) {
//               var neighbor = neighbors[i];

//               if(neighbor.closed || neighbor.isWall()) {
//                   // Not a valid node to process, skip to next neighbor.
//                   continue;
//               }

//               // The g score is the shortest distance from start to current node.
//               // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
//               var gScore = currentNode.g + neighbor.cost;
//               var beenVisited = neighbor.visited;

//               if(!beenVisited || gScore < neighbor.g) {

//                   // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
//                   neighbor.visited = true;
//                   neighbor.parent = currentNode;
//                   neighbor.h = neighbor.h || heuristic(neighbor.pos, end.pos);
//                   neighbor.g = gScore;
//                   neighbor.f = neighbor.g + neighbor.h;

//                   if (!beenVisited) {
//                       // Pushing to heap will put it in proper place based on the 'f' value.
//                       openHeap.push(neighbor);
//                   }
//                   else {
//                       // Already seen the node, but since it has been rescored we need to reorder it in the heap
//                       openHeap.rescoreElement(neighbor);
//                   }
//               }
//           }
//       }

//       // No result was found - empty array signifies failure to find path.
//       return [];
//   },
//   manhattan: function(pos0, pos1) {
//       // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html

//       var d1 = Math.abs (pos1.x - pos0.x);
//       var d2 = Math.abs (pos1.y - pos0.y);
//       return d1 + d2;
//   },
//   neighbors: function(grid, node, diagonals) {
//       var ret = [];
//       var x = node.x;
//       var y = node.y;

//       // West
//       if(grid[x-1] && grid[x-1][y]) {
//           ret.push(grid[x-1][y]);
//       }

//       // East
//       if(grid[x+1] && grid[x+1][y]) {
//           ret.push(grid[x+1][y]);
//       }

//       // South
//       if(grid[x] && grid[x][y-1]) {
//           ret.push(grid[x][y-1]);
//       }

//       // North
//       if(grid[x] && grid[x][y+1]) {
//           ret.push(grid[x][y+1]);
//       }

//       if (diagonals) {

//           // Southwest
//           if(grid[x-1] && grid[x-1][y-1]) {
//               ret.push(grid[x-1][y-1]);
//           }

//           // Southeast
//           if(grid[x+1] && grid[x+1][y-1]) {
//               ret.push(grid[x+1][y-1]);
//           }

//           // Northwest
//           if(grid[x-1] && grid[x-1][y+1]) {
//               ret.push(grid[x-1][y+1]);
//           }

//           // Northeast
//           if(grid[x+1] && grid[x+1][y+1]) {
//               ret.push(grid[x+1][y+1]);
//           }

//       }

//       return ret;
//   }
// };
