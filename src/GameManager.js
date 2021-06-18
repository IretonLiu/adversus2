import * as THREE from "three";
import Skybox from "./Skybox";
import PlayerController from "./PlayerController.js";
import Physics from "./lib/Physics.js";
import Constants from "./Constants.js";
import state from "./State";
import Stats from "three/examples/jsm/libs/stats.module";
import MonsterManager from "./MonsterManager";
import Player from "./Player";
import SceneLoader from "./SceneLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import SnowManager from "./SnowManager";

let player,
  scene,
  renderer,
  ambientLight,
  physics,
  mMap,
  monsterManager,
  snowManager,
  stats,
  skybox,
  worldManager,
  sceneLoader;

let composer, outlinePass;

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
    removeLoadingScreen();

    setUpPostProcessing(sceneLoader.currentWorldManager);
    //render();
    animate();
  }
}

// set up all the post processing needed
function setUpPostProcessing(worldManager) {
  // initialization of post processing
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, player.playerController.camera);

  composer.addPass(renderPass);

  // setting up outlines and its parameters
  outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    player.playerController.camera
  );
  outlinePass.hiddenEdgeColor.set("#000000");
  outlinePass.visibleEdgeColor.set("#888888");
  outlinePass.edgeStrength = Number(10);
  outlinePass.pulsePeriod = Number(2);
  outlinePass.edgeThickness = 0.5;
  outlinePass.edgeGlow = 0;

  composer.addPass(outlinePass);

  // setting up the objects to be outlined
  setupOutlineObjects(worldManager);
}

function setupOutlineObjects(worldManager) {
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
  loadingScreen.addEventListener("transitionend", () => {
    loadingScreen.style.visibility = "hidden";
    loadingScreen.classList.remove("fade-out");
  });
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
    skybox.update(deltaTime);

    player.playerController.update(deltaTime, sceneLoader.currentScene);
    physics.updatePhysics(deltaTime);

    // TODO: potentially refactor the player update logic
    player.playerController.updatePosition();
    player.update(
      deltaTime,
      player.playerController.camera.position,
      monsterManager,
      () => {
        monsterManager.updateMonsterPath();
      }
    );

    worldManager.update(player, monsterManager);

    snowManager.updateSnow(deltaTime);

    if (
      sceneLoader.currentScene.name != "saferoom1" &&
      sceneLoader.currentScene.name != "saferoom2"
    )
      mMap.worldUpdate();

    monsterManager.update();
    monsterManager.updatePercentageExplored(mMap.getPercentageExplored());

    devMap.update();
    devMap.drawBatterys(worldManager.batteries);
    devMap.drawKey(worldManager.gateKey);

    document.getElementById("timer").innerHTML = new Date(
      clock.getElapsedTime() * 1000
    )
      .toISOString()
      .substr(11, 8);

    render();
    stats.update();
    sceneLoader.soundManagerGlobal.walking();
  }
  requestAnimationFrame(animate);
}

// initialises the game world
async function initWorld() {
  skybox = new Skybox("nightsky", 8000);
  //TODO: Make this dynamic based on map size
  scene.add(skybox.mesh);

  stats = new Stats(); // <-- remove me
  document.body.appendChild(stats.dom); // <-- remove me
  setUpGround();

  sceneLoader = new SceneLoader(physics, scene, loadingScreen);

  // TODO: there is quite a bit of circular dependency here
  var playerPos = new THREE.Vector3(
    Constants.PLAYER_INITIAL_POS.x,
    Constants.PLAYER_INITIAL_POS.y,
    Constants.PLAYER_INITIAL_POS.z
  );
  var playerController = new PlayerController(
    renderer.domElement,
    onInteractCB
  );
  physics.createPlayerRB(playerController.playerObject);
  await playerController.initCandle();

  player = new Player(playerPos, playerController);
  monsterManager = new MonsterManager(
    sceneLoader.currentScene,
    player,
    sceneLoader.grid1,
    clock
  );

  sceneLoader.addActors(player, monsterManager);
  sceneLoader.initSound();

  await sceneLoader.loadScene("maze1", false);
  worldManager = sceneLoader.getWorldManager();

  mMap = sceneLoader.getMiniMap();
  scene.add(playerController.controls.getObject());
  scene.add(playerController.playerObject);
  scene.add(sceneLoader.currentScene);

  setUpAmbientLight();

  sceneLoader.createDevMap();
  devMap = sceneLoader.getDevMap();

  //makeSnow(scene);

  snowManager = new SnowManager(scene, player);
  //makeSnow(sceneLoader.currentScene);
}

