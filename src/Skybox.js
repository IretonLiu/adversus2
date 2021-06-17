import {
  BoxGeometry,
  Mesh,
  TextureLoader,
  MeshBasicMaterial,
  BackSide,
  RepeatWrapping,
} from "three";

class Skybox {
  constructor(filename, mapLength) {
    this.filename = filename;
    this.mesh = this.createSkybox(mapLength);

  }

  createPathStrings() {
    const basePath = "assets/textures/skybox/";
    const baseFilename = basePath + this.filename;
    const fileType = ".png";
    const sides = ["", "", "", "", "", ""]; //["ft", "bk", "up", "dn", "rt", "lf"];
    const pathStings = sides.map((side) => {
      return baseFilename + side + fileType;
    });
    return pathStings;
  }
  createMaterialArray() {
    const skyboxImagepaths = this.createPathStrings();
    const materialArray = skyboxImagepaths.map((image) => {
      let texture = new TextureLoader().load(image);
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(4, 4);
      return new MeshBasicMaterial({
        map: texture,
        side: BackSide,
        fog: false,
      });
    });
    return materialArray;
  }
  createSkybox(mapLength) {
    const size = mapLength;
    const material = this.createMaterialArray();
    const geo = new BoxGeometry(size, size, size);
    const skybox = new Mesh(geo, material);
    return skybox;
  }

  update(deltaTime) {
    this.mesh.rotateX(deltaTime / 100);
  }
}

export default Skybox;
