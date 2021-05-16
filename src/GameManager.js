import {
	BoxBufferGeometry,
	BoxGeometry,
	Mesh,
	MeshBasicMaterial,
	ShadowMaterial,
	Scene,
	WebGLRenderer,
	Clock,
	Vector3,
} from 'three';

import PlayerController from './PlayerController.js'
let playerController, scene, renderer, physicsWorld, clock;
let rigidBodies = [], tmpTrans;


class GameManager {

	async init() {
		// get width and height of viewport
		const innerWidth = window.innerWidth;
		const innerHeight = window.innerHeight;
		clock = new Clock();

		// initializing physics
		await Ammo();

		tmpTrans = new Ammo.btTransform();

		initGraphics();
		initPhysics();
		initPlane();
		initBox();

		// const geometry = new BoxBufferGeometry( 200, 200, 200 );
		// const material = new MeshBasicMaterial();

		// const box = new InstancedMesh( 
		// 	new BoxBufferGeometry( 200, 200, 200 ), 
		// 	new MeshBasicMaterial(),
		// 	1000
		// );
		// box.instanceMatrix.setUsage( DynamicDrawUsage ); 


		// const floor = new Mesh(
		// 	new BoxGeometry( 500, 1, 500 ),
		// 	new MeshBasicMaterial({color:0xaa0000})
		// );
		
		// floor.position.y = -200;
		// scene.add( box );
		// scene.add( floor );

		// physics.addMesh(floor);
		// physics.addMesh(box);




		window.addEventListener( 'resize', onWindowResize, false );

		animate();

	}

}

function initPhysics(){
    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
     	dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -100, 0));
}

function initGraphics(){


	scene = new Scene();

	renderer = new WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( innerWidth/4, innerHeight/4 );
	renderer.domElement.style.width = innerWidth;
	renderer.domElement.style.height = innerHeight;
	document.body.appendChild( renderer.domElement );

	playerController = new PlayerController(0, 0, 400, renderer.domElement);
	scene.add(playerController.controls.getObject());
}

function onWindowResize() {

	playerController.camera.aspect = window.innerWidth / window.innerHeight;
	playerController.camera.updateProjectionMatrix();

	renderer.setSize( innerWidth/4, innerHeight/4 );
	renderer.domElement.style.width = innerWidth;
	renderer.domElement.style.height = innerHeight;
}

function animate() {
	let deltaTime = clock.getDelta();
	updatePhysics( deltaTime );
	requestAnimationFrame( animate );
	playerController.handleMovements();
	render();
}

function render(){
	renderer.render( scene, playerController.camera );
}

function initPlane(){
	let pos = {x: 0, y: -200, z: 0};
    let scale = {x: 500, y: 2, z: 500};
    let quat = {x: 0, y: 0, z: 0, w: 1}; //quaternions for rotation
    let mass = 0; // mass = 0 because the floor is static

	
	// initialize the plane mesh
	let plane = new Mesh(new BoxBufferGeometry(scale.x, scale.y, scale.z), new MeshBasicMaterial({ color: 0x111111 }));
	plane.position.set(pos.x, pos.y, pos.z);

	// add mesh to scene
	scene.add(plane);


	// ammo.js
	// setup ammo.js tranform object
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

	// setup the shape of the collider that matches the shape of the mesh
	let colliderShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x, scale.y, scale.z) );
    colliderShape.setMargin( 0.05 );

	// setup inertia of the object
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colliderShape.calculateLocalInertia( mass, localInertia );

	// generate the rigidbody
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colliderShape, localInertia );
	let rb = new Ammo.btRigidBody( rbInfo );

	physicsWorld.addRigidBody(rb);
}

function initBox(){
    let pos = {x: 0, y: 0, z: 0};
	let scale = {x: 200, y: 200, z: 200};
	let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 1;

	// initialize box mesh
	let box = new Mesh(new BoxBufferGeometry(scale.x, scale.y, scale.z),new MeshBasicMaterial({color: 0xFF0000}));
	scene.add(box);

	
	// ammo.js
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colliderShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x*0.5, scale.y*0.5, scale.z*0.5) );
	colliderShape.setMargin( 0.05 );

	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colliderShape.calculateLocalInertia( mass, localInertia );

	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colliderShape, localInertia );
	let rb = new Ammo.btRigidBody( rbInfo );


	physicsWorld.addRigidBody( rb );

    box.userData.physicsBody = rb;
    rigidBodies.push(box); // add only the box because only its position needs to be updated
}

function updatePhysics( deltaTime ){

    // Step world, next time stamp
    physicsWorld.stepSimulation( deltaTime, 10 );
    // Update rigid bodies
    for ( let i = 0; i < rigidBodies.length; i++ ) {
        let objThree = rigidBodies[ i ];
		console.log(objThree.position);
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if ( ms ) {
            ms.getWorldTransform( tmpTrans );

            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

        }
    }

}



export default GameManager;
