import * as THREE from "three";

class Physics {
  constructor() {
    this.physicsWorld = null;
    this.rigidBodies = [];
    this.tmpTrans = new Ammo.btTransform();
  }

  initPhysics() {
    // Ammojs initialisation
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();

    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      overlappingPairCache,
      solver,
      collisionConfiguration
    );
    this.physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    console.log("Initialized physics");
  }

  createWallRB(wall, wallWidth, wallHeight) {
    let pos = wall.position;
    let quat = wall.quaternion;

    let transform = new Ammo.btTransform();

    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );

    let motionState = new Ammo.btDefaultMotionState(transform);
    let colliderShape = new Ammo.btBoxShape(
      new Ammo.btVector3(wallWidth / 2, wallHeight / 2, wallWidth / 2)
    );
    colliderShape.setMargin(0.05);

    // setup inertia of the object
    let localInertia = new Ammo.btVector3(0, 0, 0);
    colliderShape.calculateLocalInertia(0, localInertia);

    // generate the rigidbody
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      0,
      motionState,
      colliderShape,
      localInertia
    );
    let rb = new Ammo.btRigidBody(rbInfo);
    rb.setRestitution(1);
    this.physicsWorld.addRigidBody(rb);

    wall.userData.physicsBody = rb;
    this.rigidBodies.push(wall);
  }

  genBoxRB(pos, scale, quat, mass, scene) {
    // initialize the box mesh this part will probably be removed after models are loaded in
    let box = new THREE.Mesh(
      new THREE.BoxBufferGeometry(scale.x, scale.y, scale.z),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    box.position.set(pos.x, pos.y, pos.z);
    box.quaternion.set(quat.x, quat.y, quat.z, quat.w);

    // add mesh to scene
    scene.add(box);

    // ammo.js
    // setup ammo.js tranform object
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    // setup the shape of the collider that matches the shape of the mesh
    let colliderShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x / 2, scale.y / 2, scale.z / 2)
    );
    colliderShape.setMargin(0.05);

    // setup inertia of the object
    let localInertia = new Ammo.btVector3(1, 0, 0);
    colliderShape.calculateLocalInertia(mass, localInertia);

    // generate the rigidbody
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colliderShape,
      localInertia
    );
    let rb = new Ammo.btRigidBody(rbInfo);
    rb.setRestitution(0.8);

    this.physicsWorld.addRigidBody(rb);
  }

  genBallRB(pos, radius, quat, mass) {
    // initialize the box mesh this part will probably be removed after models are loaded in
    let ball = new THREE.Mesh(
      new THREE.SphereBufferGeometry(radius, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0xee0000 })
    );
    ball.position.set(pos.x, pos.y, pos.z);

    // add mesh to scene

    // ammo.js

    const STATE = { DISABLE_DEACTIVATION: 4 }

    // setup ammo.js tranform object
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    // setup the shape of the collider that matches the shape of the mesh
    let colliderShape = new Ammo.btSphereShape(radius);
    colliderShape.setMargin(0.05);

    // setup inertia of the object
    let localInertia = new Ammo.btVector3(0, 0, 0);
    colliderShape.calculateLocalInertia(mass, localInertia);

    // generate the rigidbody
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colliderShape,
      localInertia
    );
    let rb = new Ammo.btRigidBody(rbInfo);
    rb.setFriction(4);
    rb.setRollingFriction(10);
    rb.setActivationState(STATE.DISABLE_DEACTIVATION)
    this.physicsWorld.addRigidBody(rb);

    ball.userData.physicsBody = rb;
    this.rigidBodies.push(ball);

    return ball;

  }

  updatePhysics(deltaTime) {
    // Step world, next time stamp
    this.physicsWorld.stepSimulation(deltaTime, 10);
    // Update rigid bodies

    for (let i = 0; i < this.rigidBodies.length; i++) {
      let objThree = this.rigidBodies[i];
      let objAmmo = objThree.userData.physicsBody;
      // console.log(objAmmo);
      let ms = objAmmo.getMotionState();
      if (ms) {

        ms.getWorldTransform(this.tmpTrans);

        let p = this.tmpTrans.getOrigin();
        let q = this.tmpTrans.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    }
  }
}

export default Physics;
