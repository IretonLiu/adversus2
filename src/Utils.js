import { Vector2, Vector3 } from "three";

import Constants from "./Constants";

const Utils = {
  convertWorldToThickGrid(worldVector3) {
    // takes in a 3-dimensional vector
    // returns a 2-dimensional vector

    return new Vector2(
      Math.floor(
        (worldVector3.x + Constants.WALL_SIZE / 2) / Constants.WALL_SIZE
      ),
      Math.floor(
        (worldVector3.z + Constants.WALL_SIZE / 2) / Constants.WALL_SIZE
      )
    );
  },

  convertThickGridToWorld(gridVector2, height = 0) {
    // takes in a 2-dimensional
    // returns a 3-dimensional vector

    return new Vector3(
      gridVector2.x * Constants.WALL_SIZE,
      height,
      gridVector2.y * Constants.WALL_SIZE
    );
  },

  isInRadiusOfPoint(currentPoint, nextPoint, radius) {
    return currentPoint.distanceTo(nextPoint) < radius;
  },

  detLookingDirection(camera) {
    let lookAtVector = new Vector3(0, 0, -1);
    lookAtVector.applyQuaternion(camera.quaternion);

    return lookAtVector;
  },
};

export default Utils;
