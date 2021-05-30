import Utils from "./Utils";
import * as THREE from "three";
import { Vector2 } from "three";

class Player {
  constructor(position) {
    // this position is in world coordinates
    this.position = position;

    // grid coordinate - check if it changed
    this.prevGridCoordinates = null;
  }

  updatePosition(position, positionChangeCallback) {
    // take in world coordinates
    // and a callback function

    // update the position
    this.position = position;

    // update the grid coordinates
    const newGridCoords = Utils.convertWorldToThickGrid(this.position);

    // trigger mosnter path update - only if the player grid coordinates has changed
    if (newGridCoords.equals(this.prevGridCoordinates)) {
      // update
      this.prevGridCoordinates = newGridCoords;
      positionChangeCallback(newGridCoords);
    }
  }
}
