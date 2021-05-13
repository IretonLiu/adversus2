import GameManager from './GameManager.js';
import Maze from './lib/MazeGenerator';

// const app = new GameManager();
// app.init();
var size = 15;
var maze = new Maze(size,size);
maze.growingTree();
// console.log(maze.grid);


var c = document.getElementById("canvas");
var ctx = c.getContext("2d");
maze.drawThickMaze(ctx);

console.log("Initialized");