import GameManager from './GameManager.js';
import Maze from './lib/MazeGenerator';

// const app = new GameManager();
// app.init();
var maze = new Maze(10,10);
maze.growingTree();
console.log(maze.grid);
console.log("Initialized");