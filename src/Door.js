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
        const path = "assets/models/"
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

                if (filename == "Door") {
                    scene.scale.set(6, 6, 6);

                } else {
                    scene.scale.set(4, 4, 4);
                }
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