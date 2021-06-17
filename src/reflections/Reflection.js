import * as THREE from "three";
import { Mesh } from "three";
import { Reflector } from "./Reflector.js";

class Reflection {
  constructor() {}

  createGroundMirror(position) {
    // create mirror border
    const circle = new THREE.CircleGeometry(12, 64);
    const circleMaterial = new THREE.MeshStandardMaterial({
      color: 0x080808,
    });

    // create mirror
    const geometry = new THREE.CircleGeometry(10, 64);
    const mirror = new Reflector(geometry, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0x777777,
    });

    // preventt z-fighting
    mirror.translateZ(1);

    // create combined object
    const obj = new Mesh(circle, circleMaterial);
    obj.add(mirror);

    // position combined object
    obj.translateX(position.x);
    obj.translateY(position.y);
    obj.translateZ(position.z);

    obj.scale.set(0.5, 0.5, 1);

    return obj;
  }
}

export default Reflection;
