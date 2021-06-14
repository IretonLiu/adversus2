import * as THREE from "three";
import Skybox from "./Skybox";
import PlayerController from "./PlayerController.js";
import MiniMap from "./MiniMapHandler";
import Physics from "./lib/Physics.js";
import WorldManager from "./WorldManager.js";
import Constants from "./Constants.js";
import state from "./State";
import Stats from "three/examples/jsm/libs/stats.module";
import SoundManagerGlobal from "./SoundManagerGlobal.js";
import SoundManager from "./SoundManager";
import MonsterManager from "./MonsterManager";
import DevMap from "./DevMap";
import Player from "./Player";
import SceneLoader from "./SceneLoader";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'

let player,
  scene,
  renderer,
  physics,
  mMap,
  monsterManager,
  snowParticles,
  stats,
  soundmanagerGlobal,
  soundmanager,
  worldManager,
  sceneLoader,
  composer;


let devMap;

let loadingScreen;

const clock = new THREE.Clock();

class GameManager {
  async init() {


    // initializing physics
    await Ammo();
    physics = new Physics();
    physics.initPhysics();
    loadingScreen = document.getElementById("loading-screen");

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
    removeLoadingScreen(() => {

    });
    soundmanager = null;

    setUpPostProcessing();
    //render();
    animate();
  }
}

// set up all the post processing needed 
function setUpPostProcessing() {
  // initialization of post processing
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, player.playerController.camera);

  composer.addPass(renderPass);

  // setting up outlines and its parameters
  const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, player.playerController.camera);
  outlinePass.hiddenEdgeColor.set("#000000");
  outlinePass.visibleEdgeColor.set("#888888");
  outlinePass.edgeStrength = Number(10);
  outlinePass.pulsePeriod = Number(2);
  outlinePass.edgeThickness = 0.5;
  outlinePass.edgeGlow = 0;

  composer.addPass(outlinePass);

  // setting up the objects to be outlined
  const outlineObjects = [];
  for (let battery of worldManager.batteries) {
    outlineObjects.push(battery.mesh);
  }
  outlineObjects.push(worldManager.gateKey.mesh);
  outlinePass.selectedObjects = outlineObjects;
}

// TODO: polish the loading screen removal logic;
function removeLoadingScreen() {
  loadingScreen.classList.add("fade-out");

  //optional: remove loader from DOM via event listener
  // loadingScreen.addEventListener("transitionend", () => {
  //   loadingScreen.remove();
  // });
}

// initialises all the graphics of the game
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

// the main animation / game loop logic
function animate() {
  if (state.isPlaying) {
    let deltaTime = clock.getDelta();
    player.playerController.update(deltaTime);
    physics.updatePhysics(deltaTime);

    // TODO: potentially refactor the player update logic
    player.playerController.updatePosition();
    player.updatePosition(player.playerController.camera.position, () => {
      if (sceneLoader.currentScene.name == 'maze1')
        monsterManager.updateMonsterPath();
    });



    if (monsterManager.monster != null) {
      if (soundmanager == null) {
        soundmanager = new SoundManager(
          monsterManager.monster.Mesh,
          player.playerController,
          "assets/Sounds/monster.mp3"
        );
      } else {
        if (monsterManager.monster.Mesh != null) {
          soundmanager.bind(monsterManager.monster.Mesh);
        } else {
          soundmanager.pause();
        }
      }
    } else {
      if (soundmanager != null) {
        soundmanager.pause();
      }
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
    worldManager.lifeBar(player.playerController.torchOn);
    worldManager.refillTorch();
    if (worldManager.torchLife <= 0) {
      player.playerController.torchOn = false;
    }
    worldManager.keyDisplay();


    updateSnow(deltaTime);
    //saferoom1.update(deltaTime);
    mMap.worldUpdate();

    if (sceneLoader.currentScene.name == 'maze1') {
      monsterManager.update();
      monsterManager.updatePercentageExplored(mMap.getPercentageExplored());

    }
    devMap.update();
    devMap.drawBatterys(worldManager.batteries);
    devMap.drawKey(worldManager.gateKey);

    document.getElementById("timer").innerHTML = new Date(clock.getElapsedTime() * 1000).toISOString().substr(11, 8);

    render();
    stats.update();
    if (sceneLoader.currentScene.name == "saferoom1")
      console.log(monsterManager)
  }
  soundmanagerGlobal.walking();
  requestAnimationFrame(animate);

}

// initialises the game world
async function initWorld() {
  const skybox = new Skybox("nightsky");
  //TODO: Make this dynamic based on map size
  scene.add(skybox.createSkybox(8000));

  stats = new Stats(); // <-- remove me
  document.body.appendChild(stats.dom); // <-- remove me
  setUpGround();

  sceneLoader = new SceneLoader(
    physics,
    scene,
    loadingScreen,

  );
  //sceneLoader.initMaze1();
  await sceneLoader.loadScene("maze1", false);

  // TODO: there is quite a bit of circular dependency here
  var playerPos = new THREE.Vector3(
    Constants.PLAYER_INITIAL_POS.x,
    Constants.PLAYER_INITIAL_POS.y,
    Constants.PLAYER_INITIAL_POS.z
  );
  var playerController = new PlayerController(
    renderer.domElement,
    sceneLoader.currentScene,
    onInteractCB,
  );
  physics.createPlayerRB(playerController.playerObject);
  await playerController.initCandle();
  player = new Player(playerPos, playerController);
  monsterManager = new MonsterManager(sceneLoader.currentScene, player, sceneLoader.grid1, clock);
  sceneLoader.addActors(player, monsterManager);

  mMap = sceneLoader.loadNewMinimap();

  scene.add(playerController.controls.getObject());
  scene.add(playerController.playerObject);
  scene.add(sceneLoader.currentScene);


  setUpAmbientLight();

  soundmanagerGlobal = new SoundManagerGlobal(
    playerController,
    "assets/Sounds/ambience.mp3",
    "assets/Sounds/footsteps.mp3"
  );



  devMap = new DevMap(sceneLoader.grid1, player, monsterManager);

  worldManager = new WorldManager(scene, sceneLoader.grid1, player, clock);
  await worldManager.setKey();
  await worldManager.setBatteries();
  //makeSnow(scene);
  makeSnow(sceneLoader.currentScene);
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

async function onInteractCB() {
  const interactingObject = player.playerController.intersect;
  if (interactingObject) {
    switch (interactingObject.name) {
      case "maze1exit":
        if (player.hasKey) {
          mMap.hideMap();
          await sceneLoader.loadScene("saferoom1", true)
        }
        break;
      case "saferoom1exit":
        await sceneLoader.loadScene("maze2", true)

        // var winScreen = document.getElementById("win-screen");
        // winScreen.classList.remove("hidden");
        // state.isPlaying = false;
        // state.gameover = true;
        // player.playerController.controls.unlock();
        // document.getElementById("restart-button-1").onclick = () => {
        //   location.reload();
        // };
        break;
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
  composer.render();
  //renderer.render(scene, player.playerController.camera);
}

export default GameManager;
