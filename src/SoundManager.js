import * as THREE from "three";
import state from "./State";
class SoundManager {
    constructor(obj, playerController, soundPath, monstermanager) {
        this.monstermanager = monstermanager
        this.playerController = playerController;
        this.obj = obj;
        const listener = new THREE.AudioListener();
        playerController.camera.add(listener);
        const sound = new THREE.PositionalAudio(listener);
        this.sound = sound
        this.obj.add(this.sound)
        // load a sound and set it as the Audio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(soundPath, function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(5);
            sound.play()


        })
        sound.setRefDistance(2);

    }

    getSound() {
        return this.sound
    }
     monsterSoundTracker() {
        if (monsterManager.monster != null) {
          if (sound == null) {
             sound = new THREE.PositionalAudio(listener);
          } else {
            if (monsterManager.monster.Mesh != null) {
              bind(monsterManager.monster.Mesh);
            } else {
              sound.pause();
            }
          }
        } else {
          if (sound != null) {
            sound.pause();
          }
          sound = null;
        }
      }
    //updateVolume()
    //{
    //this.sound.setRefDistance()
    //}

    pause() {

        this.sound.pause()


    }
    getIsplaying() {
        return this.sound.getIsplaying()
    }

    bind(mesh) {
        
        mesh.add(this.sound);
        this.sound.panner.position= this.obj.position
    }
}

export default SoundManager