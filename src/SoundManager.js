import * as THREE from "three";
import state from "./State";
class SoundManager {
  constructor(monsterMesh, playerController, soundPath) {
    this.monsterMesh = monsterMesh;
    this.playerController = playerController;
    const listener = new THREE.AudioListener();
    playerController.camera.add(listener);

    const sound = new THREE.PositionalAudio(listener);
    // load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(soundPath, function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(5);
      sound.play();
    });
    sound.setRefDistance(2);

    this.sound = sound;

    this.monsterMesh.add(this.sound);
  }

  getSound() {
    return this.sound;
  }
  // monsterSoundTracker() {
  //   if (monsterManager.monster != null) {
  //     if (sound == null) {
  //       sound = new THREE.PositionalAudio(listener);
  //     } else {
  //       if (monsterManager.monster.Mesh != null) {
  //         bind(monsterManager.monster.Mesh);
  //       } else {
  //         sound.pause();
  //       }
  //     }
  //   } else {
  //     if (sound != null) {
  //       sound.pause();
  //     }
  //     sound = null;
  //   }
  // }
  //updateVolume()
  //{
  //this.sound.setRefDistance()
  //}

  pause() {
    this.sound.pause();
  }
  getIsplaying() {
    return this.sound.getIsplaying();
  }

  // bind(mesh) {
  //   this.obj.add(this.sound)
  //   mesh.add(this.sound);
  //   // this.sound.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
  //   // this.sound.panner.position = this.obj.position
  // }
}

export default SoundManager;
