import * as THREE from "three";
import state from "./State";
class SoundManagerGlobal {
    constructor(playerController, soundPath, footstep) {
        this.playerController = playerController;
        const listener = new THREE.AudioListener();
        playerController.camera.add(listener);
        const sound = new THREE.Audio(listener);
        this.sound = sound
        // load a sound and set it as the Audio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(soundPath, function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(1);
            sound.play();


        })

        const sound2 = new THREE.Audio(listener);
        this.sound2 = sound2
        const audioLoader2 = new THREE.AudioLoader();
        audioLoader.load(footstep, function (buffer) {
            sound2.setBuffer(buffer);
            sound2.setLoop(true);
            sound2.setVolume(0.2);
        })
        sound2.hasPlaybackControl = true;

        this.isWalkPlaying = false;

    }

    getSound() {
        return this.sound
    }

    //updateVolume()
    //{
    //this.sound.setRefDistance()
    //}
    walking() {
        const walking = this.playerController.isMoving()
        if (walking) {
            if (!this.isWalkPlaying) {
                this.sound2.play()
                this.isWalkPlaying = true;
            }
        }
        else {
            this.sound2.pause();
            this.isWalkPlaying = false;
        }
    }

    pause() {
        if (!state.isPlaying) {
            this.sound.pause()
        }
        else if (state.isPlaying && !this.sound.isPlaying) {
            this.sound.play()
        }
    }
    getIsplaying() {
        return this.sound.getIsplaying()
    }
}

export default SoundManagerGlobal