function setUpGround() {
  // set up the floor of the game
  const floorGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
  var groundTexture = new THREE.TextureLoader().load(
    "assets/textures/snow_ground.jpg"
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
  ambientLight = new THREE.AmbientLight(0xffffff);
  ambientLight.intensity = Constants.AMBIENT_INTENSITY;
  scene.add(ambientLight);
}

// callback to the player when interacting with and interactable object
async function onInteractCB() {
  const interactingObject = player.playerController.intersect;

  const loadMaze = async (mazeName) => {
    await sceneLoader.loadScene(mazeName, true);
    devMap = sceneLoader.getDevMap();
    mMap = sceneLoader.getMiniMap();
    mMap.showMap();
    worldManager = sceneLoader.getWorldManager();
    setupOutlineObjects(worldManager);
    snowManager.showSnow();
  };

  const noKeyWarning = (isFinal) => {
    const noKeyText = document.getElementById("no-key-warning");
    if (!noKeyText.classList.contains("fade-out")) {
      if (isFinal) {
        noKeyText.innerHTML = "You need all three keys to escape the maze...";
      } else {
        noKeyText.innerHTML = "You need a key to unlock this door...";
      }
      noKeyText.style.visibility = "visible";
      noKeyText.classList.add("fade-out");
      noKeyText.addEventListener("transitionend", () => {
        noKeyText.classList.remove("fade-out");
        noKeyText.style.visibility = "hidden";
      });
    }
  };
  // checks the name of the object the player is interacting with
  if (interactingObject) {
    switch (interactingObject.name) {
      case "maze1entrance":
        if (player.hasKey(0) && player.hasKey(1) && player.hasKey(2)) {
          var winScreen = document.getElementById("win-screen");
          winScreen.classList.remove("hidden");
          state.isPlaying = false;
          state.gameover = true;
          player.playerController.controls.unlock();
          document.getElementById("restart-button-1").onclick = () => {
            location.reload();
          };
        } else {
          noKeyWarning(true);
        }
        break;
      case "maze1exit":
        if (player.hasKey(0)) {
          mMap.hideMap();
          snowManager.hideSnow();
          await sceneLoader.loadScene("saferoom1", true);
        } else {
          noKeyWarning();
        }
        break;
      case "saferoom1entrance":
        await loadMaze("maze1");
        break;
      case "saferoom1exit":
        await loadMaze("maze2");
        ambientLight.color.setHex(0xff5555);
        ambientLight.color.intensity = 0.5;
        break;
      case "maze2entrance":
        mMap.hideMap();
        await sceneLoader.loadScene("saferoom1", true);
        snowManager.hideSnow();
        break;
      case "maze2exit":
        if (player.hasKey(1)) {
          mMap.hideMap();
          await sceneLoader.loadScene("saferoom2", true);
          snowManager.hideSnow();
        } else {
          noKeyWarning();
        }
        break;
      case "saferoom2entrance":
        await loadMaze("maze2");
        break;
      case "saferoom2exit":
        await loadMaze("maze3");
        ambientLight.color.setHex(0xff0000);
        break;
      case "maze3entrance":
        mMap.hideMap();
        await sceneLoader.loadScene("saferoom2", true);
        snowManager.hideSnow();
        break;
    }
  }
}

// resize the viewport when the window size changes
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
