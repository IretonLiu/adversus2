import Constants from "./Constants";
import Door from "./Door";
import * as THREE from "three";
import WallGenerator from "./WallGenerator";
import Maze from "./lib/MazeGenerator";
import SafeRoom from "./SafeRoom";
import MiniMap from "./MiniMapHandler";
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

        this.maze2 = null;
        this.grid2 = null;

        this.currentMaze = null;
        // this.currentGrid = null;
        // this.room1 = null;
        this.currentScene = null;
        this.currentSceneName = null;

        this.saferoom1 = null;

        // this.player.playerController.onInteractCB = this.onInteractCB;
    }

    async loadScene(nextSceneName) {
        this.loadingScreen.classList.remove("fade-out");
        //this.loadingScreen.style.opacity = "1";

        // clear the scene if one exists
        if (this.currentScene)
            this.clearScene();
        // reinitialize the player and monster if they exist


        // load another scene based on the scene name
        if (nextSceneName == "maze1") {
            if (!this.maze1) {
                this.initMaze1();
            }
            await this.loadMaze("maze1", this.maze1, this.grid1);
            this.currentGrid = this.grid1;
        } else if (nextSceneName == "maze2") {
            if (!this.maze2) {
                this.initMaze2();
            }
            await this.loadMaze("maze2", this.maze2, this.grid2);
            this.currentGrid = this.grid2;

        }
        else if (nextSceneName == "saferoom1") {
            await this.loadRoom1();
        }

        if (this.player) {
            this.player.playerController.reset();
            this.physics.createPlayerRB(this.player.playerController.playerObject);
            this.player.playerController.scene = this.currentScene;

        }
        if (this.monster)
            this.monster.despawnMonster();

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
        this.physics.physicsWorld.removeRigidBody(this.player.playerController.playerObject.userData.physicsBody)
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
        this.grid1[2 * this.maze1.width - 1][2 * this.maze1.height] = false;

    }

    initMaze2() {
        this.maze2 = new Maze(
            Constants.MAP2_SIZE,
            Constants.MAP2_SIZE,
            Constants.PROBABILITY_WALLS_REMOVED
        );
        this.maze2.growingTree();
        this.grid2 = this.maze2.getThickGrid();
        this.grid2[2 * this.maze2.width - 1][2 * this.maze2.height] = false;

    }

    // render and add the maze to the scene

    async loadMaze(name, maze, grid) {



        const wallHeight = 25;
        const wallWidth = 30;

        const wallGenerator = new WallGenerator(wallWidth, wallHeight);

        const mazeGroup = new THREE.Group();

        for (var y = 0; y < 2 * maze.height + 1; y++) {
            for (var x = 0; x < 2 * maze.width + 1; x++) {
                if (grid[y][x]) {
                    //var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
                    var wallMesh;

                    let binString = wallGenerator.genBinaryString(x, y, grid, maze);
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
        door.model.position.x = Constants.WALL_SIZE * (2 * maze.height);
        door.model.position.z = Constants.WALL_SIZE * (2 * (maze.width - 0.5));
        door.model.position.y -= wallHeight / 2;
        mazeGroup.add(door.model);

        mazeGroup.name = name;
        this.currentSceneName = name;

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

    loadNewMinimap() {
        return new MiniMap(this.player.playerController, this.currentGrid)
    }
}

export default SceneLoader;