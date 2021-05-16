import GameManager from "./GameManager";
import {Vector3} from "three";
import {randInt} from "three/src/math/MathUtils";
import {rand} from "three/examples/jsm/renderers/nodes/functions/MathFunctions";
const overlay = document.getElementById("overlay")
const ctx  = document.getElementById("mmOnScreen").getContext("2d")

class minimap{
    constructor(pCon) {
        this.pCon = pCon
        this.mapControls()
        this.placePos()
        this.x=pCon.camera.position.x;
        this.z=pCon.camera.position.z;
    }
    mapControls() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case "KeyM":
                    overlay.hidden = !overlay.hidden;
                    break;
                //
                // case "KeyK":
                //     ctx.clearRect(0, 0, 500, 500);
                //     ctx.fillStyle = "red";
                //     ctx.fillRect(randInt(100, 250), randInt(0, 250), 3, 3);
                //     break;
            }
        };
        document.addEventListener("keydown", onKeyDown);
    }

    placePos()
    {
        this.x=this.pCon.camera.position.x;
        this.z=this.pCon.camera.position.z;
        ctx.clearRect(0, 0, 500, 500);
        ctx.fillStyle = "red";
        ctx.fillRect(this.z/2+140, -this.x/2+140, 3, 3);
    }
}
export default minimap

