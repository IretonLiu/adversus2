import * as THREE from "three";
import Maze from "./lib/MazeGenerator";
import PlayerController from "./PlayerController.js";
import minimap from "./minimap.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js";
import Physics from "./Physics.js";

let playerController, scene, renderer, physicsWorld, mMap, maze, grid;
const blockiness = 6;
let rigidBodies = [],
  tmpTrans;

const clock = new THREE.Clock();

class GameManager {
  async init() {
    maze = new Maze(5, 5);
    maze.growingTree();
    grid = maze.getThickGrid();

    // initializing physics
    await Ammo();

    tmpTrans = new Ammo.btTransform();

    initGraphics();

    playerController = new PlayerController(-30, 0, 20, renderer.domElement);
    mMap = new minimap(playerController);
    scene.add(playerController.controls.getObject());

    window.addEventListener("resize", onWindowResize, false);
    const light = new THREE.AmbientLight(0x050505);
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
  document.body.appendChild(renderer.domElement);

  playerController = new PlayerController(-30, 0, 20, renderer.domElement);
  scene.add(playerController.controls.getObject());
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

function renderMaze(scene) {
  grid[maze.getThickIndex(0, 1)] = false;
  grid[maze.getThickIndex(2 * maze.width - 1, 2 * maze.height)] = false;

  const wallSize = 20;
  const wallHeight = 0.2 * wallSize;
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  wallMaterial.flatShading = true;

  var geometryArr = [];
  var wallRes = 50;
  for (var y = 0; y < 2 * maze.height + 1; y++) {
    for (var x = 0; x < 2 * maze.width + 1; x++) {
      if (grid[maze.getThickIndex(x, y)]) {
        var wallGeometry = new THREE.BoxGeometry(
          wallSize,
          0.8 * wallSize,
          wallSize,
          wallRes,
          wallRes,
          wallRes
        );

        // var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        // wallMesh.position.set(x * wallSize, wallSize / 2, y * wallSize);
        // var helper = new VertexNormalsHelper(wallMesh, 2, 0x00ff00, 1);
        // scene.add(helper);
        // scene.add(wallMesh);

        const m = new THREE.Matrix4();
        m.set(
          1,
          0,
          0,
          x * wallSize,
          0,
          1,
          0,
          wallHeight / 2,
          0,
          0,
          1,
          y * wallSize,
          0,
          0,
          0,
          1
        );

        geometryArr.push(wallGeometry.applyMatrix4(m));
      }
    }
  }

  var mazeGeo = BufferGeometryUtils.mergeBufferGeometries(geometryArr);
  mazeGeo.computeVertexNormals();
  var mazeMesh = new THREE.Mesh(mazeGeo, wallMaterial);
  // mazeMesh.castShadow = true;
  // console.log(mazeMesh);
  mazeMesh.receiveShadow = true;
  scene.add(mazeMesh);
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
