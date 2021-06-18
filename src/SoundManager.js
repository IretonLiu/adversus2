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

  pause() {
    this.sound.pause();
  }

}

export default SoundManager;
