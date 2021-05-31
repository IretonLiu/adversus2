import * as THREE from "three";
import Skybox from "./Skybox";
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
import NoiseGenerator from "./lib/NoiseGenerator";
import state from "./State";
import Stats from "three/examples/jsm/libs/stats.module";
import SoundManagerGlobal from "./SoundManagerGlobal.js";
import SoundManager from "./SoundManager";
import MonsterManager from "./MonsterManager";
import DevMap from "./DevMap";
import Player from "./Player";
import Utils from "./Utils";
import SafeRoom from "./SafeRoom";
import Door from "./Door";
import SceneLoader from "./SceneLoader";

let player,
  scene,
  renderer,
  physics,
  mMap,
  monsterManager,
  snowParticles,
  stats,
  saferoom1,
  soundmanagerGlobal,
  soundmanager,
  worldManager,
  door,
  sceneLoader;

let maze1, grid1, maze2, grid2, maze3, grid3;

let devMap;

const clock = new THREE.Clock();

class GameManager {
  async init() {
    // initializing physics
    await Ammo();
    physics = new Physics();
    physics.initPhysics();

    initGraphics();
    await initWorld();
    window.addEventListener("resize", onWindowResize, true);
    document.addEventListener("keydown", (event) => {
      if (event.code != "KeyP") return;
      var devCanvas = document.getElementById("devcanvas");
      if (devCanvas.style.display === "none") {
        devCanvas.style.display = "block";
      } else {
        devCanvas.style.display = "none";
      }
    });
    removeLoadingScreen();
    soundmanager = null;
    render();
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
  scene.fog = new THREE.Fog(0x101010, Constants.FOG_NEAR, Constants.FOG_FAR);

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
  if (state.isPlaying) {
    let deltaTime = clock.getDelta();
    player.playerController.update(deltaTime);
    physics.updatePhysics(deltaTime);

    player.playerController.updatePosition();
    player.updatePosition(player.playerController.camera.position, () => {
      monsterManager.updateMonsterPath();
    });

    monsterManager.update();
    if (monsterManager.monster != null) {
      if (soundmanager == null) {
        soundmanager = new SoundManager(
          monsterManager.monster.Mesh,
          player.playerController,
          "./assets/sounds/monster.mp3"
        );
      } else {
        soundmanager.bind(monsterManager.monster.Mesh);
      }
    } else if (!monsterManager.monster) {
      soundmanager = null;
    }

    worldManager.updateObjs(); //this needs to be just update for both battery and key
    worldManager.pickUpBattery(
      player.playerController.camera.position.x,
      player.playerController.camera.position.z
    );
    worldManager.pickUpKey(
      player.playerController.camera.position.x,
      player.playerController.camera.position.z
    );
    worldManager.displayItems();
    worldManager.lifeBar(player.playerController.torch.visible);
    worldManager.refillTorch();
    //console.log("asdasdasd", worldManager.torchLife)
    if (worldManager.torchLife <= 500) {
      player.playerController.torch.visible = false;
    }
    // worldManager.torchDisplay();
    // worldManager.keyDisplay();
    // worldManager.batteryDisplay();

    updateSnow(deltaTime);
    saferoom1.update(deltaTime);
    mMap.worldUpdate();
    monsterManager.updatePercentageExplored(mMap.getPercentageExplored());
    devMap.update();

    render();
    stats.update();
  }
  soundmanagerGlobal.walking();
  requestAnimationFrame(animate);
}

async function initWorld() {
  const skybox = new Skybox("nightsky");
  scene.add(skybox.createSkybox());

  stats = new Stats(); // <-- remove me
  document.body.appendChild(stats.dom); // <-- remove me
  setUpGround();

  maze1 = new Maze(
    Constants.MAP1_SIZE,
    Constants.MAP1_SIZE,
    Constants.PROBABILITY_WALLS_REMOVED
  );
  maze1.growingTree();
  grid1 = maze1.getThickGrid();

  let maze1Group = await renderMaze(maze1, grid1);

  scene.add(maze1Group); // adds the maze in to the scene graph

  // adding the saferoom into the game;
  saferoom1 = new SafeRoom();
  await saferoom1.loadModel("SafeRoomWDoors");

  var playerPos = new THREE.Vector3(
    Constants.PLAYER_INITIAL_POS.x,
    Constants.PLAYER_INITIAL_POS.y,
    Constants.PLAYER_INITIAL_POS.z
  );
  setUpAmbientLight();

  var playerController = new PlayerController(
    renderer.domElement,
    maze1Group,
    onInteractCB
  );
  await playerController.initCandle();
  scene.add(playerController.controls.getObject());
  scene.add(playerController.playerObject);

  soundmanagerGlobal = new SoundManagerGlobal(
    playerController,
    "assets/Sounds/ambience.mp3",
    "assets/Sounds/footsteps.mp3"
  );

  physics.createPlayerRB(playerController.playerObject, 2, 2, 2);

  player = new Player(playerPos, playerController);

  monsterManager = new MonsterManager(scene, player, grid1, clock);

  devMap = new DevMap(grid1, player, monsterManager);
  sceneLoader = new SceneLoader(
    physics,
    scene,
    maze1Group,
    saferoom1.model,
    playerController
  );
  mMap = new MiniMap(playerController, grid1);

  worldManager = new WorldManager(scene, grid1, player);
  await worldManager.setKey();
  await worldManager.setBatteries();
  makeSnow(scene);
}

function setUpGround() {
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
}

function setUpAmbientLight() {
  // adds the ambient light into scene graph
  const light = new THREE.AmbientLight(0xffffff);
  light.intensity = Constants.AMBIENT_INTENSITY;
  scene.add(light);
}

async function renderMaze(maze, grid) {
  // grid[maze.getThickIndex(0, 1)] = false;
  // grid[maze.getThickIndex(2 * maze.width - 1, 2 * maze.height)] = false;

  // grid[1][0] = false;
  grid[2 * maze.width - 1][2 * maze.height] = false;
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
        physics.createWallRB(wallMesh, Constants.WALL_SIZE, wallHeight);
        continue;
      }
    }
  }

  // add the door to the end of the maze
  door = new Door("entrance");
  await door.loadModel("Door");
  scene.add(door.model);
  door.model.position.x = Constants.WALL_SIZE * (2 * maze.height);
  door.model.position.z = Constants.WALL_SIZE * (2 * (maze.width - 0.5));
  door.model.position.y -= wallHeight / 2;

  mazeGroup.add(door.model);
  mazeGroup.name = "maze";
  return mazeGroup;
}

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function makeSnow(scene) {
  const particleNum = 10000;
  const max = 100;
  const min = -100;
  const textureSize = 64.0;

  const drawRadialGradation = (ctx, canvasRadius, canvasW, canvasH) => {
    ctx.save();
    const gradient = ctx.createRadialGradient(
      canvasRadius,
      canvasRadius,
      0,
      canvasRadius,
      canvasRadius,
      canvasRadius
    );
    gradient.addColorStop(0, "rgba(255,255,255,1.0)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  };

  const getTexture = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const diameter = textureSize;
    canvas.width = diameter;
    canvas.height = diameter;
    const canvasRadius = diameter / 2;

    /* gradation circle
    ------------------------ */
    drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);

    /* snow crystal
    ------------------------ */
    // drawSnowCrystal(ctx, canvasRadius);

    const texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.type = THREE.FloatType;
    texture.needsUpdate = true;
    return texture;
  };
  const pointGeometry = new THREE.BufferGeometry();
  var vertices = [];
  var sizes = [];
  for (let i = 0; i < particleNum; i++) {
    vertices.push(randomIntFromInterval(min, max));
    vertices.push(randomIntFromInterval(50, -10));
    vertices.push(randomIntFromInterval(min, max));
    sizes.push(8);
  }
  pointGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  pointGeometry.setAttribute(
    "size",
    new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage)
  );

  const pointMaterial = new THREE.PointsMaterial({
    // size: 8,
    color: 0xffffff,
    opacity: 0.3,
    vertexColors: false,
    map: getTexture(),
    transparent: true,
    // opacity: 0.8,
    // blending: THREE.AdditiveBlending,
    fog: false,
    depthTest: true,
  });

  const velocities = [];
  for (let i = 0; i < particleNum; i++) {
    const x = Math.floor(Math.random() * 6 - 3) * 0.5;
    const y = Math.floor(Math.random() * 10 + 3) * -0.1;
    const z = Math.floor(Math.random() * 6 - 3) * 0.5;
    const particle = new THREE.Vector3(x, y, z);
    velocities.push(particle);
  }

  let m = new THREE.Matrix4();
  m.makeRotationX(THREE.MathUtils.degToRad(90));
  m.scale(new THREE.Vector3(300, 300, 300));

  snowParticles = new THREE.Points(pointGeometry, pointMaterial);
  snowParticles.geometry.applyMatrix4(m);
  // snowParticles.geometry.velocities = velocities;
  scene.add(snowParticles);
}

