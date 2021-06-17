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
        //const audioLoader2 = new THREE.AudioLoader();
        audioLoader.load(footstep, function (buffer) {
            sound2.setBuffer(buffer);
            sound2.setLoop(true);
            sound2.setVolume(0.1);
        })
        sound2.hasPlaybackControl = true;

        this.isWalkPlaying = false;
        sound2.hasPlaybackControl = true;

        this.isWalkPlaying = false;

        const batterySound = new THREE.Audio(listener);
        this.batterySound = batterySound
        audioLoader.load("assets/Sounds/batteryPickup.mp3", function (buffer) {
            batterySound.setBuffer(buffer);
            batterySound.setLoop(false);
            batterySound.setVolume(0.1);
        })

        
        const keySound = new THREE.Audio(listener);
        this.keySound = keySound
        audioLoader.load("assets/Sounds/keyPickup.mp3", function (buffer) {
            keySound.setBuffer(buffer);
            keySound.setLoop(false);
            keySound.setVolume(0.5);
        })

    }

    nondefault()
    {
        this.sound.pause()
        this.sound2.pause()
    }

    batteryPickup(){
        this.batterySound.play()
    }

    keyPickup(){
        console.log("keypicked up")
        if(!this.keySound.isPlaying)
        {
        this.keySound.play()
        }
    }


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

    setFootstepVol(newVolume) {
        this.sound2.setVolume(newVolume);
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