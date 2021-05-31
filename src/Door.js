import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import SceneLoader from "./SceneLoader";

class Door {
    constructor(doorName) {
        this.name = doorName;
        this.model = null;
    }

    loadModel(filename) {
        const loader = new GLTFLoader();
        const path = "./assets/models/saferoom/"
        const extension = ".glb"
        return new Promise((resolve, reject) => {
            //loader.load(url, data => resolve(data), null, reject);
            loader.load(path + filename + extension, (gltf) => {
                this.model = gltf.scene;
                this.model.traverse(function (child) {
                    if (child.isMesh) {
                        child.material.metalness = 0;
                    }
                });
                this.model.name = this.name;
                this.model.scale.x = 6;
                this.model.scale.y = 6;
                this.model.scale.z = 6;
                console.log(this.model);
                resolve("success");
            }, (xhr) => {
                console.log("loading door: " + (xhr.loaded / xhr.total * 100) + '% loaded');
            }, reject)
        });
    }

    openDoor(sceneLoader) {
        sceneLoader.loadScene("saferoom1");
    }
}

export default Door;