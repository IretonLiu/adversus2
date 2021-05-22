import * as THREE from 'three'

class WallGenerator {
    constructor(type, width, height) {
        this.type = type;
        this.width = width;
        this.height = height;
    }

    createWall(type, width, height) {
        var segments = 20;
        var tiltAngle = 0;//Math.PI / 12;

        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var sideWallGeometry = new THREE.PlaneBufferGeometry(width, height / Math.cos(tiltAngle), segments, segments);
        var wallGroup = new THREE.Group();

        var wallOne = new THREE.Mesh(sideWallGeometry, wallMaterial);
        wallOne.receiveShadow = true;
        wallOne.castShadow = true;
        wallOne.rotateX(-tiltAngle);
        wallOne.position.z = width / 2;

        var wallTwo = new THREE.Mesh(sideWallGeometry, wallMaterial);
        wallTwo.receiveShadow = true;
        wallTwo.castShadow = true;
        wallTwo.rotateX(tiltAngle);
        wallTwo.rotateY(Math.PI);
        wallTwo.position.z = -width / 2;

        var wallThree = new THREE.Mesh(sideWallGeometry, wallMaterial);
        wallThree.receiveShadow = true;
        wallThree.castShadow = true;
        wallThree.rotateX(tiltAngle);
        wallThree.rotateY(-Math.PI / 2);
        wallThree.position.x = -width / 2;

        var topPlaneGeometry = new THREE.PlaneBufferGeometry(width, height - height * Math.tan(tiltAngle), segments, segments);
        var topPlane = new THREE.Mesh(topPlaneGeometry, wallMaterial);
        topPlane.receiveShadow = true;
        topPlane.castShadow = true;
        topPlane.rotateX(-Math.PI / 2);
        topPlane.position.y = height / 2;

        switch (type) {
            case 0: // side walls front facing
                wallGroup.add(topPlane);
                wallGroup.add(wallOne);
                wallGroup.add(wallTwo);
                break;
            case 1: // side walls side facing

                // var frontWallShape = new THREE.Shape();
                // frontWallShape.lineTo(0.5 * (width - width * Math.tan(tiltAngle)), height / 2);
                // frontWallShape.lineTo(-0.5 * (width - width * Math.tan(tiltAngle)), height / 2);
                // frontWallShape.lineTo(-0.5 * (width + width * Math.tan(tiltAngle)), -height / 2);
                // frontWallShape.lineTo(0.5 * (width + width * Math.tan(tiltAngle)), -height / 2);
                // frontWallShape.lineTo(0.5 * (width - width * Math.tan(tiltAngle)), height / 2);
                // var frontWallGeo = new THREE.ShapeBufferGeometry(frontWallShape, 20);
                // var frontWall = new THREE.Mesh(frontWallGeo, wallMaterial);
                // frontWall.rotateY(Math.PI / 2);
                // frontWall.position.x = -width / 2;

                // var geo = new THREE.EdgesGeometry(frontWall.geometry); // or WireframeGeometry
                // var mat = new THREE.LineBasicMaterial({ color: 0xffffff, });
                // var wireframe = new THREE.LineSegments(geo, mat);
                //frontWall.add(wireframe);
                wallGroup.add(topPlane);
                wallGroup.add(wallOne);
                wallGroup.add(wallTwo);
                wallGroup.rotateY(Math.PI / 2);
                break;
            case 2: // protruding wall facing forward
                wallGroup.add(topPlane);
                wallGroup.add(wallOne);
                wallGroup.add(wallTwo);
                wallGroup.add(wallThree);
                break;
            case 3: // protruding wall facing backward
                wallGroup.add(topPlane);
                wallGroup.add(wallOne);
                wallGroup.add(wallTwo);
                wallGroup.add(wallThree);
                wallGroup.rotateY(Math.PI);
                break;
            case 4: // protruding wall facing right
                wallGroup.add(topPlane);
                wallGroup.add(wallOne);
                wallGroup.add(wallTwo);
                wallGroup.add(wallThree);
                wallGroup.rotateY(Math.PI / 2);
                break;
            case 5: // protruding wall facing left
                wallGroup.add(topPlane);
                wallGroup.add(wallOne);
                wallGroup.add(wallTwo);
                wallGroup.add(wallThree);
                wallGroup.rotateY(-Math.PI / 2);
                break;
            case 6: // corner, left, down empty
                wallGroup.add(topPlane);
                wallGroup.add(wallTwo);
                wallGroup.add(wallThree);
                break;
            case 7: // corner, right, down empty
                wallGroup.add(topPlane);
                wallGroup.add(wallOne);
                wallGroup.add(wallThree);
                break;
            case 8: // corners left up empty 
                wallGroup.add(topPlane);
                wallGroup.add(wallOne);
                wallGroup.add(wallThree);
                wallGroup.rotateY(Math.PI);
                break;
            case 9: // corners right up empty
                wallGroup.add(topPlane);
                wallGroup.add(wallTwo);
                wallGroup.add(wallThree);
                wallGroup.rotateY(Math.PI);
                break;
            case 10: // T junction, down empty
                wallGroup.add(topPlane);
                wallGroup.add(wallThree);
                break;
            case 11:
                wallGroup.add(topPlane);
                wallGroup.add(wallThree);
                wallGroup.rotateY(Math.PI);
                break;
            case 12:
                wallGroup.add(topPlane);
                wallGroup.add(wallThree);
                wallGroup.rotateY(-Math.PI / 2);
                break;
            case 13:
                wallGroup.add(topPlane);
                wallGroup.add(wallThree);
                wallGroup.rotateY(Math.PI / 2);
                break;
            case 14:
                wallGroup.add(topPlane);
                break;

        }
        wallGroup.receiveShadow = true;
        wallGroup.castShadow = true;
        return wallGroup;

    }
    genBinaryString(x, y, grid, maze) {

        // a binary string specifying the neighbours of cell in thick grid
        // the string in order is: up down left right
        if (y == 0 || y == 2 * maze.height) {
            return "1100"; // wall type 0 
        }
        if (x == 0 || x == 2 * maze.width) {
            return "0011"; // wall type 0 rotated
        }

        //TODO: potentially change the orientation of the maze
        let up = grid[maze.getThickIndex(x + 1, y)];
        let down = grid[maze.getThickIndex(x - 1, y)];
        let left = grid[maze.getThickIndex(x, y - 1)];
        let right = grid[maze.getThickIndex(x, y + 1)];

        let binaryString = "";

        binaryString = binaryString.concat(up ? "1" : "0");
        binaryString = binaryString.concat(down ? "1" : "0");
        binaryString = binaryString.concat(left ? "1" : "0");
        binaryString = binaryString.concat(right ? "1" : "0");
        return binaryString;

    }

    getWallConfig(binaryString) {
        switch (binaryString) {
            case "0001":
                return 5; // protruding facing left
            case "0010":
                console.log("here");
                return 4; // protruding facing right
            case "0100":
                return 3; // protruding facing up/backward
            case "1000":
                return 2; // protruding facing down/forward
            case "1100":
                return 0; // vertical walls
            case "0011":
                return 1;
            case "1001": // corners left down empty
                return 6;
            case "1010": // corners right down empty
                return 7;
            case "0101": // corners left up empty
                return 8;
            case "0110": // corners right up empty
                return 9;
            case "1011": // T, down empty
                return 10;
            case "0111": // T, up empty
                return 11;
            case "1101": // T, left empty
                return 12
            case "1110": // T, right empty
                return 13;
            case "1111": // cross
                return 14
            default:
                return 0; // parallel walls


        }
    }



}

export default WallGenerator;