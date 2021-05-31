import * as THREE from "three";
import state from "./State";
class SoundManager
{
constructor(obj, playerController,soundPath)
{
    this.playerController = playerController;
    this.obj = obj;
    const listener = new THREE.AudioListener();
    playerController.camera.add( listener );
    const sound = new THREE.PositionalAudio( listener );
    this.sound = sound
    this.obj.add(this.sound)
    // load a sound and set it as the Audio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( soundPath, function( buffer ) {
          sound.setBuffer( buffer );
          sound.setLoop( true );
          sound.setVolume( 10);
          sound.play();
        
          
        })
    sound.setRefDistance(3)
    
}

getSound()
{
    return this.sound
}

//updateVolume()
//{
    //this.sound.setRefDistance()
//}

pause()
{
    if(!state.isPlaying)
    {   
         this.sound.pause()
    }
    else if(state.isPlaying && !this.sound.isPlaying)
    {
         this.sound.play() 
    }    
}
getIsplaying()
{
    return this.sound.getIsplaying()
}

bind(mesh)
{
    mesh.add(this.sound);
    //this.pause();
}
}

export default SoundManager