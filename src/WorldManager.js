import * as THREE from 'three';
import { Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GameManager from "./GameManager.js";
import { Battery } from "./PickUps.js";
import { GateKey } from "./PickUps.js";
import PlayerController from "./PlayerController.js";
import Constants from './Constants.js';

//control the spawning of the Pickups

let playerController;
let gameManager;
let animateHelper = 0;
let torchLife = 1500;

const ctx = document.getElementById("inventory").getContext("2d");
document.body.appendChild(ctx.canvas);

class WorldManager {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.batteries = [];
        this.gateKey = null;
        this.torchLife = torchLife;
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
            let randX = Math.floor(Math.random() * (this.grid.length / 2)) * 2;
            let randZ = Math.floor(Math.random() * (this.grid.length / 2)) * 2;
            if (this.grid[randX][randZ] === false) {
                this.loadBattery(randX, randZ);
                numBats++
            }
            iter++

        }
        console.log("iterations :", iter);

    }

    pickUpBattery(x, z) {
        for (let battery of this.batteries) {
            if ((x <= battery.mesh.position.x + 10 && x >= battery.mesh.position.x - 10) && (z <= battery.mesh.position.z + 10 && z >= battery.mesh.position.z - 10)) {
                let index = this.batteries.indexOf(battery);
                this.updateBatteyLife();
                battery.mesh.visible = false;
                this.batteries.splice(index, 1);

            }
        }
    }
    pickUpKey(x, z) {
        if ((x <= this.gateKey.mesh.position.x + 10 && x >= this.gateKey.mesh.position.x - 10) && (z <= this.gateKey.mesh.position.z + 10 && z >= this.gateKey.mesh.position.z - 10)) {
            this.keyDisplay();
            this.gateKey.mesh.visible = false;
        }
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


    torchDisplay() {


        let img = document.createElement("img");
        img.src = "./assets/itemPics/torch2.png";

        ctx.save();
        ctx.scale(0.2, 0.2);
        // ctx.translate(-10, 0)
        ctx.drawImage(img, -60, 50);
        this.lifeBar();
        ctx.restore();


    }

    keyDisplay() {

        let img = document.createElement("img");
        img.src = "./assets/itemPics/key2.png";

        ctx.save();
        ctx.scale(0.1, 0.1);
        ctx.translate(10, 600)
        ctx.drawImage(img, 100, 0);
        ctx.restore();

    }

    batteryDisplay() {

        let img = document.createElement("img");
        img.src = "./assets/itemPics/battery.jpg";

        ctx.save();
        ctx.scale(0.05, 0.05);
        ctx.translate(0, 0)
        ctx.drawImage(img, 0, 1400);
        ctx.restore();

    }
    displayItems() {
        this.torchDisplay();
        //this.keyDisplay();
        //this.batteryDisplay();

    }

    lifeBar(torchState) {

        if (torchState) {
            if (this.torchLife >= 500) {
                this.torchLife -= 0.5;
            }

        }
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(475, 30);
        ctx.lineTo(1525, 30);
        ctx.lineTo(1525, 270);
        ctx.lineTo(475, 270);
        ctx.fill();
        ctx.closePath();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(500, 50);
        ctx.lineTo(this.torchLife, 50);
        ctx.lineTo(this.torchLife, 250);
        ctx.lineTo(500, 250);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    updateBatteyLife() {
        if (this.torchLife + 500 < 1500) {
            this.torchLife += 500;
        }
        else {
            this.torchLife = 1500;
        }

    }


}


export default WorldManager;