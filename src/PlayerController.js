import { 
    PerspectiveCamera, 
    Vector3
} from 'three';
import {  PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

class PlayerController{
    constructor(x, y ,z, domElement){

        // initializing all the variables 
        this.velocity = new Vector3();
        this.direction = new Vector3();
        this.prevTime = performance.now();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        // setting up the main player controller camera
        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000 )
        this.camera.position.set(x, y, z);
        
        //this.position = new Vector3(x, y, z);

        // set up the player controller to use the pointer lock controls
        this.controls = this.initControls(domElement);
        this.setUpControls(this);
        
    }

    initControls(domElement){
        const controls = new PointerLockControls(this.camera, domElement);
        controls.isLocked = true;
        return controls;
    }

    setUpControls(self){
        const onKeyDown = function ( event ) {
            console.log("keyDown");
            switch ( event.code ) {

                case 'KeyW':
                    self.moveForward = true;
                    break;

                case 'KeyA':
                    self.moveLeft = true;
                    break;

                case 'KeyS':
                    self.moveBackward = true;
                    break;

                case 'KeyD':
                    self.moveRight = true;
                    break;

                // case 'Space':
                //     if ( canJump === true ) velocity.y += 350;
                //     canJump = false;
                //     break;

            }

        };

        const onKeyUp = function ( event ) {

            switch ( event.code ) {

                case 'KeyW':
                    self.moveForward = false;
                    self.velocity = new Vector3(0,0,0);
                    break;

                case 'KeyA':
                    self.moveLeft = false;
                    break;

                case 'KeyS':
                    self.moveBackward = false;
                    break;

                case 'KeyD':
                    self.moveRight = false;
                    break;

            }

        };

        document.addEventListener( 'keydown', onKeyDown );
        document.addEventListener( 'keyup', onKeyUp );
    }

    handleMovements(){
        const speed = 100;
        const time = performance.now();
        const delta = ( time - this.prevTime ) / 1000;

        // get the direction by subtracting booleans 
        // since only one of the 2 can be true at any instance
        this.direction.z = Number( this.moveForward ) - Number( this.moveBackward );
        this.direction.x = Number( this.moveRight ) - Number( this.moveLeft );
        this.direction.normalize(); // this ensures consistent movements in all directions


        // example code with acceleration
        // if ( this.moveForward || this.moveBackward ) this.velocity.z -= this.direction.z * 400.0 * delta;
		// if ( this.moveLeft || this.moveRight ) this.velocity.x -= this.direction.x * 400.0 * delta;

        // constant velocity
        if ( this.moveForward || this.moveBackward ) this.velocity.z = -1 *this.direction.z * speed;
        else this.velocity.z = 0;
		if ( this.moveLeft || this.moveRight ) this.velocity.x = -1*this.direction.x * speed;
        else this.velocity.x = 0;

        this.controls.moveRight( - this.velocity.x * delta );
        this.controls.moveForward( - this.velocity.z * delta );

        this.prevTime = time;
    }

}

export default PlayerController;