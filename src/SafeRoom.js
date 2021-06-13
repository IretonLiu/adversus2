import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
    Group,
    PointLight,
    Mesh,
    MeshBasicMaterial,
    FrontSide,
    DoubleSide,
    ShaderMaterial,
    SphereBufferGeometry,
    BackSide,
    BoxGeometry,
    MeshStandardMaterial,
    Vector3,
    Object3D
} from "three"

class SafeRoom {
    constructor(name) {
        this.model = new Group();
        this.flameMaterials = [];
        this.candleLights = [];
        this.time = 0;
        this.name = name;
    }

    loadModel(filename, physics) {

        const loader = new GLTFLoader();
        const path = "./assets/models/saferoom/"
        const extension = ".glb"
        return new Promise((resolve, reject) => {
            //loader.load(url, data => resolve(data), null, reject);
            loader.load(path + filename + extension, (gltf) => {


                const scene = gltf.scene;
                scene.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material.side = DoubleSide;
                        child.material.shadowSide = BackSide;
                    }
                });

                scene.scale.x = 6;
                scene.scale.y = 6;
                scene.scale.z = 6;
                this.model.add(scene)

                // the actual light source of the candle light
                const candle1Pos = { x: 31.5, y: 12.5, z: -21.5 }
                const candle2Pos = { x: -8.4, y: 12.5, z: 78.7 }

                const candleLight1 = new PointLight(0xffaa33, 10, 100, 5);
                candleLight1.shadow.bias = -0.001
                candleLight1.castShadow = true;
                this.candleLights.push(candleLight1);
                // the candle light shape and material using glsl shader
                const flame1 = this.createCandleLight();
                const candleFlame1 = new Group();
                candleFlame1.add(candleLight1)
                candleFlame1.add(flame1)
                candleFlame1.position.set(candle1Pos.x, candle1Pos.y, candle1Pos.z,);



                const candleLight2 = new PointLight(0xffaa33, 10, 100, 5);
                candleLight2.shadow.bias = -0.001
                candleLight2.castShadow = true;
                this.candleLights.push(candleLight2);
                const flame2 = this.createCandleLight();
                const candleFlame2 = new Group();
                candleFlame2.add(candleLight2)
                candleFlame2.add(flame2)
                candleFlame2.position.set(candle2Pos.x, candle2Pos.y + 0.6, candle2Pos.z,);
                // set up the bounding boxes for the exits of the saferoom

                this.setupDoors();
                //this.setupColliders(physics);
                this.model.add(candleFlame1);
                this.model.add(candleFlame2);
                this.model.position.set(40, -5, 40);

                this.model.name = this.name;
                resolve("success");
            }, (xhr) => {
                console.log("loading saferoom: " + (xhr.loaded / xhr.total * 100) + '% loaded');
            }, reject)
        });
    }

    setupColliders(physics) {
        const wallColliderSize = {
            x: 0.6,
            y: 48,
            z: 150
        }
        const wallGeometry = new BoxGeometry(wallColliderSize.x, wallColliderSize.y, wallColliderSize.z);
        const wallMaterial = new MeshStandardMaterial({ color: 0xffffff });
        //exitBoundingBoxMaterial.visible = false;
        const frontWall = new Object3D();
        frontWall.position.x = 60;
        frontWall.position.z = 15;
        this.model.add(frontWall);
        physics.createBoxRB(this.model, frontWall, wallColliderSize);

        const backWall = new Object3D();
        backWall.position.x = -60;
        backWall.position.z = 15;
        this.model.add(backWall);
        physics.createBoxRB(this.model, backWall, wallColliderSize);

        const leftWall = new Object3D();
        leftWall.rotateY(Math.PI / 2)
        leftWall.position.z = 83;
        this.model.add(leftWall);
        physics.createBoxRB(this.model, leftWall, wallColliderSize);

        const rightWall = new Object3D();
        rightWall.rotateY(Math.PI / 2)
        rightWall.position.z = -62;
        this.model.add(rightWall);
        physics.createBoxRB(this.model, rightWall, wallColliderSize);
    }

    setupDoors() {
        const exitBoundingBoxGeometry = new BoxGeometry(5, 18, 18,);
        const exitBoundingBoxMaterial = new MeshStandardMaterial({ color: 0xffffff });
        exitBoundingBoxMaterial.visible = true;
        const exitBoundingBoxMesh = new Mesh(exitBoundingBoxGeometry, exitBoundingBoxMaterial);

        exitBoundingBoxMesh.name = this.name + "exit";
        exitBoundingBoxMesh.position.x = 60;
        exitBoundingBoxMesh.position.z = 70;
        exitBoundingBoxMesh.position.y = 10.5;
        this.model.add(exitBoundingBoxMesh)
    }

    createCandleLight() {
        let flameGeo = new SphereBufferGeometry(0.5, 32, 32);
        flameGeo.translate(0, 0.5, 0);
        let flameMat = this.createShaderMaterial();
        this.flameMaterials.push(flameMat);
        let flame = new Mesh(flameGeo, flameMat);
        flame.position.y = -1;
        flame.scale.x = 0.5;
        flame.scale.y = 0.5;
        flame.scale.z = 0.5;

        return flame;
    }

    update(time) {
        this.time += time;
        this.time = this.time % 1000;
        this.flameMaterials[0].uniforms.time.value = this.time;
        this.flameMaterials[1].uniforms.time.value = this.time;
        for (var i = 0; i < this.candleLights.length; i++) {
            this.candleLights[i].position.x += Math.sin(this.time * Math.PI) * 0.0001;
            // this.candleLights[i].position.z += Math.cos(this.time * Math.PI * 0.75) * 0.0001;
        }
    }

    // create the flame shader, credits to prisoner849

    createShaderMaterial() {
        return new ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
              uniform float time;
              varying vec2 vUv;
              varying float hValue;
      
              //https://thebookofshaders.com/11/
              // 2D Random
              float random (in vec2 st) {
                  return fract(sin(dot(st.xy,
                                       vec2(12.9898,78.233)))
                               * 43758.5453123);
              }
      
              // 2D Noise based on Morgan McGuire @morgan3d
              // https://www.shadertoy.com/view/4dS3Wd
              float noise (in vec2 st) {
                  vec2 i = floor(st);
                  vec2 f = fract(st);
      
                  // Four corners in 2D of a tile
                  float a = random(i);
                  float b = random(i + vec2(1.0, 0.0));
                  float c = random(i + vec2(0.0, 1.0));
                  float d = random(i + vec2(1.0, 1.0));
      
                  // Smooth Interpolation
      
                  // Cubic Hermine Curve.  Same as SmoothStep()
                  vec2 u = f*f*(3.0-2.0*f);
                  // u = smoothstep(0.,1.,f);
      
                  // Mix 4 coorners percentages
                  return mix(a, b, u.x) +
                          (c - a)* u.y * (1.0 - u.x) +
                          (d - b) * u.x * u.y;
              }
      
              void main() {
                vUv = uv;
                vec3 pos = position;
      
                pos *= vec3(0.8, 2, 0.725);
                hValue = position.y;
                //float sinT = sin(time * 2.) * 0.5 + 0.5;
                float posXZlen = length(position.xz);
      
                pos.y *= 1. + (cos((posXZlen + 0.25) * 3.1415926) * 0.25 + noise(vec2(0, time)) * 0.125 + noise(vec2(position.x + time, position.z + time)) * 0.5) * position.y; // flame height
      
                pos.x += noise(vec2(time * 2., (position.y - time) * 4.0)) * hValue * 0.0312; // flame trembling
                pos.z += noise(vec2((position.y - time) * 4.0, time * 2.)) * hValue * 0.0312; // flame trembling
      
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
              }
            `,
            fragmentShader: `
              varying float hValue;
              varying vec2 vUv;
      
              // honestly stolen from https://www.shadertoy.com/view/4dsSzr
              vec3 heatmapGradient(float t) {
                return clamp((pow(t, 1.5) * 0.8 + 0.2) * vec3(smoothstep(0.0, 0.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 6.0)), 0.0, 1.0);
              }
      
              void main() {
                float v = abs(smoothstep(0.0, 0.4, hValue) - 1.);
                float alpha = (1. - v) * 0.99; // bottom transparency
                alpha -= 1. - smoothstep(1.0, 0.97, hValue); // tip transparency
                gl_FragColor = vec4(heatmapGradient(smoothstep(0.0, 0.3, hValue)) * vec3(0.95,0.95,0.4), alpha) ;
                gl_FragColor.rgb = mix(vec3(0,0,1), gl_FragColor.rgb, smoothstep(0.0, 0.3, hValue)); // blueish for bottom
                gl_FragColor.rgb += vec3(1, 0.9, 0.5) * (1.25 - vUv.y); // make the midst brighter
                gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.66, 0.32, 0.03), smoothstep(0.95, 1., hValue)); // tip
              }
            `,
            transparent: true,
            side: FrontSide
        });
    }
}

export default SafeRoom;