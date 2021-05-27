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
  physicsWorld,
  mMap,
  maze,
  grid,
  monster,
  snowParticles,
  stats;
import state from "./State";
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
    initWorld();

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
  let deltaTime = clock.getDelta();

  requestAnimationFrame(animate);

  if (!state.isPlaying) return;

  playerController.update();
  if (monster.path != "") monster.update(scene);

  updateSnow(deltaTime);

  mMap.worldUpdate();
  render();
  stats.update();
}

function initWorld() {
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
  light.intensity = 0.02;
  scene.add(light);

  playerController = new PlayerController(-30, 3, 20, renderer.domElement);
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

  makeSnow(scene);
}

function renderMaze() {
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
        continue;
        // check if its the

        //        scene.add(wallMesh)
        // const m = new THREE.Matrix4();
        //m.set(1, 0, 0, x * Constants.WALL_SIZE, 0, 1, 0, wallHeight / 2, 0, 0, 1, y * Constants.WALL_SIZE, 0, 0, 0, 1);

        // geometryArr.push(wallGeometry.applyMatrix4(m));
      }
    }
  }
  mazeGroup.position.y -= wallHeight / 4;
  scene.add(mazeGroup);
}



function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
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
    vertices.push(randomIntFromInterval(min,max));
    vertices.push(randomIntFromInterval(50,-10));
    vertices.push(randomIntFromInterval(min,max));
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
    var y = i+1;
    var z = i+2;

    posArr[y] += -15*delta;
    if (posArr[y] < -30) {
      posArr[y] = randomIntFromInterval(-10,50);
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
