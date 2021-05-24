import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import PlayerController from './PlayerController.js';
import WorldManager from './WorldManager.js';
import Constants from './Constants.js';


const loader = new GLTFLoader();


class PickUps {
    //methods, functions and properties that are shared with all children are defined here
    constructor() {
        this.mesh = null;
    }

}

class Battery extends PickUps {
    //unique functions for battery

    constructor() {
        super();
        //this.life = life;


    }


    makeBattery(scene, x, z) {

        loader.load('./assets/models/Battery.glb', (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.translateY(-4);
            this.mesh.scale.set(2, 3, 2);

            this.mesh.position.x = x * Constants.WALL_SIZE;
            this.mesh.position.z = z * Constants.WALL_SIZE;
            console.log("this is where the battery is: ", this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
            scene.add(this.mesh);

        }, undefined, function (error) {
            console.error(error);
        });
    }




}

class GateKey extends PickUps {
    //unique functions for keys
    constructor() {
        super();
    }

    makeKey(scene, x, z) {

        loader.load('./assets/models/Worn_Key.glb', (gltf) => {
            this.mesh = gltf.scene;
            //console.log(this.mesh)
            this.mesh.scale.set(30, 30, 30);
            this.mesh.position.x = x * Constants.WALL_SIZE;
            this.mesh.position.z = z * Constants.WALL_SIZE;
            this.mesh.position.y = 20;
            console.log("this is where the Key is: ", this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
            scene.add(this.mesh);

        }, undefined, function (error) {
            console.error(error);
        });
    }

}

export { Battery, GateKey }


