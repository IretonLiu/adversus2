import * as THREE from "three";
import Skybox from "./Skybox";
import Maze from "./lib/MazeGenerator";
import PlayerController from "./PlayerController.js";
import Monster from "./Monster.js";
import MiniMap from "./MiniMapHandler";
import WallGenerator from "./WallGenerator.js";
import Physics from "./lib/Physics.js";
import NoiseGenerator from "./lib/NoiseGenerator";
import Constants from "./Constants";
import Stats from "three/examples/jsm/libs/stats.module";

let playerController,
  scene,
  renderer,
  physics,
  mMap,
  monster,
  snowParticles,
  stats,
  ball,
  saferoom1;

let maze1, grid1, maze2, grid2, maze3, grid3;

import state from "./State";
import SafeRoom from "./SafeRoom";
let pathGraph = [];

let rigidBodies = [],
  tmpTrans;

const clock = new THREE.Clock();

class GameManager {
  async init() {
    let noiseGen = new NoiseGenerator();
    // noiseGen.generateNoiseMap();

    // initializing physics
    await Ammo();
    physics = new Physics();
    physics.initPhysics();


    initGraphics();
    await initWorld();
    physicsTest();

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
  if (state.isPlaying) {
    let deltaTime = clock.getDelta();
    playerController.update();
    physics.updatePhysics(deltaTime);
    //moveBall();
    playerController.updatePosition();

    if (monster.path != "") monster.update(scene);

    updateSnow(deltaTime);

    saferoom1.update(deltaTime);
    mMap.worldUpdate();
    render();
    stats.update();
    requestAnimationFrame(animate);

  }

}

async function initWorld() {
  const skybox = new Skybox("nightsky");
  scene.add(skybox.createSkybox());

  stats = new Stats(); // <-- remove me
  document.body.appendChild(stats.dom); // <-- remove me

  // setUpGround();

  setUpAmbientLight();
  maze1 = new Maze(
    Constants.MAP1_SIZE,
    Constants.MAP1_SIZE,
    Constants.PROBABILITY_WALLS_REMOVED
  );
  maze1.growingTree();
  grid1 = maze1.getThickGrid();
  scene.add(renderMaze(maze1, grid1)); // adds the maze in to the scene graph

  // maze2 = new Maze(
  //   Constants.MAP2_SIZE,
  //   Constants.MAP2_SIZE,
  //   Constants.PROBABILITY_WALLS_REMOVED
  // );
  // maze2.growingTree();
  // grid2 = maze2.getThickGrid();
  // const maze2Group = renderMaze(maze2, grid2);
  // maze2Group.position.x = ((2 * Constants.MAP1_SIZE + 7) * Constants.WALL_SIZE);
  // maze2Group.position.z = ((2 * Constants.MAP1_SIZE + 4) * Constants.WALL_SIZE);
  // scene.add(maze2Group);

  // adds the ambient light into scene graph
  // const light = new THREE.AmbientLight(0xffffff); // 0x080808
  // light.intensity = 1.02; // change intensity for brightness, who would have thunk
  // scene.add(light);

  // adding the saferoom into the game;
  saferoom1 = new SafeRoom();

  await saferoom1.loadModel("SafeRoom1");
  saferoom1.model.position.x =
    (2 * Constants.MAP1_SIZE + 3.5) * Constants.WALL_SIZE;
  saferoom1.model.position.z =
    (2 * Constants.MAP1_SIZE + 1.5) * Constants.WALL_SIZE;
  scene.add(saferoom1.model);


  playerController = new PlayerController(20, 10, 20, renderer.domElement);
  scene.add(playerController.controls.getObject());
  physics.createPlayerRB(playerController.playerObject, 2, 2, 2);
  setUpMonster();

  mMap = new MiniMap(playerController, grid1);
}

function physicsTest() {
  // makePlane();
  //ball = makeBall();
  //scene.add(ball);
}

function moveBall() {
  let scalingFactor = 20;

  let moveX = 1;
  let moveZ = 0;
  let moveY = 0;

  if (moveX == 0 && moveY == 0 && moveZ == 0) return;

  let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ)
  resultantImpulse.op_mul(scalingFactor);

  let physicsBody = ball.userData.physicsBody;
  physicsBody.setLinearVelocity(resultantImpulse);
  // console.log(ball.userData);
}

function makeBall() {
  let pos = { x: 20, y: 0, z: 20 };
  let radius = 2;
  let quat = { x: 0, y: 0, z: 0, w: 1 };
  let mass = 1;
  return (physics.genBallRB(pos, radius, quat, mass));
}

function makePlane() {
  let pos = { x: 0, y: 0, z: 0 };
  let scale = { x: 50, y: 2, z: 50 };
  let quat = { x: 0, y: 0, z: 0.05, w: 1 };
  let mass = 0;
  physics.genBoxRB(pos, scale, quat, mass, scene);
}

function setUpMonster() {
  let monsterPosition = {
    x: (2 * Constants.MAP1_SIZE - 1) * Constants.WALL_SIZE,
    y: 0,
    z: (2 * Constants.MAP1_SIZE - 1) * Constants.WALL_SIZE,
  };
  monster = new Monster(
    monsterPosition,
    Constants.MONSTER_SPEED_INVERSE,
    scene
  );
  monster.getAstarPath(grid1, {
    x: 1 * Constants.WALL_SIZE,
    y: 0,
    z: 1 * Constants.WALL_SIZE,
  });
}

mMap = new MiniMap(playerController, grid1);

makeSnow(scene);
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

function renderMaze(maze, grid) {
  // grid[maze.getThickIndex(0, 1)] = false;
  // grid[maze.getThickIndex(2 * maze.width - 1, 2 * maze.height)] = false;

  grid[1][0] = false;
  grid[2 * maze.width - 1][2 * maze.height] = false;
  const wallHeight = 30;
  const wallWidth = 20;

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
        physics.createWallRB(wallMesh, wallWidth, wallHeight);
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

  return mazeGroup;
}

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function makeSnow(scene) {
  const particleNum = 100000;
  const max = 1000;
  const min = -500;
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
    //texture.minFilter = THREE.NearestFilter;
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
    vertexColors: false,
    map: getTexture(),
    blending: THREE.AdditiveBlending,
    transparent: true,
    // opacity: 0.8,
    fog: true,
    depthWrite: false,
  });

  const velocities = [];
  for (let i = 0; i < particleNum; i++) {
    const x = Math.floor(Math.random() * 6 - 3) * 0.5;
    const y = Math.floor(Math.random() * 10 + 3) * -0.1;
    const z = Math.floor(Math.random() * 6 - 3) * 0.5;
    const particle = new THREE.Vector3(x, y, z);
    velocities.push(particle);
  }

  snowParticles = new THREE.Points(pointGeometry, pointMaterial);
  // snowParticles.geometry.velocities = velocities;
  scene.add(snowParticles);
}

function updateSnow(delta) {
  // snowParticles.position.set(playerController.camera.position.x,playerController.camera.position.y,playerController.camera.position.z);

  const posArr = snowParticles.geometry.getAttribute("position").array;

  for (let i = 0; i < posArr.length; i += 3) {
    var x = i;
    var y = i + 1;
    var z = i + 2;

    posArr[y] += -15 * delta;
    if (posArr[y] < -30) {
      posArr[y] = randomIntFromInterval(-10, 50);
    }

    //  posArr[z] += Math.floor(Math.random() * 6 - 3) * 0.01;
  }

  snowParticles.geometry.attributes.position.needsUpdate = true;
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
