import Utils from "./Utils";
import * as THREE from "three";
import { Vector2 } from "three";
import Constants from "./Constants";

class Player {
  constructor(position, playerController) {
    // this position is in world coordinates
    this.position = position;
    this.hasKey = false;
    this.playerController = playerController;

    this.torchLife = 100;

    this.batteryCount = 0;

    // grid coordinate - check if it changed
    this.prevGridCoordinates = this.position;
  }

  pickUpKey() {
    this.hasKey = true;
  }

  getPosition() {
    return this.playerController.playerObject.position;
  }

  updatePosition(position, positionChangeCallback) {
    // take in world coordinates
    // and a callback function
    // update the position
    this.position = position;

    // update the grid coordinates
    const newGridCoords = Utils.convertWorldToThickGrid(this.position);

    // trigger mosnter path update - only if the player grid coordinates has changed
    if (!newGridCoords.equals(this.prevGridCoordinates)) {
      // update
      this.prevGridCoordinates = newGridCoords;
      positionChangeCallback(newGridCoords);
    }
  }

  update(deltaTime, position, positionChangeCallback) {
    this.updateTorchLife(deltaTime);
    this.updatePosition(position, positionChangeCallback);
  }

  updateTorchLife(deltaTime) {
    const ctx = document.getElementById("inventory").getContext("2d");
    document.getElementById("numBats").innerHTML = "X" + this.batteryCount;

    //this decreases the torches life bar
    if (this.playerController.torchOn) {
      if (this.torchLife >= 0) {
        this.torchLife -= Constants.TORCH_DEPLETION_RATE * deltaTime;
      }
    }

    if (Math.floor(this.torchLife) <= 0) {
      if (this.batteryCount > 0) {
        this.refillTorch();
      } else {
        this.playerController.turnTorchOff();
      }
    }

    // this is causing frame drop over time
    ctx.fillStyle = "#ffffffa0";
    ctx.strokeStyle = "white";
    ctx.clearRect(100, 20, 200, 40);
    ctx.beginPath();
    ctx.rect(100, 20, 160, 20);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(100, 20, (this.torchLife / 20) * 32, 20);
    ctx.beginPath();
    ctx.rect(100 + 160, 25, 6, 10);
    ctx.closePath();
    ctx.stroke();
  }

  //refills the torch to full after the battery runs out
  refillTorch() {
    this.torchLife = 100;
    this.batteryCount--;
  }
}

export default Player;
