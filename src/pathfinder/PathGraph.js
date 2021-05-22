class GraphNode {
    constructor(x, z) {
        // position in world coordinate
        this.x = x;
        this.z = z;

        this.g = g;
        this.h = h;

        this.closed = false;
        this.parent = null;

        this.neighbours = [];
    }

    addNeighbour(neighbour) {
        this.neighbours.push(neighbour);
        neighbour.neighbours.push(this);
    }

    getNeighbours() {
        return this.neighbours;
    }
}

export default GraphNode;
