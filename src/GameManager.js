import {
	BoxBufferGeometry,
	Mesh,
	MeshBasicMaterial,
	Scene,
	WebGLRenderer,
	Clock
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import PlayerController from './PlayerController.js'
let playerController, scene, renderer;

const clock = new Clock();

class GameManager {

	init() {
		// get width and height of viewport
		const innerWidth = window.innerWidth;
		const innerHeight = window.innerHeight;
		scene = new Scene();

		const geometry = new BoxBufferGeometry( 200, 200, 200 );
		const material = new MeshBasicMaterial();

		const mesh = new Mesh( geometry, material );
		scene.add( mesh );

		renderer = new WebGLRenderer( { antialias: false } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( innerWidth/4, innerHeight/4 );
		renderer.domElement.style.width = innerWidth;
		renderer.domElement.style.height = innerHeight;

		document.body.appendChild( renderer.domElement );

		playerController = new PlayerController(0, 0, 400, renderer.domElement);
		scene.add(playerController.controls.getObject());
		window.addEventListener( 'resize', onWindowResize, false );

		animate();

	}

}

function onWindowResize() {

	playerController.camera.aspect = window.innerWidth / window.innerHeight;
	playerController.camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
	requestAnimationFrame( animate );
	playerController.handleMovements();
	render();
}

function render(){
	renderer.render( scene, playerController.camera );
}

export default GameManager;
