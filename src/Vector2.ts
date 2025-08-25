export class Vector2 {
    static ORDER = 2;

    #coords: [number, number];

    constructor(x?: number, y?: number) {
        this.#coords = [x ?? 0, y ?? 0];
    }

    *[Symbol.iterator](): IterableIterator<number> {
        yield* this.#coords;
    }

    add(v: Vector2): Vector2;
    add(x: number, y?: number): Vector2;
    add(x: Vector2 | number, y?: number): Vector2 {
        if (Vector2.isVector2(x)) {
            this.x += x.x;
            this.y += x.y;
        } else {
            this.x += x;
            this.y += y ?? x;
        }
        return this;
    }

    subtract(v: Vector2): Vector2;
    subtract(x: number, y?: number): Vector2;
    subtract(x: Vector2 | number, y?: number): Vector2 {
        if (Vector2.isVector2(x)) {
            this.x -= x.x;
            this.y -= x.y;
        } else {
            this.x -= x;
            this.y -= y ?? x;
        }
        return this;
    }

    multiply(v: Vector2): Vector2;
    multiply(x: number, y?: number): Vector2;
    multiply(x: Vector2 | number, y?: number): Vector2 {
        if (Vector2.isVector2(x)) {
            this.x *= x.x;
            this.y *= x.y;
        } else {
            this.x *= x;
            this.y *= y ?? x;
        }
        return this;
    }

    divide(v: Vector2): Vector2;
    divide(x: number, y?: number): Vector2;
    divide(x: Vector2 | number, y?: number): Vector2 {
        if (Vector2.isVector2(x)) {
            this.x /= x.x;
            this.y /= x.y;
        } else {
            this.x /= x;
            this.y /= y ?? x;
        }
        return this;
    }

    negate(): Vector2 {
        return this.multiply(-1);
    }

    angleTo(vector: Vector2): number {
        return Math.acos((this.dot(vector) / this.magnitude) * vector.magnitude);
    }

    dot(vector: Vector2): number {
        return this.x * vector.x + this.y * vector.y;
    }

    get min(): number {
        return Math.min(...this.#coords);
    }

    get max(): number {
        return Math.max(...this.#coords);
    }

    normalize(): Vector2 {
        return this.divide(this.magnitude);
    }

    equals(vector: Vector2): boolean {
        return vector.x === this.x && vector.y === this.y;
    }

    toString(): string {
        return `Vector2 (${this.#coords.join(", ")})`;
    }

    clone(): Vector2 {
        return new Vector2(...this.#coords);
    }

    toArray(): [number, number] {
        return [...this.#coords];
    }

    toPoint(): { x: number; y: number } {
        const { x, y } = this;
        return { x, y };
    }

    get magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    get length(): number {
        return this.magnitude;
    }

    get x(): number {
        return this.#coords[0];
    }

    set x(v: number) {
        this.#coords[0] = v;
    }

    get y(): number {
        return this.#coords[1];
    }

    set y(v: number) {
        this.#coords[1] = v;
    }

    get 0(): number {
        return this.#coords[0];
    }

    set 0(v: number) {
        this.#coords[0] = v;
    }

    get 1(): number {
        return this.#coords[1];
    }

    set 1(v: number) {
        this.#coords[1] = v;
    }

    static get zero(): Vector2 {
        return new Vector2(0, 0);
    }

    static get origin(): Vector2 {
        return new Vector2(0, 0);
    }

    static get up(): Vector2 {
        return new Vector2(0, 1);
    }

    static get down(): Vector2 {
        return new Vector2(0, -1);
    }

    static get left(): Vector2 {
        return new Vector2(-1, 0);
    }

    static get right(): Vector2 {
        return new Vector2(1, 0);
    }

    static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
        if (t < 0 || t > 1) throw new RangeError("t in lerp(a, b, t) is between 0 and 1 inclusive");

        const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;

        return new Vector2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
    }

    static add(a: Vector2, b: Vector2): Vector2 {
        return a.clone().add(b);
    }

    static subtract(a: Vector2, b: Vector2): Vector2 {
        return a.clone().subtract(b);
    }

    static multiply(a: Vector2, b: Vector2): Vector2 {
        return a.clone().multiply(b);
    }

    static divide(a: Vector2, b: Vector2): Vector2 {
        return a.clone().divide(b);
    }

    static negate(vector: Vector2): Vector2 {
        return vector.clone().negate();
    }

    static angleTo(a: Vector2, b: Vector2): number {
        return a.angleTo(b);
    }

    static normalize(vector: Vector2): Vector2 {
        return vector.clone().normalize();
    }

    static isVector2(v: unknown): v is Vector2 {
        return v instanceof Vector2;
    }
}
