import Constants from "./Constants";
import PlayerController from "./PlayerController";

class SceneLoader {
    constructor(physics, scene, maze1, room1, playerController) {
        this.physics = physics;
        this.scene = scene;
        this.maze1 = maze1;
        this.room1 = room1;
        this.playerController = playerController;
        this.currentScene = "maze1";
    }

    loadScene(nextScene) {
        if (nextScene == "maze1") {
            
            this.scene.add(this.maze1);
        } else if (nextScene == "saferoom1") {
            this.clearScene();
            this.currentScene = "saferoom1";
            this.playerController.scene = this.room1;
            this.scene.add(this.room1);
        }

    }


    clearScene() {
        this.scene.traverse((child) => {
            if (child.userData.physicsBody)
                this.physics.physicsWorld.removeRigidBody(child.userData.physicsBody);

        });
        this.scene.remove(this.maze1)
        console.log(this.scene);
        this.playerController.reset();
        this.physics.createPlayerRB(this.playerController.playerObject);
    }
}

export default SceneLoader;