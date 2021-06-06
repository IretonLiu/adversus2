import Constants from "./Constants";
import Door from "./Door";
import * as THREE from "three";
import WallGenerator from "./WallGenerator";
import Maze from "./lib/MazeGenerator";
import SafeRoom from "./SafeRoom";
class SceneLoader {
    constructor(physics, scene, loadingScreen) {
        this.physics = physics;
        this.scene = scene;
        this.loadingScreen = loadingScreen;

        this.player = null;
        this.monster = null;
        // this.minimap = minimap;

        this.maze1 = null;
        this.grid1 = null;

        // this.room1 = null;
        this.currentScene = null;
        this.currentSceneName = "";

        this.saferoom1 = null;

        // this.player.playerController.onInteractCB = this.onInteractCB;
    }

    async loadScene(nextSceneName) {
        this.loadingScreen.classList.remove("fade-out");
        //this.loadingScreen.style.opacity = "1";
        this.player.playerController.reset();
        this.monster.despawnMonster();
        // clear the scene if one exists
        if (this.currentScene) this.clearScene();

        // initialize player rigidbody
        this.physics.createPlayerRB(this.player.playerController.playerObject);

        // load another scene based on the scene name
        if (nextSceneName == "maze1") {
            this.loadMaze1();
        } else if (nextSceneName == "saferoom1") {
            await this.loadRoom1();
        }
        this.player.playerController.scene = this.currentScene;
        this.scene.add(this.currentScene);
        this.loadingScreen.classList.add("fade-out");
    }

    clearScene() {
        // empty the geometry and the material used in the previous scene
        this.scene.traverse((child) => {
            if (child.userData.physicsBody)
                this.physics.physicsWorld.removeRigidBody(child.userData.physicsBody);
            if (child.isMesh) {

                if (child.geometry)
                    child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        for (let m of child.material) {
                            m.dispose()
                        }
                    } else {
                        child.material.dispose()
                    }
                }
                // this.scene.remove(child);
            }
        });
        this.scene.remove(this.currentScene)
        //console.log(this.scene);

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

        this.grid1 = this.maze1.getThickGrid();
        this.grid1[2 * this.maze1.width - 1][2 * this.maze1.height] = false;
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
        // this.scene.add(this.currentScene);
    }

    async loadRoom1() {
        this.saferoom1 = new SafeRoom("saferoom1");
        await this.saferoom1.loadModel("SafeRoom1")
        this.currentScene = this.saferoom1.model;
        this.currentSceneName = "saferoom1";
    }

    addActors(player, monster) {
        this.player = player;
        this.monster = monster
    }

    updateCurrentScene(time) {
        if (this.currentSceneName == "saferoom1")
            this.saferoom1.update(time);
    }


}

export default SceneLoader;