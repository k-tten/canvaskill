import { Vector2 } from "./Vector2";

class GameWindow {
    #pos: Vector2;
    #dim: Vector2;
    #canvas: HTMLCanvasElement;

    constructor(position: Vector2, dimensions: Vector2) {
        this.#pos = position;
        this.#dim = dimensions;

        this.#canvas = document.createElement("canvas");
    }
}
