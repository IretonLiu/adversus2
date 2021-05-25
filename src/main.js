import GameManager from "./GameManager.js";
import state from "./State";
var playButton = document.getElementById("play-button");
playButton.onclick = playGame;

function playGame() {
  document.getElementById("menu").style.display = "none";
  state.isPlaying = true;
  const app = new GameManager();
  app.init();
  console.log("Initialized");
}
