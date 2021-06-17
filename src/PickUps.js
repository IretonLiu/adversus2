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

  //battery constructor
  constructor(x, z) {
    super();
    this.x = x;
    this.z = z;
  }

  //renders the battery at the location passed in from the worldManager
  makeBattery(x, z) {
    return new Promise((resolve, reject) => {
      //loads the glb model from the assests folder
      loader.load(
        "./assets/models/Battery.glb",
        (gltf) => {
          //rendering details for the battery
          this.mesh = gltf.scene;
          this.mesh.translateY(-4);
          this.mesh.scale.set(2, 3, 2);

          //times by the wall size so that it can move in appropriate increments
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

  //adds the batteries to the scene
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

  //makes the key and gets the relevent params from the worldManager
  makeKey(scene, x, z) {
    return new Promise((resolve, reject) => {
      //loads the glb model from the assests folder
      //make an empty model so that the relevent key can be loaded into the scene
      var modelToLoad =""

      //switch case to set the modelToLoad to the correct path
      switch (scene.name) {
        case "maze1":
          modelToLoad="./assets/models/key1.glb"
          break;
        case "maze2":
          modelToLoad="./assets/models/key2.glb"
          break;
        case "maze3":
          modelToLoad="./assets/models/key3.glb"
          break;
      }
      //loads the correct model
      loader.load( modelToLoad, (gltf) =>{ 
          //rendering details for the battery
          this.mesh = gltf.scene;
          this.mesh.scale.set(1, 1, 1);
          this.mesh.position.x = x * Constants.WALL_SIZE;
          this.mesh.position.z = z * Constants.WALL_SIZE;
          //adds the mesh to the scene
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
