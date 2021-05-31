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
    MeshStandardMaterial
} from "three"

class SafeRoom {
    constructor() {
        this.model = new Group();
        this.flameMaterials = [];
        this.candleLights = [];
        this.time = 0;
    }

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
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material.side = DoubleSide;
                        child.material.shadowSide = BackSide;
                    }
                });
                this.model.add(scene)

                // the actual light source of the candle light
                const candle1Pos = { x: 5.25, y: 1.95, z: -3.57 }
                const candle2Pos = { x: -1.4, y: 2.05, z: 13.1 }

                var candleLight1 = new PointLight(0xffaa33, 10, 100, 5);
                candleLight1.position.set(candle1Pos.x, candle1Pos.y + 0.1, candle1Pos.z,);
                candleLight1.shadow.bias = -0.001
                candleLight1.castShadow = true;

                var candleLight2 = new PointLight(0xffaa33, 10, 100, 5);
                candleLight2.position.set(candle2Pos.x, candle2Pos.y + 0.1, candle2Pos.z,);
                candleLight2.shadow.bias = -0.001
                candleLight2.castShadow = true;

                this.candleLights.push(candleLight2);

                // the candle light shape and material using glsl shader
                const flame1 = this.createCandleLight();
                flame1.position.set(candle1Pos.x, candle1Pos.y, candle1Pos.z,)

                const flame2 = this.createCandleLight();
                flame2.position.set(candle2Pos.x, candle2Pos.y, candle2Pos.z,)


                const exitBoundingBoxGeometry = new BoxGeometry(1, 3, 3,);
                const exitBoundingBoxMaterial = new MeshStandardMaterial({ color: 0xffffff });
                exitBoundingBoxMaterial.visible = false;
                const exitBoundingBoxMesh = new Mesh(exitBoundingBoxGeometry, exitBoundingBoxMaterial);

                exitBoundingBoxMesh.name = "exit";
                exitBoundingBoxMesh.position.x = 10;
                exitBoundingBoxMesh.position.z = 12;
                exitBoundingBoxMesh.position.y = 1.75;

                this.model.add(exitBoundingBoxMesh);
                this.model.add(candleLight1);
                this.model.add(flame1);
                this.model.add(candleLight2);
                this.model.add(flame2);
                this.model.position.set(40, -5, 40);
                this.model.scale.x = 6;
                this.model.scale.y = 6;
                this.model.scale.z = 6;

                resolve("success");
            }, (xhr) => {
                console.log("loading saferoom: " + (xhr.loaded / xhr.total * 100) + '% loaded');
            }, reject)
        });
    }

    createCandleLight() {
        let flameGeo = new SphereBufferGeometry(0.5, 32, 32);
        flameGeo.translate(0, 0.5, 0);
        let flameMat = this.createShaderMaterial();
        this.flameMaterials.push(flameMat);
        let flame = new Mesh(flameGeo, flameMat);
        flame.scale.x = 0.1;
        flame.scale.y = 0.1;
        flame.scale.z = 0.1;
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