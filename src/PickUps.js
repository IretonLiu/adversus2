import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import PlayerController from './PlayerController.js';
import GameManager from './GameManager.js';

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

    batteryLife() {

    }

    makeBattery(scene) {

        gameManager = new GameManager();
        loader.load('./assets/models/Battery.glb', (gltf) => {
            this.mesh = gltf.scene;
            //console.log(this.mesh)
            this.mesh.scale.set(2, 3, 2);
            scene.add(this.mesh);

        }, undefined, function (error) {
            console.error(error);
        });
    }

    setBatteries(scene, grid) {


        for (var i = 0; i < 5; i++) {

        }
    }


}

class GateKey extends PickUps {
    //unique functions for keys
    constructor() {
        super();
    }

    makeKey(scene) {

        loader.load('./assets/models/Worn_Key.glb', (gltf) => {
            this.mesh = gltf.scene;
            //console.log(this.mesh)
            this.mesh.scale.set(30, 30, 30);
            scene.add(this.mesh);

        }, undefined, function (error) {
            console.error(error);
        });
    }

}

export { Battery, GateKey }


