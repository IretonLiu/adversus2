
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
    this.physicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));
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

  createPlayerRB(playerObject) {

    const STATE = { DISABLE_DEACTIVATION: 4 }

    const pos = playerObject.position;
    const quat = playerObject.quaternion;
    // setup ammo.js tranform object
    const mass = 1;
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y - 3, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    // setup the shape of the collider that matches the shape of the mesh
    // let colliderShape = new Ammo.btBoxShape(new Ammo.btVector3(boxBreadth, boxHeight, boxWidth));
    let colliderShape = new Ammo.btSphereShape(3);
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
    rb.setActivationState(STATE.DISABLE_DEACTIVATION)
    this.physicsWorld.addRigidBody(rb);

    playerObject.userData.physicsBody = rb;
    this.rigidBodies.push(playerObject);

  }

  createRoomRB(room, threeObj, size) {
    let transform = new Ammo.btTransform();
    const pos = threeObj.position.clone().add(room.position)

    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(threeObj.quaternion.x, threeObj.quaternion.y, threeObj.quaternion.z, threeObj.quaternion.w)
    );

    let motionState = new Ammo.btDefaultMotionState(transform);
    let colliderShape = new Ammo.btBoxShape(
      new Ammo.btVector3(size.x / 2, size.y / 2, size.z / 2)
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
    threeObj.userData.physicsBody = rb;
  }

  createBoxRB(threeObj, size) {
    let transform = new Ammo.btTransform();
    const pos = threeObj.position;
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, 10, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(threeObj.quaternion.x, threeObj.quaternion.y, threeObj.quaternion.z, threeObj.quaternion.w)
    );

    let motionState = new Ammo.btDefaultMotionState(transform);
    let colliderShape = new Ammo.btBoxShape(
      new Ammo.btVector3(size.x / 2, size.y / 2, size.z / 2)
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
    threeObj.userData.physicsBody = rb;
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
