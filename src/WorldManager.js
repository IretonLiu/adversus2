import * as THREE from 'three';
import { Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GameManager from "./GameManager.js";
import { Battery } from "./PickUps.js";
import { GateKey } from "./PickUps.js";


//control the spawning of the Pickups

let gameManager;
let animateHelper = 0;
const loader = new GLTFLoader();
class WorldManager {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.batteries = [];
        this.gateKey = null;
    }

    loadBattery(x, z) {
        this.batteries.push(new Battery());
        this.batteries[this.batteries.length - 1].makeBattery(this.scene, x, z);

    }

    loadKey(x, z) {
        this.gateKey = new GateKey();
        this.gateKey.makeKey(this.scene, x, z);

    }

    updateObjs() {
        // to animate the battery and key
        // call in animate function
        //console.log(this.gateKey.mesh);
        this.gateKey.mesh.rotation.y += 2 / 180;
        for (let battery of this.batteries) {
            battery.mesh.rotation.y += 2 / 180;
            if (animateHelper < 35) {
                battery.mesh.translateY(0.02)
            }
            else if (animateHelper < 70 && animateHelper >= 35) {
                battery.mesh.translateY(-0.02)
            }

        }

        if (animateHelper < 35) {
            this.gateKey.mesh.translateY(0.02)
            animateHelper++;
        }
        else if (animateHelper < 70 && animateHelper >= 35) {
            this.gateKey.mesh.translateY(-0.02)
            animateHelper++;
        }
        else if (animateHelper >= 70) {
            animateHelper = 0;
        }


    }



    setBatteries() {
        let numBats = 0;
        let iter = 0;
        while (numBats < 7 && iter < 100) {
            let randX = Math.floor(Math.random() * (this.grid.length / 2)) * 2 + 1;
            let randZ = Math.floor(Math.random() * (this.grid.length / 2)) * 2 + 1;
            if (this.grid[randX][randZ] === false) {
                this.loadBattery(randX, randZ);
                numBats++
            }
            iter++

        }
        console.log("iterations :", iter);

    }

    setKey() {
        let randX = Math.floor(Math.random() * (this.grid.length / 2)) * 2 + 1;
        let randZ = Math.floor(Math.random() * (this.grid.length / 2)) * 2 + 1;
        if (this.grid[randX][randZ] === false) {
            this.loadKey(randX, randZ);
        }
        else {
            this.setKey();
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