import * as THREE from "three";
import Skybox from "./Skybox"
import Maze from "./lib/MazeGenerator";
import PlayerController from "./PlayerController.js";
import Monster from "./Monster.js";
import MiniMap from "./MiniMapHandler";
import WallGenerator from "./WallGenerator.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js";
import Physics from "./lib/Physics.js";
import WorldManager from "./WorldManager.js";
import Constants from "./Constants.js";
import NoiseGenerator from "./lib/NoiseGenerator"
import state from "./State";
import Stats from "three/examples/jsm/libs/stats.module";
import SafeRoom from "./SafeRoom";

let playerController, scene, renderer, physicsWorld, mMap, maze, grid, worldManager, monster, stats, saferoom1;



let pathGraph = [];

let rigidBodies = [],
  tmpTrans;

const clock = new THREE.Clock();

class GameManager {
  async init() {
    let noiseGen = new NoiseGenerator();
    // noiseGen.generateNoiseMap();
    maze = new Maze(
      Constants.MAP_SIZE,
      Constants.MAP_SIZE,
      Constants.PROBABILITY_WALLS_REMOVED
    );
    maze.growingTree();
    grid = maze.getThickGrid();

    // initializing physics
    await Ammo();

    tmpTrans = new Ammo.btTransform();

    initGraphics();
    await initWorld();

    window.addEventListener("resize", onWindowResize, true);
    removeLoadingScreen();

    animate();
  }
}

function removeLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.classList.add("fade-out");

  // optional: remove loader from DOM via event listener
  loadingScreen.addEventListener("transitionend", () => {
    loadingScreen.remove();
  });
}

function initGraphics() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  //scene.fog = new THREE.Fog(0x101010, Constants.FOG_NEAR, Constants.FOG_FAR);

  renderer = new THREE.WebGLRenderer({ antialias: Constants.ANTIALIAS });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(
    innerWidth / Constants.BLOCKINESS,
    innerHeight / Constants.BLOCKINESS
  );
  renderer.domElement.style.width = innerWidth;
  renderer.domElement.style.height = innerHeight;
  renderer.shadowMap.enabled = true;


  document.body.appendChild(renderer.domElement);
}

function animate() {
  let deltaTime = clock.getDelta();

  requestAnimationFrame(animate);

  if (!state.isPlaying) return;

  playerController.update();
  if (monster.path != "") monster.update(scene);


  worldManager.updateObjs();//this needs to be just update for both battery and key
  worldManager.pickUpBattery(playerController.camera.position.x, playerController.camera.position.z);
  worldManager.pickUpKey(playerController.camera.position.x, playerController.camera.position.z);
  worldManager.displayItems();
  worldManager.lifeBar(playerController.torch.visible);
  //console.log("asdasdasd", worldManager.torchLife)
  if (worldManager.torchLife <= 500) {
    playerController.torch.visible = false;
  }
  // worldManager.torchDisplay();
  // worldManager.keyDisplay();
  // worldManager.batteryDisplay();


  saferoom1.update(deltaTime);
  mMap.worldUpdate();
  render();
  stats.update();
}



async function initWorld() {
  const skybox = new Skybox("nightsky");
  scene.add(skybox.createSkybox());

  stats = new Stats(); // <-- remove me
  document.body.appendChild(stats.dom); // <-- remove me
  renderMaze(); // adds the maze in to the scene graph

  // set up the floor of the game
  const floorGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
  var groundTexture = new THREE.TextureLoader().load(
    "../assets/textures/snow_ground.jpg"
  );
  groundTexture.repeat.set(225, 225);
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: groundTexture,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotateX(-Math.PI / 2);
  floor.position.y = -20 / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // adds the ambient light into scene graph
  const light = new THREE.AmbientLight(0xffffff); // 0x080808
  light.intensity = 1; // change intensity for brightness, who would have thunk
  scene.add(light);

  // adding the saferoom into the game;
  saferoom1 = new SafeRoom();

  await saferoom1.loadModel("SafeRoom1");
  // saferoom1.model.position.x = (Constants.MAP_SIZE + 1.75) * Constants.WALL_SIZE * 2;
  // saferoom1.model.position.z = (Constants.MAP_SIZE + 0.75) * Constants.WALL_SIZE * 2;
  scene.add(saferoom1.model);


  playerController = new PlayerController(-30, 10, 20, renderer.domElement);
  scene.add(playerController.controls.getObject());

  let wallWidth = 20;
  let monsterPosition = {
    x: (2 * Constants.MAP_SIZE - 1) * Constants.WALL_SIZE,
    y: 0,
    z: (2 * Constants.MAP_SIZE - 1) * Constants.WALL_SIZE,
  };
  monster = new Monster(
    monsterPosition,
    Constants.MONSTER_SPEED_INVERSE,
    scene
  );
  monster.getAstarPath(grid, {
    x: 1 * Constants.WALL_SIZE,
    y: 0,
    z: 1 * Constants.WALL_SIZE,
  });

  mMap = new MiniMap(playerController, grid);
}

function renderMaze() {
  // grid[maze.getThickIndex(0, 1)] = false;
  // grid[maze.getThickIndex(2 * maze.width - 1, 2 * maze.height)] = false;

  grid[1][0] = false;
  grid[2 * maze.width - 1][2 * maze.height] = false;
  const wallHeight = 30;
  const wallWidth = 20;


  worldManager = new WorldManager(scene, grid);

  worldManager.setKey();
  worldManager.setBatteries();
  const wallGenerator = new WallGenerator(wallWidth, wallHeight);

  // const wallHeight = 0.2 * Constants.WALL_SIZE;
  // const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  // var geometryArr = [];
  // var wallRes = 5;

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
          wallWidth,
          wallHeight,
          x + y
        );
        wallMesh.position.set(x * wallWidth, 0, y * wallWidth);
        mazeGroup.add(wallMesh);
        continue;
        // check if its the

        //        scene.add(wallMesh)
        // const m = new THREE.Matrix4();
        //m.set(1, 0, 0, x * Constants.WALL_SIZE, 0, 1, 0, wallHeight / 2, 0, 0, 1, y * Constants.WALL_SIZE, 0, 0, 0, 1);

        // geometryArr.push(wallGeometry.applyMatrix4(m));
      }
    }
  }
  //mazeGroup.position.y -= wallHeight / 4;
  scene.add(mazeGroup);
}

// var mazeGeo = BufferGeometryUtils.mergeBufferGeometries(geometryArr);
// mazeGeo.computeVertexNormals();
// var mazeMesh = new THREE.Mesh(mazeGeo, wallMaterial);
// mazeMesh.castShadow = true;
// mazeMesh.receiveShadow = true;
// scene.add(mazeMesh);

function onWindowResize() {
  playerController.camera.aspect = window.innerWidth / window.innerHeight;
  playerController.camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth / Constants.BLOCKINESS,
    innerHeight / Constants.BLOCKINESS
  );
  renderer.domElement.style.width = innerWidth;
  renderer.domElement.style.height = innerHeight;
  mMap.updateFullScreenSizes();
}

function render() {
  renderer.render(scene, playerController.camera);
}

export default GameManager;
