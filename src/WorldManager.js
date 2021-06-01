import * as THREE from "three";
import { Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GameManager from "./GameManager.js";
import { Battery } from "./PickUps.js";
import { GateKey } from "./PickUps.js";
import PlayerController from "./PlayerController.js";
import Constants from "./Constants.js";
import Player from "./Player.js";

//control the spawning of the Pickups

let playerController;
let gameManager;
let animateHelper = 0;
let torchLife = 1500;
let batteryCounter = 0;

const ctx = document.getElementById("inventory").getContext("2d");

class WorldManager {
  constructor(scene, grid, player, clock) {
    this.scene = scene;
    this.player = player;
    this.grid = grid;
    this.batteries = [];
    this.gateKey = null;
    this.torchLife = 100;
    this.worldStates = {
      monsterLevel: 1,
      scene: "maze1",
    };
    this.clock = new THREE.Clock();
    this.numBatterys = Math.floor(grid.length / 10);
  }

  async loadBattery(x, z) {
    this.batteries.push(new Battery(x, z));
    await this.batteries[this.batteries.length - 1].makeBattery(
      this.scene,
      x,
      z
    );
  }

  async loadKey(x, z) {
    this.gateKey = new GateKey(x, z);
    await this.gateKey.makeKey(this.scene, x, z);
  }

  updateObjs() {
    this.gateKey.mesh.rotation.y += 2 / 180;
    for (let battery of this.batteries) {
      battery.mesh.rotation.y += 2 / 180;
      if (animateHelper < 35) {
        battery.mesh.translateY(0.02);
      } else if (animateHelper < 70 && animateHelper >= 35) {
        battery.mesh.translateY(-0.02);
      }
    }

    if (animateHelper < 35) {
      this.gateKey.mesh.translateY(0.02);
      animateHelper++;
    } else if (animateHelper < 70 && animateHelper >= 35) {
      this.gateKey.mesh.translateY(-0.02);
      animateHelper++;
    } else if (animateHelper >= 70) {
      animateHelper = 0;
    }
  }

  async setBatteries() {
    let numBats = 0;
    let iter = 0;
    while (numBats < this.numBatterys && iter < 100) {
      let randX =
        Math.floor(Math.random() * ((this.grid.length - 1) / 2)) * 2 + 1;
      let randZ =
        Math.floor(Math.random() * ((this.grid.length - 1) / 2)) * 2 + 1;
      if (this.grid[randX][randZ] === false) {
        if (this.batteries.length != 0) {
          let duplicate = false;
          for (let battery of this.batteries) {
            if (
              (battery.x === randX && battery.z === randZ) ||
              (this.gateKey.x === randX && this.gateKey.z === randZ)
            ) {
              duplicate = true;
              break;
            }
          }
          if (!duplicate) {
            await this.loadBattery(randX, randZ);
            numBats++;
          }
        } else {
          await this.loadBattery(randX, randZ);
          numBats++;
        }
      }
      iter++;
    }
  }

  async setKey() {
    let randX =
      Math.floor(Math.random() * ((this.grid.length - 1) / 2)) * 2 + 1;
    let randZ =
      Math.floor(Math.random() * ((this.grid.length - 1) / 2)) * 2 + 1;
    if (this.grid[randX][randZ] === false) {
      await this.loadKey(randX, randZ);
    }
  }

  pickUpBattery(x, z) {
    for (let battery of this.batteries) {
      if (
        x <= battery.mesh.position.x + 10 &&
        x >= battery.mesh.position.x - 10 &&
        z <= battery.mesh.position.z + 10 &&
        z >= battery.mesh.position.z - 10
      ) {
        let index = this.batteries.indexOf(battery);
        batteryCounter++;
        //this.updateBatteyLife();
        battery.mesh.visible = false;
        //battery.batteryPicked = true;
        this.batteries.splice(index, 1);
      }
    }
  }

  pickUpKey(x, z) {
    if (
      x <= this.gateKey.mesh.position.x + 10 &&
      x >= this.gateKey.mesh.position.x - 10 &&
      z <= this.gateKey.mesh.position.z + 10 &&
      z >= this.gateKey.mesh.position.z - 10
    ) {
      this.keyDisplay();
      this.player.hasKey = true;
      this.gateKey.mesh.visible = false;
    }
  }

  torchDisplay() {
    let img = document.createElement("img");
    img.src = "./assets/itemPics/torch2.png";

    ctx.save();
    ctx.scale(0.2, 0.2);
    // ctx.translate(-10, 0)
    ctx.drawImage(img, -150, 50);
    this.lifeBar();
    ctx.restore();
  }

  keyDisplay() {
    let img = document.createElement("img");
    img.src = "./assets/itemPics/key2.png";
    ctx.save();
    ctx.scale(0.1, 0.1);
    ctx.drawImage(img, -80, 900);
    ctx.restore();
  }

  batteryDisplay() {
    let img = document.createElement("img");
    img.src = "./assets/itemPics/batteryFinal.png";
    //outputs the number of baatteries the player has.
    document.getElementById("numBats").innerHTML = "X" + batteryCounter;
    ctx.save();
    ctx.scale(0.2, 0.12);
    ctx.drawImage(img, 10, 415);

    ctx.restore();
  }
  displayItems() {
    this.torchDisplay();
    //this.keyDisplay();
    this.batteryDisplay();
  }

  lifeBar(torchState) {
    var delta = this.clock.getDelta();
    //this decreases the torches life bar
    if (torchState) {
      if (this.torchLife >= 0) {
        this.torchLife -= Constants.TORCH_DEPLETION_RATE * 100 * delta;
      }
    }
    ctx.fillStyle = "#ffffffa0";
    ctx.strokeStyle = "white";
    ctx.clearRect(500, 100, 1000, 200);
    ctx.rect(500, 100, 800, 100);
    ctx.stroke();
    ctx.fillRect(500, 100, (this.torchLife / 100) * 800, 100);
    ctx.rect(500 + 800, 125, 30, 50);
    ctx.stroke();
  }

  //refills the torch to full after the battery runs out
  refillTorch() {
    this.batteryDisplay();
    if (Math.floor(this.torchLife) <= 0 && batteryCounter > 0) {
      this.torchLife = 100;
      batteryCounter--;
    }
  }
}

export default WorldManager;
