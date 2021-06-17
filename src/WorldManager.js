import * as THREE from "three";
import { Battery } from "./PickUps.js";
import { GateKey } from "./PickUps.js";

//control the spawning of the Pickups
let animateHelper = 0;

const ctx = document.getElementById("inventory").getContext("2d");

class WorldManager {
  //sets up all the worldManagers variables
  constructor(player, grid) {
    this.scene = null;
    this.player = player;
    this.grid = grid;
    this.batteries = [];
    this.gateKey = null;
    this.clock = new THREE.Clock();
    this.hasSetObjects = false;

  }

  //updates all the aspects of the worldManager
  async updateScene(scene) {
    //gets the current scene
    this.scene = scene;

    //checks to see if the objects have been set so that new objects,
    //dont spawn when we go back into the same scene again
    if (!this.hasSetObjects) {
      await this.setKey();
      await this.setBatteries();

      this.hasSetObjects = true;
    }

    //displays the remaining batteries in the battery array for the appropriate scene
    for (let battery of this.batteries) {
      battery.displayBattery(this.scene);
    }
  }


  //updates the rotation and movement of the battery and keys
  updateObjs() {
    //the animator helps keep track of how many frames have
    //this is to get a nice movement for the objects.
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

  //loads the battery by sending the battery object to pickUp class to get rendered.
  async loadBattery(x, z) {
    this.batteries.push(new Battery(x, z));
    await this.batteries[this.batteries.length - 1].makeBattery(x, z);
  }

  //loads the key by sending the key object to pickUp class to get rendered.
  async loadKey(x, z) {
    this.gateKey = new GateKey(x, z);
    await this.gateKey.makeKey(this.scene, x, z);
  }

  //this sets the batteries by making sure it has a valid x and z position
  async setBatteries() {
    //number of batteries spawned
    let numBats = 0;
    //max number of iterations to make sure that it can never get stuck on this call
    let iter = 0;
    //the total number of batteries we want in each respective grid depending on its size
    const totalNumBatteries = Math.ceil(this.grid.length / 10);
    //this is to make sure we get enough batteries and that it doesnt stay in this call for to long
    while (numBats < totalNumBatteries && iter < 100) {
      //gets a random x and z value for the battery to be spawned.
      let randX =
        Math.floor(Math.random() * ((this.grid.length - 1) / 2)) * 2 + 1;
      let randZ =
        Math.floor(Math.random() * ((this.grid.length - 1) / 2)) * 2 + 1;
        //check to see if the battery is spawing in a valid location
        //i.e. not inside a wall
      if (this.grid[randX][randZ] === false) {
        //check to see if any "battery" has been added to the batteries array
        if (this.batteries.length != 0) {
          let duplicate = false;
          //loop through all the batteries
          for (let battery of this.batteries) {
            //check to make sure that the battery doesnt spawn on other batteries and on the key
            if (
              (battery.x === randX && battery.z === randZ) ||
              (this.gateKey.x === randX && this.gateKey.z === randZ)
            ) {
              //if it does we set duplicate to true
              duplicate = true;
              break;
            }
          }
          //if its not a duplicate position we add a battery to the batteries array 
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

  //sets the keys position
  async setKey() {
    // gives a random x and z value to the keys position
    //make sure it spawns in the latter halfs of the mazes
    let randX =
      Math.floor((Math.random()*(1-0.5)+0.5) * ((this.grid.length - 1) / 2)) * 2 +1;
    let randZ =
      Math.floor((Math.random()*(1-0.5)+0.5) * ((this.grid.length - 1) / 2)) * 2 + 1;
      //makes sure that it is spawning in a valid square
    if (this.grid[randX][randZ] === false) {
      await this.loadKey(randX, randZ);
    }
  }

  //what happens when a battery is picked up
  pickUpBattery(player) {
    //we get the players x and z positions
    var x = player.playerController.playerObject.position.x;
    var z = player.playerController.playerObject.position.z;

    //check to see if the player is with in a certain distance of the battery
    for (let battery of this.batteries) {
      if (
        x <= battery.mesh.position.x + 10 &&
        x >= battery.mesh.position.x - 10 &&
        z <= battery.mesh.position.z + 10 &&
        z >= battery.mesh.position.z - 10
      ) {
        //if it is we go through the battery array to get the index of the battery
        let index = this.batteries.indexOf(battery);
        //plays a sound to show that the battery has been picked up
        player.soundmanager.batteryPickup()
        //increasing the number of batteries the player has
        player.batteryCount++;
        //make the battery not visible
        battery.mesh.visible = false;
        //remove the picked up battery from the batteries array
        this.batteries.splice(index, 1);
      }
    }
  }

  //what happens when a key is picked up
  pickUpKey(player) {
    //get the x and z value of the player
    var x = player.playerController.playerObject.position.x;
    var z = player.playerController.playerObject.position.z;
    //check to see if the player is with in a certain range of the key
    if (
      x <= this.gateKey.mesh.position.x + 10 &&
      x >= this.gateKey.mesh.position.x - 10 &&
      z <= this.gateKey.mesh.position.z + 10 &&
      z >= this.gateKey.mesh.position.z - 10
    ) {

      //switch case to display the correct keys for the relevant mazes
      switch (this.scene.name) {
        case "maze1":
          //player cant pick up a key he already has
          if (!player.hasKey(0)) {
            player.pickUpKey(0);
            //x translation of the key and the key number to be displayed
            this.keyDisplay(5, 1);
          }

          break;
        case "maze2":
          if (!player.hasKey(1)) {
            player.pickUpKey(1);
            this.keyDisplay(225, 2);
          }

          break;
        case "maze3":
          if (!player.hasKey(2)) {
            player.pickUpKey(2);
            this.keyDisplay(445, 3);
          }

          break;
      }
      //make the key mesh invisible
      this.gateKey.mesh.visible = false;
    }
  }

  //all update functions for worldManager
  update(player) {
    //updates the movement of the objects
    this.updateObjs();
    //updates the picked up items
    this.pickUpItems(player);
    //displays appropriate items
    this.displayItems();
  }

  //deals with item pick up's.
  pickUpItems(player) {
    //battery pick up
    this.pickUpBattery(player);
    //key pickup
    this.pickUpKey(player);
  }

  //handles displaying of the battery image
  batteryDisplay() {
    //gets the battery image from the index.html file
    let img = document.getElementById("batteryPic");

    //draws the image to the context with the relative scaling and translations
    ctx.save();
    ctx.scale(0.23, 0.12);
    ctx.drawImage(img, 10, 415);
    ctx.restore();
  }

  //handles displaying of the the keys
  //takes in an x translation and which key number the player has picked up
  keyDisplay(xPos, picNum) {
    //initiale an image variable
    let img

    //depending on which key has been picked up the img variable gets set to the appropriate element
    //gets the element id from the index.html 
    switch (picNum) {
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

    //draws the image to the context with the relative scaling and translations
    ctx.save();
    ctx.scale(0.335, 0.117);
    ctx.drawImage(img, xPos, 795);
    ctx.restore();
  }

  //handles displaying of the the torch
  torchDisplay() {
    //gets the img by element of the torch pick from the index.html
    let img = document.getElementById("torchPic");

    //draws the image to the context with the relative scaling and translations
    ctx.save();
    ctx.scale(0.21, 0.2);
    ctx.drawImage(img, -150, 50);
    ctx.restore();
  }

  //displays the items pictures on the inventory portion of the screen
  displayItems() {
    this.batteryDisplay();
    this.torchDisplay();
  }
}

export default WorldManager;
