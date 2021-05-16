import * as THREE from "three";
import Maze from "./lib/MazeGenerator";
import PlayerController from "./PlayerController.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js";

let playerController, scene, renderer, physicsWorld;
const blockiness = 6;
let rigidBodies = [], tmpTrans;

const clock = new THREE.Clock();

class GameManager {

	async init() {


		// initializing physics
		await Ammo();

		tmpTrans = new Ammo.btTransform();

		initGraphics();
		initPhysics();
		// initPlane();
		// initBox();


		window.addEventListener('resize', onWindowResize, false);
		const light = new THREE.AmbientLight(0x050505);
		scene.add(light);

		renderMaze(scene);

		const floorGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
		const floorMaterial = new THREE.MeshStandardMaterial({
			color: 0x505050,
		});

		const floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.rotateX(-Math.PI / 2);
		floor.position.y = -20 / 2;
		floor.receiveShadow = true;
		scene.add(floor);

		animate();
	}
}




function initPhysics() {
	let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
		dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
		overlappingPairCache = new Ammo.btDbvtBroadphase(),
		solver = new Ammo.btSequentialImpulseConstraintSolver();

	physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -100, 0));
}

function initGraphics() {

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(innerWidth / blockiness, innerHeight / blockiness);
	renderer.domElement.style.width = innerWidth;
	renderer.domElement.style.height = innerHeight;
	document.body.appendChild(renderer.domElement);

	playerController = new PlayerController(-30, 0, 20, renderer.domElement);
	scene.add(playerController.controls.getObject());
}

function animate() {
	let deltaTime = clock.getDelta();
	updatePhysics(deltaTime);
	requestAnimationFrame(animate);
	playerController.update();
	render();
}

function renderMaze(scene) {
	var maze = new Maze(5, 5);
	maze.growingTree();
	var grid = maze.getThickGrid();
	grid[maze.getThickIndex(0, 1)] = false;
	grid[maze.getThickIndex(2 * maze.width - 1, 2 * maze.height)] = false;

	const wallSize = 20;
	const wallHeight = 0.2 * wallSize;
	const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
	wallMaterial.flatShading = true;

	var geometryArr = [];
	var wallRes = 50;
	for (var y = 0; y < 2 * maze.height + 1; y++) {
		for (var x = 0; x < 2 * maze.width + 1; x++) {
			if (grid[maze.getThickIndex(x, y)]) {
				var wallGeometry = new THREE.BoxGeometry(
					wallSize,
					0.8 * wallSize,
					wallSize,
					wallRes,
					wallRes,
					wallRes
				);

				// var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
				// wallMesh.position.set(x * wallSize, wallSize / 2, y * wallSize);
				// var helper = new VertexNormalsHelper(wallMesh, 2, 0x00ff00, 1);
				// scene.add(helper);
				// scene.add(wallMesh);

				const m = new THREE.Matrix4();
				m.set(
					1,
					0,
					0,
					x * wallSize,
					0,
					1,
					0,
					wallHeight / 2,
					0,
					0,
					1,
					y * wallSize,
					0,
					0,
					0,
					1
				);

				geometryArr.push(wallGeometry.applyMatrix4(m));
			}
		}
	}

	var mazeGeo = BufferGeometryUtils.mergeBufferGeometries(geometryArr);
	mazeGeo.computeVertexNormals();
	var mazeMesh = new THREE.Mesh(mazeGeo, wallMaterial);
	// mazeMesh.castShadow = true;
	// console.log(mazeMesh);
	mazeMesh.receiveShadow = true;
	scene.add(mazeMesh);
}

function onWindowResize() {
	playerController.camera.aspect = window.innerWidth / window.innerHeight;
	playerController.camera.updateProjectionMatrix();

	renderer.setSize(innerWidth / blockiness, innerHeight / blockiness);
	renderer.domElement.style.width = innerWidth;
	renderer.domElement.style.height = innerHeight;
}


function render() {
	renderer.render(scene, playerController.camera);
}

function initPlane() {
	let pos = { x: 0, y: -200, z: 0 };
	let scale = { x: 500, y: 2, z: 500 };
	let quat = { x: 0, y: 0, z: 0, w: 1 }; //quaternions for rotation
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
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
	let motionState = new Ammo.btDefaultMotionState(transform);

	// setup the shape of the collider that matches the shape of the mesh
	let colliderShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x, scale.y, scale.z));
	colliderShape.setMargin(0.05);

	// setup inertia of the object
	let localInertia = new Ammo.btVector3(0, 0, 0);
	colliderShape.calculateLocalInertia(mass, localInertia);

	// generate the rigidbody
	let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colliderShape, localInertia);
	let rb = new Ammo.btRigidBody(rbInfo);

	physicsWorld.addRigidBody(rb);
}

function initBox() {
	let pos = { x: 0, y: 0, z: 0 };
	let scale = { x: 200, y: 200, z: 200 };
	let quat = { x: 0, y: 0, z: 0, w: 1 };
	let mass = 1;

	// initialize box mesh
	let box = new Mesh(new BoxBufferGeometry(scale.x, scale.y, scale.z), new MeshBasicMaterial({ color: 0xFF0000 }));
	scene.add(box);


	// ammo.js
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
	let motionState = new Ammo.btDefaultMotionState(transform);

	let colliderShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
	colliderShape.setMargin(0.05);

	let localInertia = new Ammo.btVector3(0, 0, 0);
	colliderShape.calculateLocalInertia(mass, localInertia);

	let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colliderShape, localInertia);
	let rb = new Ammo.btRigidBody(rbInfo);


	physicsWorld.addRigidBody(rb);

	box.userData.physicsBody = rb;
	rigidBodies.push(box); // add only the box because only its position needs to be updated
}

function updatePhysics(deltaTime) {

	// Step world, next time stamp
	physicsWorld.stepSimulation(deltaTime, 10);
	// Update rigid bodies
	for (let i = 0; i < rigidBodies.length; i++) {
		let objThree = rigidBodies[i];
		console.log(objThree.position);
		let objAmmo = objThree.userData.physicsBody;
		let ms = objAmmo.getMotionState();
		if (ms) {
			ms.getWorldTransform(tmpTrans);

			let p = tmpTrans.getOrigin();
			let q = tmpTrans.getRotation();
			objThree.position.set(p.x(), p.y(), p.z());
			objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

		}
	}

}



export default GameManager;
