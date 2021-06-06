import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Constants from "./Constants";
import SceneLoader from "./SceneLoader";

class Door {
    constructor(doorName) {
        this.name = doorName;
        this.model = new Group();
    }

    // loads the door model
    loadModel(filename) {
        const loader = new GLTFLoader();
        const path = "./assets/models/saferoom/"
        const extension = ".glb"
        return new Promise((resolve, reject) => {
            //loader.load(url, data => resolve(data), null, reject);
            loader.load(path + filename + extension, (gltf) => {
                const scene = gltf.scene;
                scene.traverse(function (child) {
                    if (child.isMesh) {
                        child.material.metalness = 0;
                    }
                });
                this.model.add(scene);

                // this.model.name = this.name;
                this.model.scale.x = 6;
                this.model.scale.y = 6;
                this.model.scale.z = 6;

                // sets the bounding box for user interaction
                const exitBoundingBoxGeometry = new BoxGeometry(1, 3, 3);
                const exitBoundingBoxMaterial = new MeshStandardMaterial({ color: 0xffffff });
                exitBoundingBoxMaterial.visible = false;
                const exitBoundingBoxMesh = new Mesh(exitBoundingBoxGeometry, exitBoundingBoxMaterial);
                exitBoundingBoxMesh.position.y = 2.8;
                exitBoundingBoxMesh.name = this.name;

                this.model.add(exitBoundingBoxMesh);

                console.log(this.model);
                resolve("success");
            }, (xhr) => {
                console.log("loading door: " + (xhr.loaded / xhr.total * 100) + '% loaded');
            }, reject)
        });
    }


}

export default Door;