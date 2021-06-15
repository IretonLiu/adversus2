import * as THREE from "three"

class SnowManager {
    constructor(scene, player) {
        this.player = player;
        this.scene = scene;
        this.snowParticles = null;
        this.makeSnow();
    }
    randomIntFromInterval(min, max) {
        // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    makeSnow() {
        const particleNum = 10000;
        const max = 100;
        const min = -100;
        const textureSize = 64.0;

        const drawRadialGradation = (ctx, canvasRadius, canvasW, canvasH) => {
            ctx.save();
            const gradient = ctx.createRadialGradient(
                canvasRadius,
                canvasRadius,
                0,
                canvasRadius,
                canvasRadius,
                canvasRadius
            );
            gradient.addColorStop(0, "rgba(255,255,255,1.0)");
            gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
            gradient.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.restore();
        };

        const getTexture = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const diameter = textureSize;
            canvas.width = diameter;
            canvas.height = diameter;
            const canvasRadius = diameter / 2;

            /* gradation circle
            ------------------------ */
            drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);

            /* snow crystal
            ------------------------ */
            // drawSnowCrystal(ctx, canvasRadius);

            const texture = new THREE.Texture(canvas);
            texture.minFilter = THREE.NearestFilter;
            texture.type = THREE.FloatType;
            texture.needsUpdate = true;
            return texture;
        };
        const pointGeometry = new THREE.BufferGeometry();
        var vertices = [];
        var sizes = [];
        for (let i = 0; i < particleNum; i++) {
            vertices.push(this.randomIntFromInterval(min, max));
            vertices.push(this.randomIntFromInterval(50, -10));
            vertices.push(this.randomIntFromInterval(min, max));
            sizes.push(8);
        }
        pointGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3)
        );
        pointGeometry.setAttribute(
            "size",
            new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage)
        );

        const pointMaterial = new THREE.PointsMaterial({
            // size: 8,
            color: 0xffffff,
            opacity: 0.3,
            vertexColors: false,
            map: getTexture(),
            transparent: true,
            // opacity: 0.8,
            // blending: THREE.AdditiveBlending,
            fog: false,
            depthTest: true,
        });

        const velocities = [];
        for (let i = 0; i < particleNum; i++) {
            const x = Math.floor(Math.random() * 6 - 3) * 0.5;
            const y = Math.floor(Math.random() * 10 + 3) * -0.1;
            const z = Math.floor(Math.random() * 6 - 3) * 0.5;
            const particle = new THREE.Vector3(x, y, z);
            velocities.push(particle);
        }

        let m = new THREE.Matrix4();
        m.makeRotationX(THREE.MathUtils.degToRad(90));
        m.scale(new THREE.Vector3(300, 300, 300));

        this.snowParticles = new THREE.Points(pointGeometry, pointMaterial);
        this.snowParticles.geometry.applyMatrix4(m);
        // snowParticles.geometry.velocities = velocities;
        this.scene.add(this.snowParticles);
    }

    updateSnow(delta) {
        var playerX = this.player.getPosition().x;
        var playerZ = this.player.getPosition().z;
        const posArr = this.snowParticles.geometry.getAttribute("position").array;

        var offset = 100;

        for (let i = 0; i < posArr.length; i += 3) {
            var x = i;
            var y = i + 1;
            var z = i + 2;

            posArr[y] += -15 * delta;
            if (posArr[y] < 0) {
                posArr[y] = this.randomIntFromInterval(-10, 50);
                posArr[x] = this.randomIntFromInterval(playerX - offset, playerX + offset);
                posArr[z] = this.randomIntFromInterval(playerZ - offset, playerZ + offset);
            }
        }

        this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }
}

export default SnowManager;