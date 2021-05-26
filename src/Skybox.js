import {
    BoxGeometry,
    Mesh,
    TextureLoader,
    MeshBasicMaterial,
    BackSide,
    RepeatWrapping
} from "three";


class Skybox {
    constructor(filename) {
        this.filename = filename;
    }

    createPathStrings() {
        const basePath = "./assets/textures/skybox/";
        const baseFilename = basePath + this.filename;
        const fileType = ".png";
        const sides = ["", "", "", "", "", ""]//["ft", "bk", "up", "dn", "rt", "lf"];
        const pathStings = sides.map(side => {
            return baseFilename + side + fileType;
        });
        return pathStings;
    }
    createMaterialArray() {
        const skyboxImagepaths = this.createPathStrings();
        const materialArray = skyboxImagepaths.map(image => {
            let texture = new TextureLoader().load(image);
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            texture.repeat.set(4, 4);
            return new MeshBasicMaterial({ map: texture, side: BackSide });
        });
        return materialArray;
    }
    createSkybox() {
        const size = 10000;
        const material = this.createMaterialArray();
        const geo = new BoxGeometry(size, size, size);
        const skybox = new Mesh(geo, material);
        return skybox;

    }

}

export default Skybox;