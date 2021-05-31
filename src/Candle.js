import {
  FrontSide,
  Group,
  Mesh,
  PointLight,
  ShaderMaterial,
  SphereBufferGeometry,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

class Candle {
  constructor() {
    this.model = new Group();
    this.time = 0;
    this.flameMaterial = null;
    this.candleLight = null;
  }

  loadModel() {
    const loader = new GLTFLoader();
    const path = "./assets/models/";
    const extension = ".glb";
    return new Promise((resolve, reject) => {
      //loader.load(url, data => resolve(data), null, reject);
      loader.load(
        path + "Candle" + extension,
        (gltf) => {
          this.model.add(gltf.scene);

          this.candleLight = new PointLight(0xffaa33, 1, 100, 5);
          this.candleLight.shadow.bias = -0.001;
          this.candleLight.castShadow = true;
          this.candleLight.position.y = 0.8;


          const flame = this.createCandleLight();
          flame.position.y = 0.65;

          this.model.add(this.candleLight);
          this.model.add(flame);
          this.model.rotateY((10 * Math.PI) / 9);
          this.model.position.z = -2;
          this.model.position.y = -1.2;
          this.model.position.x = 1.5;
          resolve("success");
        },
        (xhr) => {
          console.log(
            "loading door: " + (xhr.loaded / xhr.total) * 100 + "% loaded"
          );
        },
        reject
      );
    });
  }

  update(time) {
    this.time += time;
    this.time = this.time % 1000;
    this.flameMaterial.uniforms.time.value = this.time;

    this.candleLight.position.x += Math.sin(this.time * Math.PI) * 0.0001;
  }

  createCandleLight() {
    let flameGeo = new SphereBufferGeometry(0.5, 32, 32);
    flameGeo.translate(0, 0.5, 0);
    let flameMat = this.createShaderMaterial();
    this.flameMaterial = flameMat;
    let flame = new Mesh(flameGeo, flameMat);
    flame.scale.x = 0.1;
    flame.scale.y = 0.1;
    flame.scale.z = 0.1;
    return flame;
  }

  createShaderMaterial() {
    return new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
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
      side: FrontSide,
    });
  }
}

export default Candle;
