import SimplexNoise from "simplex-noise";

class NoiseGenerator {
    constructor() {
    }
    generateNoise(nx, ny, seed) {
        let simplex = new SimplexNoise(seed);

        var value2d = simplex.noise2D(nx * 3, ny * 3);
        return value2d;
    }
    octave(nx, ny, octaves, seed) {
        let val = 0;
        let freq = 1;
        let max = 0;
        let amp = 1;
        for (let i = 0; i < octaves; i++) {
            val += this.generateNoise(nx * freq, ny * freq, seed) * amp;
            max += amp;
            amp /= 2;
            freq *= 2;
        }
        return val / max;
    }
    map(val, smin, smax, emin, emax) {
        const t = (val - smin) / (smax - smin)
        return (emax - emin) * t + emin
    }
    generateNoiseMap(nx, ny, seed) {


        var noise = []
        for (let x = 0; x < nx + 1; x++) {
            for (let y = 0; y < ny + 1; y++) {
                if (x == 0 || y == 0 || x == nx || y == ny) {
                    noise.push(0);
                    continue;
                }
                let v = this.octave(x / nx, y / ny, 16, seed);
                noise.push(this.map(v, -1, 1, 0, 1));
            }
        }
        return noise;
    }

}

export default NoiseGenerator;

