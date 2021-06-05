import Constants from "./Constants";
import Door from "./Door";
import PlayerController from "./PlayerController";
import * as THREE from "three";
import WallGenerator from "./WallGenerator";
import Maze from "./lib/MazeGenerator";
class SceneLoader {
    constructor(physics, scene,) {
        this.physics = physics;
        this.scene = scene;

        this.player = null;
        // this.minimap = minimap;

        this.maze1 = null;
        this.grid1 = null;

        // this.room1 = null;
        this.currentScene = null;
        this.currentSceneName = "";

        // this.player.playerController.onInteractCB = this.onInteractCB;
    }

    loadScene(nextSceneName) {
        // clear the scene if one exists
        if (this.currentScene) this.clearScene();

        // initialize player rigidbody
        this.physics.createPlayerRB(this.playerController.playerObject);

        // load another scene based on the scene name
        if (nextSceneName == "maze1") {
            //this.scene.add(this.maze1);
            this.loadMaze1();
            this.player.playerController.scene = this.currentScene;

        } else if (nextSceneName == "saferoom1") {

            // TODO: change this
            this.scene.add(this.room1);
            this.player.playerController.scene = this.room1;
            this.currentScene = this.room1;
        }

    }


    clearScene() {
        // empty the geometry and the material used in the previous scene
        this.scene.traverse((child) => {
            if (child.userData.physicsBody)
                this.physics.physicsWorld.removeRigidBody(child.userData.physicsBody);
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
                this.scene.remove(child);
            }
        });
        this.scene.remove(this.currentScene)
        //console.log(this.scene);
        this.playerController.reset();
    }

    // initializes the maze structure
    initMaze1() {
        this.maze1 = new Maze(
            Constants.MAP1_SIZE,
            Constants.MAP1_SIZE,
            Constants.PROBABILITY_WALLS_REMOVED
        );
        this.maze1.growingTree();
        this.grid1 = this.maze1.getThickGrid();
    }

    // render and add the maze to the scene
    async loadMaze1() {
        if (!this.maze1)
            this.initMaze1();

        let grid1 = this.maze1.getThickGrid();
        grid1[2 * this.maze1.width - 1][2 * this.maze1.height] = false;
        const wallHeight = 25;
        const wallWidth = 30;

        const wallGenerator = new WallGenerator(wallWidth, wallHeight);

        const mazeGroup = new THREE.Group();

        for (var y = 0; y < 2 * this.maze1.height + 1; y++) {
            for (var x = 0; x < 2 * this.maze1.width + 1; x++) {
                if (this.grid1[y][x]) {
                    //var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
                    var wallMesh;

                    let binString = wallGenerator.genBinaryString(x, y, this.grid1, this.maze1);
                    let config = wallGenerator.getWallConfig(binString);
                    wallMesh = wallGenerator.createWall(
                        config,
                        Constants.WALL_SIZE,
                        wallHeight,
                        x + y
                    );
                    wallMesh.position.set(
                        x * Constants.WALL_SIZE,
                        0,
                        y * Constants.WALL_SIZE
                    );
                    mazeGroup.add(wallMesh);
                    this.physics.createWallRB(wallMesh, Constants.WALL_SIZE, wallHeight);
                    continue;
                }
            }
        }

        // add the door to the end of the maze
        const door = new Door("maze1exit");
        await door.loadModel("Door");
        this.scene.add(door.model);
        door.model.position.x = Constants.WALL_SIZE * (2 * this.maze1.height);
        door.model.position.z = Constants.WALL_SIZE * (2 * (this.maze1.width - 0.5));
        door.model.position.y -= wallHeight / 2;
        mazeGroup.add(door.model);

        mazeGroup.name = "maze1";
        this.currentSceneName = mazeGroup.name;

        this.currentScene = mazeGroup;
        this.currentScene = mazeGroup;

        // this.scene.add(this.currentScene);
    }

    onInteractCB() {
        const interactingObject = player.playerController.intersect;
        if (interactingObject) {
            switch (interactingObject.name) {
                case "maze1exit":
                    if (player.hasKey) {
                        this.loadScene("saferoom1");
                        mMap.hideMap();
                    }
                    break;
                case "maze2entrance":
                    var winScreen = document.getElementById("win-screen");
                    winScreen.classList.remove("hidden");
                    state.isPlaying = false;
                    state.gameover = true;
                    this.controls.unlock();
                    document.getElementById("restart-button-1").onclick = () => {
                        location.reload();
                    };
                    break;
            }
        }
    }


    addPlayer(player) {
        this.player = player;
        this.player.playerController.onInteractCB = this.onInteractCB;
    }

    // updateSafeRoom() {
    //     if(this.currentSceneName == "saferoom1")

    // }
}

export default SceneLoader;