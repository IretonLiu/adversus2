import * as THREE from "three";
import Maze from "./lib/MazeGenerator";
import PlayerController from "./PlayerController.js";
import minimap from "./minimap.js";
import WallGenerator from "./WallGenerator.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js";
import Physics from "./Physics.js";

let playerController, scene, renderer, physicsWorld, mMap, maze, grid;
const blockiness = 1;
const mapSize = 7;

let rigidBodies = [],
  tmpTrans;

const clock = new THREE.Clock();

class GameManager {
  async init() {
    maze = new Maze(mapSize, mapSize);
    maze.growingTree();
    grid = maze.getThickGrid();

    // initializing physics
    await Ammo();

    tmpTrans = new Ammo.btTransform();

    initGraphics();

    window.addEventListener("resize", onWindowResize, true);
    const light = new THREE.AmbientLight(0xbbbbbb); // 0x080808
    scene.add(light);

    renderMaze(scene);

    const floorGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotateX(-Math.PI / 2);
    floor.position.y = -20 / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallGenerator = new WallGenerator();
    const wallMesh = wallGenerator.createWall(7, 20, 20);
    wallMesh.position.set(-30, 0, 0);
    scene.add(wallMesh);

    const helper = new THREE.AxesHelper(5);
    scene.add(helper);
    animate();
  }
}

function initGraphics() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(innerWidth / blockiness, innerHeight / blockiness);
  renderer.domElement.style.width = innerWidth;
  renderer.domElement.style.height = innerHeight;
  renderer.shadowMap.enabled = true;

  document.body.appendChild(renderer.domElement);

  playerController = new PlayerController(-30, 0, 20, renderer.domElement);
  scene.add(playerController.controls.getObject());

  const spotLightHelper = new THREE.CameraHelper(
    playerController.torch.shadow.camera
  );
  scene.add(spotLightHelper);
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  mMap = new minimap(playerController);
}

function animate() {
  let deltaTime = clock.getDelta();
  requestAnimationFrame(animate);
  playerController.update();
  mMap.mapControls();
  mMap.placePos();
  mMap.drawMaze(maze, grid);
  render();
}

function renderMaze() {
  // grid[maze.getThickIndex(0, 1)] = false;
  // grid[maze.getThickIndex(2 * maze.width - 1, 2 * maze.height)] = false;
  grid[1][0] = false;
  grid[2 * maze.width - 1][2 * maze.height] = false;

  const wallGenerator = new WallGenerator();

  const wallSize = 20;
  const wallHeight = 0.2 * wallSize;
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  var geometryArr = [];
  var wallRes = 5;

  const mazeGroup = new THREE.Group();
  console.log(grid);
  for (var y = 0; y < 2 * maze.height + 1; y++) {
    for (var x = 0; x < 2 * maze.width + 1; x++) {
      if (grid[y][x]) {
        //var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        var wallMesh;

        let binString = wallGenerator.genBinaryString(x, y, grid, maze);
        let config = wallGenerator.getWallConfig(binString);
        wallMesh = wallGenerator.createWall(config, wallSize, wallSize);
        wallMesh.position.set(x * wallSize, 0, y * wallSize);
        mazeGroup.add(wallMesh);
        continue;
        // check if its the

        //        scene.add(wallMesh)
        // const m = new THREE.Matrix4();
        // m.set(
        //   1,
        //   0,
        //   0,
        //   x * wallSize,
        //   0,
        //   1,
        //   0,
        //   wallHeight / 2,
        //   0,
        //   0,
        //   1,
        //   y * wallSize,
        //   0,
        //   0,
        //   0,
        //   1
        // );

        // geometryArr.push(wallGeometry.applyMatrix4(m));
      }
    }
    scene.add(mazeGroup);
  }

  // var mazeGeo = BufferGeometryUtils.mergeBufferGeometries(geometryArr);
  // mazeGeo.computeVertexNormals();
  // var mazeMesh = new THREE.Mesh(mazeGeo, wallMaterial);
  // mazeMesh.castShadow = true;
  // mazeMesh.receiveShadow = true;
  // scene.add(mazeMesh);
}

function onWindowResize() {
  playerController.camera.aspect = window.innerWidth / window.innerHeight;
  playerController.camera.updateProjectionMatrix();

  renderer.setSize(innerWidth / blockiness, innerHeight / blockiness);
  renderer.domElement.style.width = innerWidth;
  renderer.domElement.style.height = innerHeight;
}

function render() {
  renderer.render(scene, playerController.camera);
}

export default GameManager;