function updateSnow(delta) {
  var playerX = player.position.x;
  var playerZ = player.position.z;
  const posArr = snowParticles.geometry.getAttribute("position").array;

  var offset = 100;

  for (let i = 0; i < posArr.length; i += 3) {
    var x = i;
    var y = i + 1;
    var z = i + 2;

    posArr[y] += -15 * delta;
    if (posArr[y] < 0) {
      posArr[y] = randomIntFromInterval(-10, 50);
      posArr[x] = randomIntFromInterval(playerX - offset, playerX + offset);
      posArr[z] = randomIntFromInterval(playerZ - offset, playerZ + offset);
    }
  }

  snowParticles.geometry.attributes.position.needsUpdate = true;
}

function onInteractCB() {
  const interactingObject = player.playerController.intersect;
  console.log(player.hasKey)
  if (interactingObject) {
    switch (interactingObject.name) {
      case "entrance":
        console.log(player.hasKey)
        if (player.hasKey) {
          console.log(player.hasKey)
          door.openDoor(sceneLoader);
        }
    }
  }
}

function onWindowResize() {
  player.playerController.camera.aspect =
    window.innerWidth / window.innerHeight;
  player.playerController.camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth / Constants.BLOCKINESS,
    innerHeight / Constants.BLOCKINESS
  );
  renderer.domElement.style.width = innerWidth;
  renderer.domElement.style.height = innerHeight;
  mMap.updateFullScreenSizes();
}

function render() {
  renderer.render(scene, player.playerController.camera);
}

export default GameManager;
