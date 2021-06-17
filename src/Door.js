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
    loadModel(filename, boundingBoxSize) {
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
                scene.scale.x = 6;
                scene.scale.y = 6;
                scene.scale.z = 6;
                this.model.add(scene);

                // this.model.name = this.name;


                // sets the bounding box for user interaction
                const doorBoundingBoxGeometry = new BoxGeometry(boundingBoxSize.x, boundingBoxSize.y, boundingBoxSize.z);
                const doorBoundingBoxMaterial = new MeshStandardMaterial({ color: 0xffffff });
                doorBoundingBoxMaterial.visible = false;
                const doorBoundingBoxMesh = new Mesh(doorBoundingBoxGeometry, doorBoundingBoxMaterial);
                doorBoundingBoxMesh.position.y = 15;
                doorBoundingBoxMesh.name = this.name;

                this.model.add(doorBoundingBoxMesh);

                resolve("success");
            }, (xhr) => {
                console.log("loading door: " + (xhr.loaded / xhr.total * 100) + '% loaded');
            }, reject)
        });
    }


}

export default Door;