import * as THREE from 'three';
import { Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GameManager from "./GameManager.js";
import { Battery } from "./PickUps.js";
import { GateKey } from "./PickUps.js";


//control the spawning of the Pickups


let animateHelper = 0;
const loader = new GLTFLoader();
class WorldManager {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.battery = null;
        this.gateKey = null;
    }

    loadBattery() {
        this.battery = new Battery();
        this.battery.makeBattery(this.scene);

    }

    loadKey() {
        this.gateKey = new GateKey();
        this.gateKey.makeKey(this.scene);

    }

    updateObjs() {
        // to animate the battery and key
        // call in animate function

        this.gateKey.mesh.rotation.y += 2 / 180;
        this.battery.mesh.rotation.y += 2 / 180;

        if (animateHelper < 35) {
            this.gateKey.mesh.translateY(0.02)
            this.battery.mesh.translateY(0.02)
            animateHelper++;
        }
        else if (animateHelper < 70 && animateHelper >= 35) {
            this.gateKey.mesh.translateY(-0.02)
            this.battery.mesh.translateY(-0.02)
            animateHelper++;
        }
        else if (animateHelper >= 70) {
            animateHelper = 0;
        }


    }

    // batteryLifeOnPickUp(life) {
    //     if (this.battery.life > 90) {
    //         this.battery.life += 100 - this.battery.life;
    //     }
    //     else {
    //         this.battery.life += 10;
    //     }

    // }

}



export default WorldManager;