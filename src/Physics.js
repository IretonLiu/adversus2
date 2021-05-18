import {
    BoxBufferGeometry,
    SphereBufferGeometry
} from 'three';

class Physics {
    constructor() {
        this.physicsWorld;
        this.rigidBody = [];

    }

    initPhysics() {

        // Ammojs initialisation
        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
            overlappingPairCache = new Ammo.btDbvtBroadphase(),
            solver = new Ammo.btSequentialImpulseConstraintSolver();

        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -100, 0));
    }

    genBoxRB(pos, scale, quat, mass) {


        // initialize the box mesh this part will probably be removed after models are loaded in
        let box = new Mesh(new BoxBufferGeometry(scale.x, scale.y, scale.z), new MeshBasicMaterial({ color: 0x111111 }));
        box.position.set(pos.x, pos.y, pos.z);

        // add mesh to scene
        scene.add(box);


        // ammo.js
        // setup ammo.js tranform object
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        // setup the shape of the collider that matches the shape of the mesh
        let colliderShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x / 2, scale.y / 2, scale.z / 2));
        colliderShape.setMargin(0.05);

        // setup inertia of the object
        let localInertia = new Ammo.btVector3(0, 0, 0);
        colliderShape.calculateLocalInertia(mass, localInertia);

        // generate the rigidbody
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colliderShape, localInertia);
        let rb = new Ammo.btRigidBody(rbInfo);

        physicsWorld.addRigidBody(rb);
    }

    genBoxRB(pos, radius, quat, mass) {


        // initialize the box mesh this part will probably be removed after models are loaded in
        let ball = new Mesh(new SphereBufferGeometry(radius, 64, 64), new MeshBasicMaterial({ color: 0x111111 }));
        ball.position.set(pos.x, pos.y, pos.z);

        // add mesh to scene
        scene.add(ball);


        // ammo.js
        // setup ammo.js tranform object
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        // setup the shape of the collider that matches the shape of the mesh
        let colliderShape = new Ammo.btSphereShape(radius);
        colliderShape.setMargin(0.05);

        // setup inertia of the object
        let localInertia = new Ammo.btVector3(0, 0, 0);
        colliderShape.calculateLocalInertia(mass, localInertia);

        // generate the rigidbody
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colliderShape, localInertia);
        let rb = new Ammo.btRigidBody(rbInfo);

        physicsWorld.addRigidBody(rb);
    }

    updatePhysics(deltaTime) {

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

}

export default Physics;