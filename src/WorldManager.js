import * as THREE from "three";
import { Battery } from "./PickUps.js";
import { GateKey } from "./PickUps.js";

//control the spawning of the Pickups
let animateHelper = 0;

const ctx = document.getElementById("inventory").getContext("2d");

class WorldManager {
  constructor(player, grid) {
    this.scene = null;
    this.player = player;
    this.grid = grid;
    this.batteries = [];
    this.gateKey = null;
    this.clock = new THREE.Clock();
    // this.numBatterys = Math.ceil(this.grid.length * 5 / 3);

    this.hasSetObjects = false;
  }

  async updateScene(scene) {
    this.scene = scene;

    if (!this.hasSetObjects) {
      await this.setKey();
      await this.setBatteries();

      this.hasSetObjects = true;
    }

    for (let battery of this.batteries) {
      battery.displayBattery(this.scene);
    }
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
    await this.batteries[this.batteries.length - 1].makeBattery(x, z);
  }

  async loadKey(x, z) {
    this.gateKey = new GateKey(x, z);
    await this.gateKey.makeKey(this.scene, x, z);
  }

  async setBatteries() {
    let numBats = 0;
    let iter = 0;
    const totalNumBatteries = Math.ceil(this.grid.length / 10);
    while (numBats < totalNumBatteries && iter < 100) {
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
    var x = player.playerController.playerObject.position.x;
    var z = player.playerController.playerObject.position.z;

    for (let battery of this.batteries) {
      if (
        x <= battery.mesh.position.x + 10 &&
        x >= battery.mesh.position.x - 10 &&
        z <= battery.mesh.position.z + 10 &&
        z >= battery.mesh.position.z - 10
      ) {
        let index = this.batteries.indexOf(battery);
        player.soundmanager.batteryPickup()
        player.batteryCount++;
        //this.updateBatteyLife();
        battery.mesh.visible = false;
        //battery.batteryPicked = true;
        this.batteries.splice(index, 1);
      }
    }
  }

  pickUpKey(player) {
    var x = player.playerController.playerObject.position.x;
    var z = player.playerController.playerObject.position.z;
    if (
      x <= this.gateKey.mesh.position.x + 10 &&
      x >= this.gateKey.mesh.position.x - 10 &&
      z <= this.gateKey.mesh.position.z + 10 &&
      z >= this.gateKey.mesh.position.z - 10
    ) {

      switch (this.scene.name) {
        case "maze1":
          player.pickUpKey(0);
          this.keyDisplay(5,1);
          break;
        case "maze2":
          player.pickUpKey(1);
          this.keyDisplay(225,2);
          break;
        case "maze3":
          player.pickUpKey(2);
          this.keyDisplay(445,3);
          break;
      }

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
    ctx.scale(0.23, 0.12);
    ctx.drawImage(img, 10, 415);
    ctx.restore();
  }

  keyDisplay(xPos,picNum) {
    let img
    switch(picNum){
    case 1:
      img = document.getElementById("keyPic1");
      break;
    case 2:
      img = document.getElementById("keyPic2");
      break;
    case 3:
      img = document.getElementById("keyPic3");
      break;
    }
    

    ctx.save();
    ctx.scale(0.335, 0.117);
    ctx.drawImage(img, xPos, 795);
    ctx.restore();
  }


  torchDisplay() {
    let img = document.getElementById("torchPic");

    ctx.save();
    ctx.scale(0.21, 0.2);
    ctx.drawImage(img, -150, 50);
    ctx.restore();
  }

  displayItems() {
    this.batteryDisplay();
    this.torchDisplay();
    // this.keyDisplay(5,1);
    // this.keyDisplay(225,2);
    // this.keyDisplay(445,3);
  }
}

export default WorldManager;
