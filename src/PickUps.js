import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import PlayerController from "./PlayerController.js";
import WorldManager from "./WorldManager.js";
import Constants from "./Constants.js";

const loader = new GLTFLoader();
const loadPics = new THREE.ImageLoader();

class PickUps {
  //methods, functions and properties that are shared with all children are defined here
  constructor() {
    this.mesh = null;
  }
}

class Battery extends PickUps {
  //unique functions for battery

  constructor(x, z) {
    super();
    this.x = x;
    this.z = z;

    // this.mesh = null;
  }

  makeBattery(x, z) {
    return new Promise((resolve, reject) => {
      //loader.load(url, data => resolve(data), null, reject);
      loader.load(
        "./assets/models/Battery.glb",
        (gltf) => {
          this.mesh = gltf.scene;
          this.mesh.translateY(-4);
          this.mesh.scale.set(2, 3, 2);

          this.mesh.position.x = x * Constants.WALL_SIZE;
          this.mesh.position.z = z * Constants.WALL_SIZE;

          resolve("success");
        },
        (xhr) => {
          console.log(
            "loading Battery: " + (xhr.loaded / xhr.total) * 100 + "% loaded"
          );
        },
        reject
      );
    });
  }

  displayBattery(scene) {
    scene.add(this.mesh);
  }
}

class GateKey extends PickUps {
  //unique functions for keys
  constructor(x, z) {
    super();
    this.x = x;
    this.z = z;
  }

  makeKey(scene, x, z) {
    return new Promise((resolve, reject) => {
      //loader.load(url, data => resolve(data), null, reject);
      loader.load(
        "./assets/models/Worn_Key.glb",
        (gltf) => {
          this.mesh = gltf.scene;
          //console.log(this.mesh)
          this.mesh.scale.set(30, 30, 30);
          this.mesh.position.x = x * Constants.WALL_SIZE;
          this.mesh.position.z = z * Constants.WALL_SIZE;

          scene.add(this.mesh);

          resolve("success");
        },
        (xhr) => {
          console.log(
            "loading Key: " + (xhr.loaded / xhr.total) * 100 + "% loaded"
          );
        },
        reject
      );
    });
  }
}
export { Battery, GateKey };
