import { Vector2 } from "./Vector2";

interface WindowOptions {
    bar?: {
        icon?: string | HTMLElement;
        title?: string;
        close?: boolean;
    };
    resizable?: boolean;
    movable?: boolean;
    content?: string | HTMLElement;
}

interface DragState {
    title: boolean;
    r: boolean;
    l: boolean;
    t: boolean;
    b: boolean;
}

interface LastPosition {
    title: { x: number; y: number };
    l: { x: number; y: number; l: number; w: number };
    t: { x: number; y: number; t: number; h: number };
}

class BaseWindow {
    static instances: BaseWindow[] = [];
    static readonly WINDOW_MIN_WIDTH = 192;
    static readonly WINDOW_MIN_HEIGHT = 24;

    #position!: Vector2;
    #dimensions!: Vector2;
    #hidden!: boolean;
    #container: HTMLElement;

    #isDragging: DragState = { title: false, r: false, l: false, t: false, b: false };

    #last: LastPosition = {
        title: { x: 0, y: 0 },
        l: { x: 0, y: 0, l: 0, w: 0 },
        t: { x: 0, y: 0, t: 0, h: 0 },
    };

    constructor(position: Vector2, dimensions: Vector2, options: WindowOptions = {}) {
        this.#container = html<HTMLElement>`
            <div class="window">
                <article class="window-container">
                    <header class="window-header">
                        <i class="window-icon"></i>
                        <h4 class="window-title"></h4>
                        <button class="window-close"></button>
                    </header>
                    <main class="window-content"></main>
                </article>
                ${["r", "l", "t", "b", "tr", "tl", "br", "bl"].map((d) => `<div class="trigger ${d}"></div>`).join("")}
            </div>
        `;

        this.#setupBar(options.bar);
        this.#setupContent(options.content ?? "");
        this.#setupMovement(options.movable ?? false);
        this.#setupResize(options.resizable ?? false);

        this.position = position;
        this.dimensions = dimensions;
        this.hidden = false;

        document.body.appendChild(this.#container);
        BaseWindow.instances.push(this);
    }

    #setupBar(bar?: { icon?: string | HTMLElement; title?: string; close?: boolean }) {
        const header = this.#qs(".window-header")!;

        if (!bar) return header.remove();

        const iconEl = this.#qs(".window-icon")!;
        const titleEl = this.#qs<HTMLHeadingElement>(".window-title")!;
        const closeBtn = this.#qs<HTMLButtonElement>(".window-close")!;

        if (bar.icon) iconEl.append(bar.icon instanceof HTMLElement ? bar.icon : bar.icon.toString());
        if (bar.title) titleEl.textContent = bar.title;

        if (bar.close) {
            closeBtn.addEventListener("click", this.close.bind(this));
        } else {
            closeBtn.remove();
        }
    }

    #setupContent(content: string | HTMLElement) {
        this.#qs(".window-content")!.append(content instanceof HTMLElement ? content : content.toString());
    }

    #setupMovement(movable: boolean) {
        if (!movable) return this.#qs(".window-title")?.classList.add("no-move");

        const reset = this.#resetDragging.bind(this);

        document.addEventListener("click", reset);
        document.addEventListener("mouseleave", reset);
        document.addEventListener("mouseup", reset);
        document.addEventListener("mousemove", this.#drag.bind(this));

        this.#qs(".window-title")?.addEventListener("mousedown", () => (this.#isDragging.title = true));
        this.#qs(".window-title")?.addEventListener("mouseup", () => {
            this.#isDragging.title = false;
            this.#last.title = { x: 0, y: 0 };
        });
    }

    #setupResize(resizable: boolean) {
        if (!resizable) return this.#all(".trigger").forEach((el) => el.remove());

        const bind = (sel: string, flags: (keyof DragState)[]) =>
            this.#qs(sel)!.addEventListener("mousedown", () => {
                flags.forEach((f) => (this.#isDragging[f] = true));
            });

        bind(".trigger.r", ["r"]);
        bind(".trigger.l", ["l"]);
        bind(".trigger.t", ["t"]);
        bind(".trigger.b", ["b"]);
        bind(".trigger.tr", ["t", "r"]);
        bind(".trigger.tl", ["t", "l"]);
        bind(".trigger.br", ["b", "r"]);
        bind(".trigger.bl", ["b", "l"]);
    }

    #drag(e: MouseEvent) {
        if (this.#isDragging.title) {
            if (!this.#last.title.x || !this.#last.title.y) this.#last.title = { x: e.clientX, y: e.clientY };

            const { top, left } = this.#container.getBoundingClientRect();
            this.#container.style.left = Math.max(left + e.clientX - this.#last.title.x, 0) + "px";
            this.#container.style.top = Math.max(top + e.clientY - this.#last.title.y, 0) + "px";

            this.#last.title = { x: e.clientX, y: e.clientY };
        }

        const rect = this.#container.getBoundingClientRect();
        const style = this.#container.style;

        if (this.#isDragging.r) style.width = e.clientX - rect.left + "px";

        if (this.#isDragging.b) style.height = e.clientY - rect.top + "px";

        if (this.#isDragging.l) {
            if (!this.#last.l.x)
                Object.assign(this.#last.l, {
                    x: e.clientX,
                    y: e.clientY,
                    l: rect.left,
                    w: parseInt(window.getComputedStyle(this.#container).width),
                });

            const l = Math.max(rect.left + e.clientX - this.#last.l.x, 0);
            const w = Math.max(this.#last.l.l + this.#last.l.w - l, BaseWindow.WINDOW_MIN_WIDTH);

            if (l < l + w - BaseWindow.WINDOW_MIN_WIDTH) {
                this.#last.l.x = e.clientX;
                this.#last.l.y = e.clientY;
                style.left = l + "px";
                style.width = w + "px";
            }
        }

        if (this.#isDragging.t) {
            if (!this.#last.t.x)
                Object.assign(this.#last.t, {
                    x: e.clientX,
                    y: e.clientY,
                    t: rect.top,
                    h: parseInt(window.getComputedStyle(this.#container).height),
                });

            const t = Math.max(rect.top + e.clientY - this.#last.t.y, 0);
            const h = Math.max(this.#last.t.t + this.#last.t.h - t, BaseWindow.WINDOW_MIN_HEIGHT);

            if (t < t + h - BaseWindow.WINDOW_MIN_HEIGHT) {
                this.#last.t.x = e.clientX;
                this.#last.t.y = e.clientY;
                style.top = t + "px";
                style.height = h + "px";
            }
        }
    }

    #resetDragging() {
        this.#isDragging = { title: false, r: false, l: false, t: false, b: false };
        this.#last = {
            title: { x: 0, y: 0 },
            l: { x: 0, y: 0, l: 0, w: 0 },
            t: { x: 0, y: 0, t: 0, h: 0 },
        };
    }

    get x() {
        return this.#position.x;
    }

    set x(x: number) {
        this.#position.x = x;
        this.#container.style.left = `${x}px`;
    }

    get y() {
        return this.#position.y;
    }

    set y(y: number) {
        this.#position.y = y;
        this.#container.style.top = `${y}px`;
    }

    get position() {
        return this.#position;
    }

    set position(pos: Vector2) {
        this.#position = pos;
        this.#container.style.left = `${pos.x}px`;
        this.#container.style.top = `${pos.y}px`;
    }

    get width() {
        return this.#dimensions.x;
    }

    set width(w: number) {
        this.#dimensions.x = w;
        this.#container.style.width = `${w}px`;
    }

    get height() {
        return this.#dimensions.y;
    }

    set height(h: number) {
        this.#dimensions.y = h;
        this.#container.style.height = `${h}px`;
    }

    get dimensions() {
        return this.#dimensions;
    }

    set dimensions(d: Vector2) {
        this.#dimensions = d;
        this.#container.style.width = `${d.x}px`;
        this.#container.style.height = `${d.y}px`;
    }

    get hidden() {
        return this.#hidden;
    }

    set hidden(hidden: boolean) {
        this.#hidden = hidden;
        this.#container.classList.toggle("show-window", !hidden);
        this.#container.classList.toggle("hide-window", hidden);
    }

    getContainer() {
        return this.#container;
    }

    close() {
        this.hidden = true;
        this.#destroy();
    }

    #destroy() {
        BaseWindow.instances = BaseWindow.instances.filter((w) => w !== this);
        this.#container.remove();
        this.#container.replaceChildren();
        (this as any).#container = null;
        (this as any).#position = null;
        (this as any).#dimensions = null;
    }

    #qs<T extends Element = HTMLElement>(sel: string) {
        return this.#container.querySelector<T>(sel);
    }

    #all<T extends Element = HTMLElement>(sel: string) {
        return this.#container.querySelectorAll<T>(sel);
    }
}

function html<T>(strings: TemplateStringsArray, ...values: any[]): T {
    return new DOMParser().parseFromString(String.raw({ raw: strings }, ...values), "text/html").body.firstChild as T;
}

export { BaseWindow, html, WindowOptions };
