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
  constructor() {
    this.scene = null;
    this.player = null;
    this.grid = null;
    this.batteries = [];
    this.maze1 = [];
    this.maze2 = [];
    this.maze3 = [];
    this.gateKey = null;
    this.clock = new THREE.Clock();
    //this.numBatterys = Constants.NUM_BATTERIES;
  }

  loadWorld(currScene, player, grid) {
    this.scene = currScene;
    this.player = player;
    if (grid) {
      this.grid = grid;
    }
    this.numBatterys = Constants.NUM_BATTERIES;
    //check what current scene is
    //check if the array has been created if not created init, if it is put it in the world

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

  pickUpBattery(player) {
    var x = player.playerController.playerObject.position.x
    var z = player.playerController.playerObject.position.z
    for (let battery of this.batteries) {
      if (
        x <= battery.mesh.position.x + 10 &&
        x >= battery.mesh.position.x - 10 &&
        z <= battery.mesh.position.z + 10 &&
        z >= battery.mesh.position.z - 10
      ) {
        let index = this.batteries.indexOf(battery);
        player.batteryCount++;
        //this.updateBatteyLife();
        battery.mesh.visible = false;
        //battery.batteryPicked = true;
        this.batteries.splice(index, 1);
      }
    }

  }

  pickUpKey(player) {
    var x = player.playerController.playerObject.position.x
    var z = player.playerController.playerObject.position.z
    if (
      x <= this.gateKey.mesh.position.x + 10 &&
      x >= this.gateKey.mesh.position.x - 10 &&
      z <= this.gateKey.mesh.position.z + 10 &&
      z >= this.gateKey.mesh.position.z - 10
    ) {
      this.keyDisplay();
      player.pickUpKey();
      this.gateKey.mesh.visible = false;
    }
  }

  update(player) {
    this.updateObjs(); //this needs to be just update for both battery and key
    this.pickUpItems(player);
    this.displayItems();

  }

  pickUpItems(player) {
    this.pickUpBattery(player);
    this.pickUpKey(player);
  }

  batteryDisplay() {
    let img = document.getElementById("batteryPic");

    //outputs the number of baatteries the player has.
    ctx.save();
    ctx.scale(0.2, 0.12);
    ctx.drawImage(img, 10, 415);
    ctx.restore();

  }
  keyDisplay() {
    let img = document.getElementById("keyPic");

    ctx.save();
    ctx.scale(0.1, 0.1);
    ctx.drawImage(img, -80, 900);
    ctx.restore();
  }

  torchDisplay() {

    let img = document.getElementById("torchPic");

    ctx.save();
    ctx.scale(0.2, 0.2);
    ctx.drawImage(img, -150, 50);
    ctx.restore();
  }


  displayItems() {
    this.batteryDisplay();
    this.torchDisplay();

  }




}

export default WorldManager;
