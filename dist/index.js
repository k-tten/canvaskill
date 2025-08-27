/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/BaseWindow.ts":
/*!***************************!*\
  !*** ./src/BaseWindow.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseWindow: () => (/* binding */ BaseWindow),
/* harmony export */   html: () => (/* binding */ html)
/* harmony export */ });
class BaseWindow {
    static instances = [];
    static WINDOW_MIN_WIDTH = 192;
    static WINDOW_MIN_HEIGHT = 24;
    #position;
    #dimensions;
    #hidden;
    #container;
    #isDragging = { title: false, r: false, l: false, t: false, b: false };
    #last = {
        title: { x: 0, y: 0 },
        l: { x: 0, y: 0, l: 0, w: 0 },
        t: { x: 0, y: 0, t: 0, h: 0 },
    };
    constructor(position, dimensions, options = {}) {
        this.#container = html `
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
    #setupBar(bar) {
        const header = this.#qs(".window-header");
        if (!bar)
            return header.remove();
        const iconEl = this.#qs(".window-icon");
        const titleEl = this.#qs(".window-title");
        const closeBtn = this.#qs(".window-close");
        if (bar.icon)
            iconEl.append(bar.icon instanceof HTMLElement ? bar.icon : bar.icon.toString());
        if (bar.title)
            titleEl.textContent = bar.title;
        if (bar.close) {
            closeBtn.addEventListener("click", this.close.bind(this));
        }
        else {
            closeBtn.remove();
        }
    }
    #setupContent(content) {
        this.#qs(".window-content").append(content instanceof HTMLElement ? content : content.toString());
    }
    #setupMovement(movable) {
        if (!movable)
            return this.#qs(".window-title")?.classList.add("no-move");
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
    #setupResize(resizable) {
        if (!resizable)
            return this.#all(".trigger").forEach((el) => el.remove());
        const bind = (sel, flags) => this.#qs(sel).addEventListener("mousedown", () => {
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
    #drag(e) {
        if (this.#isDragging.title) {
            if (!this.#last.title.x || !this.#last.title.y)
                this.#last.title = { x: e.clientX, y: e.clientY };
            const { top, left } = this.#container.getBoundingClientRect();
            this.#container.style.left = Math.max(left + e.clientX - this.#last.title.x, 0) + "px";
            this.#container.style.top = Math.max(top + e.clientY - this.#last.title.y, 0) + "px";
            this.#last.title = { x: e.clientX, y: e.clientY };
        }
        const rect = this.#container.getBoundingClientRect();
        const style = this.#container.style;
        if (this.#isDragging.r)
            style.width = e.clientX - rect.left + "px";
        if (this.#isDragging.b)
            style.height = e.clientY - rect.top + "px";
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
    set x(x) {
        this.#position.x = x;
        this.#container.style.left = `${x}px`;
    }
    get y() {
        return this.#position.y;
    }
    set y(y) {
        this.#position.y = y;
        this.#container.style.top = `${y}px`;
    }
    get position() {
        return this.#position;
    }
    set position(pos) {
        this.#position = pos;
        this.#container.style.left = `${pos.x}px`;
        this.#container.style.top = `${pos.y}px`;
    }
    get width() {
        return this.#dimensions.x;
    }
    set width(w) {
        this.#dimensions.x = w;
        this.#container.style.width = `${w}px`;
    }
    get height() {
        return this.#dimensions.y;
    }
    set height(h) {
        this.#dimensions.y = h;
        this.#container.style.height = `${h}px`;
    }
    get dimensions() {
        return this.#dimensions;
    }
    set dimensions(d) {
        this.#dimensions = d;
        this.#container.style.width = `${d.x}px`;
        this.#container.style.height = `${d.y}px`;
    }
    get hidden() {
        return this.#hidden;
    }
    set hidden(hidden) {
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
        this.#container = null;
        this.#position = null;
        this.#dimensions = null;
    }
    #qs(sel) {
        return this.#container.querySelector(sel);
    }
    #all(sel) {
        return this.#container.querySelectorAll(sel);
    }
}
function html(strings, ...values) {
    return new DOMParser().parseFromString(String.raw({ raw: strings }, ...values), "text/html").body.firstChild;
}



/***/ }),

/***/ "./src/Vector2.ts":
/*!************************!*\
  !*** ./src/Vector2.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Vector2: () => (/* binding */ Vector2)
/* harmony export */ });
class Vector2 {
    static ORDER = 2;
    #coords;
    constructor(x, y) {
        this.#coords = [x ?? 0, y ?? 0];
    }
    *[Symbol.iterator]() {
        yield* this.#coords;
    }
    add(x, y) {
        if (Vector2.isVector2(x)) {
            this.x += x.x;
            this.y += x.y;
        }
        else {
            this.x += x;
            this.y += y ?? x;
        }
        return this;
    }
    subtract(x, y) {
        if (Vector2.isVector2(x)) {
            this.x -= x.x;
            this.y -= x.y;
        }
        else {
            this.x -= x;
            this.y -= y ?? x;
        }
        return this;
    }
    multiply(x, y) {
        if (Vector2.isVector2(x)) {
            this.x *= x.x;
            this.y *= x.y;
        }
        else {
            this.x *= x;
            this.y *= y ?? x;
        }
        return this;
    }
    divide(x, y) {
        if (Vector2.isVector2(x)) {
            this.x /= x.x;
            this.y /= x.y;
        }
        else {
            this.x /= x;
            this.y /= y ?? x;
        }
        return this;
    }
    negate() {
        return this.multiply(-1);
    }
    angleTo(vector) {
        return Math.acos((this.dot(vector) / this.magnitude) * vector.magnitude);
    }
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    get min() {
        return Math.min(...this.#coords);
    }
    get max() {
        return Math.max(...this.#coords);
    }
    normalize() {
        return this.divide(this.magnitude);
    }
    equals(vector) {
        return vector.x === this.x && vector.y === this.y;
    }
    toString() {
        return `Vector2 (${this.#coords.join(", ")})`;
    }
    clone() {
        return new Vector2(...this.#coords);
    }
    toArray() {
        return [...this.#coords];
    }
    toPoint() {
        const { x, y } = this;
        return { x, y };
    }
    get magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    get length() {
        return this.magnitude;
    }
    get x() {
        return this.#coords[0];
    }
    set x(v) {
        this.#coords[0] = v;
    }
    get y() {
        return this.#coords[1];
    }
    set y(v) {
        this.#coords[1] = v;
    }
    get 0() {
        return this.#coords[0];
    }
    set 0(v) {
        this.#coords[0] = v;
    }
    get 1() {
        return this.#coords[1];
    }
    set 1(v) {
        this.#coords[1] = v;
    }
    static get zero() {
        return new Vector2(0, 0);
    }
    static get origin() {
        return new Vector2(0, 0);
    }
    static get up() {
        return new Vector2(0, 1);
    }
    static get down() {
        return new Vector2(0, -1);
    }
    static get left() {
        return new Vector2(-1, 0);
    }
    static get right() {
        return new Vector2(1, 0);
    }
    static lerp(a, b, t) {
        if (t < 0 || t > 1)
            throw new RangeError("t in lerp(a, b, t) is between 0 and 1 inclusive");
        const lerp = (a, b, t) => (1 - t) * a + t * b;
        return new Vector2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
    }
    static add(a, b) {
        return a.clone().add(b);
    }
    static subtract(a, b) {
        return a.clone().subtract(b);
    }
    static multiply(a, b) {
        return a.clone().multiply(b);
    }
    static divide(a, b) {
        return a.clone().divide(b);
    }
    static negate(vector) {
        return vector.clone().negate();
    }
    static angleTo(a, b) {
        return a.angleTo(b);
    }
    static normalize(vector) {
        return vector.clone().normalize();
    }
    static isVector2(v) {
        return v instanceof Vector2;
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _BaseWindow__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BaseWindow */ "./src/BaseWindow.ts");
/* harmony import */ var _Vector2__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Vector2 */ "./src/Vector2.ts");


new _BaseWindow__WEBPACK_IMPORTED_MODULE_0__.BaseWindow(new _Vector2__WEBPACK_IMPORTED_MODULE_1__.Vector2(window.innerWidth / 2 - 300 / 2, window.innerHeight / 2 - 200 / 2), new _Vector2__WEBPACK_IMPORTED_MODULE_1__.Vector2(300, 200), {
    bar: { icon: "🌟", title: "canvaskill", close: true },
    movable: true,
    resizable: true,
    content: "This is a simple window example.",
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBMkJBLE1BQU0sVUFBVTtJQUNaLE1BQU0sQ0FBQyxTQUFTLEdBQWlCLEVBQUUsQ0FBQztJQUNwQyxNQUFNLENBQVUsZ0JBQWdCLEdBQUcsR0FBRyxDQUFDO0lBQ3ZDLE1BQU0sQ0FBVSxpQkFBaUIsR0FBRyxFQUFFLENBQUM7SUFFdkMsU0FBUyxDQUFXO0lBQ3BCLFdBQVcsQ0FBVztJQUN0QixPQUFPLENBQVc7SUFDbEIsVUFBVSxDQUFjO0lBRXhCLFdBQVcsR0FBYyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBRWxGLEtBQUssR0FBaUI7UUFDbEIsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ3JCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDN0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtLQUNoQyxDQUFDO0lBRUYsWUFBWSxRQUFpQixFQUFFLFVBQW1CLEVBQUUsVUFBeUIsRUFBRTtRQUMzRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBYTs7Ozs7Ozs7OztrQkFVekIsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDOztTQUU3RyxDQUFDO1FBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLENBQUM7UUFFOUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFFcEIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxTQUFTLENBQUMsR0FBc0U7UUFDNUUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBRSxDQUFDO1FBRTNDLElBQUksQ0FBQyxHQUFHO1lBQUUsT0FBTyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFakMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUUsQ0FBQztRQUN6QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFxQixlQUFlLENBQUUsQ0FBQztRQUMvRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFvQixlQUFlLENBQUUsQ0FBQztRQUUvRCxJQUFJLEdBQUcsQ0FBQyxJQUFJO1lBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxZQUFZLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzlGLElBQUksR0FBRyxDQUFDLEtBQUs7WUFBRSxPQUFPLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFFL0MsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQzthQUFNLENBQUM7WUFDSixRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdEIsQ0FBQztJQUNMLENBQUM7SUFFRCxhQUFhLENBQUMsT0FBNkI7UUFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLFlBQVksV0FBVyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZHLENBQUM7SUFFRCxjQUFjLENBQUMsT0FBZ0I7UUFDM0IsSUFBSSxDQUFDLE9BQU87WUFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV6RSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3QyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0MsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFOUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUN4RCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxZQUFZLENBQUMsU0FBa0I7UUFDM0IsSUFBSSxDQUFDLFNBQVM7WUFBRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUUxRSxNQUFNLElBQUksR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUEwQixFQUFFLEVBQUUsQ0FDckQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQzlDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxLQUFLLENBQUMsQ0FBYTtRQUNmLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFbEcsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDOUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUN2RixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBRXJGLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN0RCxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQ3JELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBRXBDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQUUsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRW5FLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO1FBRW5FLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDZixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO29CQUN4QixDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU87b0JBQ1osQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPO29CQUNaLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSTtvQkFDWixDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDO2lCQUM5RCxDQUFDLENBQUM7WUFFUCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUVyRixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDM0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQzNCLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDdEIsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQzNCLENBQUM7UUFDTCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7b0JBQ3hCLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTztvQkFDWixDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU87b0JBQ1osQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHO29CQUNYLENBQUMsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUM7aUJBQy9ELENBQUMsQ0FBQztZQUVQLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRXRGLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUMzQixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDM0IsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUNyQixLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDNUIsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBRUQsY0FBYztRQUNWLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUM1RSxJQUFJLENBQUMsS0FBSyxHQUFHO1lBQ1QsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ3JCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDN0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtTQUNoQyxDQUFDO0lBQ04sQ0FBQztJQUVELElBQUksQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELElBQUksQ0FBQyxDQUFDLENBQVM7UUFDWCxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDMUMsQ0FBQztJQUVELElBQUksQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELElBQUksQ0FBQyxDQUFDLENBQVM7UUFDWCxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDekMsQ0FBQztJQUVELElBQUksUUFBUTtRQUNSLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxRQUFRLENBQUMsR0FBWTtRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztRQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDMUMsSUFBSSxD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LHdDQUF3QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0QsRTs7Ozs7Ozs7Ozs7OztBQ04wQztBQUNOO0FBRXBDLElBQUksbURBQVUsQ0FBQyxJQUFJLDZDQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsV0FBVyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSw2Q0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtJQUNsSCxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtJQUNyRCxPQUFPLEVBQUUsSUFBSTtJQUNiLFNBQVMsRUFBRSxJQUFJO0lBQ2YsT0FBTyxFQUFFLGtDQUFrQztDQUM5QyxDQUFDLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jYW52YXNraWxsLy4vc3JjL0Jhc2VXaW5kb3cudHMiLCJ3ZWJwYWNrOi8vY2FudmFza2lsbC8uL3NyYy9WZWN0b3IyLnRzIiwid2VicGFjazovL2NhbnZhc2tpbGwvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY2FudmFza2lsbC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vY2FudmFza2lsbC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2NhbnZhc2tpbGwvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9jYW52YXNraWxsLy4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFZlY3RvcjIgfSBmcm9tIFwiLi9WZWN0b3IyXCI7XHJcblxyXG5pbnRlcmZhY2UgV2luZG93T3B0aW9ucyB7XHJcbiAgICBiYXI/OiB7XHJcbiAgICAgICAgaWNvbj86IHN0cmluZyB8IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHRpdGxlPzogc3RyaW5nO1xyXG4gICAgICAgIGNsb3NlPzogYm9vbGVhbjtcclxuICAgIH07XHJcbiAgICByZXNpemFibGU/OiBib29sZWFuO1xyXG4gICAgbW92YWJsZT86IGJvb2xlYW47XHJcbiAgICBjb250ZW50Pzogc3RyaW5nIHwgSFRNTEVsZW1lbnQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBEcmFnU3RhdGUge1xyXG4gICAgdGl0bGU6IGJvb2xlYW47XHJcbiAgICByOiBib29sZWFuO1xyXG4gICAgbDogYm9vbGVhbjtcclxuICAgIHQ6IGJvb2xlYW47XHJcbiAgICBiOiBib29sZWFuO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgTGFzdFBvc2l0aW9uIHtcclxuICAgIHRpdGxlOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH07XHJcbiAgICBsOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyBsOiBudW1iZXI7IHc6IG51bWJlciB9O1xyXG4gICAgdDogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgdDogbnVtYmVyOyBoOiBudW1iZXIgfTtcclxufVxyXG5cclxuY2xhc3MgQmFzZVdpbmRvdyB7XHJcbiAgICBzdGF0aWMgaW5zdGFuY2VzOiBCYXNlV2luZG93W10gPSBbXTtcclxuICAgIHN0YXRpYyByZWFkb25seSBXSU5ET1dfTUlOX1dJRFRIID0gMTkyO1xyXG4gICAgc3RhdGljIHJlYWRvbmx5IFdJTkRPV19NSU5fSEVJR0hUID0gMjQ7XHJcblxyXG4gICAgI3Bvc2l0aW9uITogVmVjdG9yMjtcclxuICAgICNkaW1lbnNpb25zITogVmVjdG9yMjtcclxuICAgICNoaWRkZW4hOiBib29sZWFuO1xyXG4gICAgI2NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgI2lzRHJhZ2dpbmc6IERyYWdTdGF0ZSA9IHsgdGl0bGU6IGZhbHNlLCByOiBmYWxzZSwgbDogZmFsc2UsIHQ6IGZhbHNlLCBiOiBmYWxzZSB9O1xyXG5cclxuICAgICNsYXN0OiBMYXN0UG9zaXRpb24gPSB7XHJcbiAgICAgICAgdGl0bGU6IHsgeDogMCwgeTogMCB9LFxyXG4gICAgICAgIGw6IHsgeDogMCwgeTogMCwgbDogMCwgdzogMCB9LFxyXG4gICAgICAgIHQ6IHsgeDogMCwgeTogMCwgdDogMCwgaDogMCB9LFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbjogVmVjdG9yMiwgZGltZW5zaW9uczogVmVjdG9yMiwgb3B0aW9uczogV2luZG93T3B0aW9ucyA9IHt9KSB7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyID0gaHRtbDxIVE1MRWxlbWVudD5gXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3aW5kb3dcIj5cclxuICAgICAgICAgICAgICAgIDxhcnRpY2xlIGNsYXNzPVwid2luZG93LWNvbnRhaW5lclwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3M9XCJ3aW5kb3ctaGVhZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwid2luZG93LWljb25cIj48L2k+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoNCBjbGFzcz1cIndpbmRvdy10aXRsZVwiPjwvaDQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ3aW5kb3ctY2xvc2VcIj48L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICA8bWFpbiBjbGFzcz1cIndpbmRvdy1jb250ZW50XCI+PC9tYWluPlxyXG4gICAgICAgICAgICAgICAgPC9hcnRpY2xlPlxyXG4gICAgICAgICAgICAgICAgJHtbXCJyXCIsIFwibFwiLCBcInRcIiwgXCJiXCIsIFwidHJcIiwgXCJ0bFwiLCBcImJyXCIsIFwiYmxcIl0ubWFwKChkKSA9PiBgPGRpdiBjbGFzcz1cInRyaWdnZXIgJHtkfVwiPjwvZGl2PmApLmpvaW4oXCJcIil9XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIGA7XHJcblxyXG4gICAgICAgIHRoaXMuI3NldHVwQmFyKG9wdGlvbnMuYmFyKTtcclxuICAgICAgICB0aGlzLiNzZXR1cENvbnRlbnQob3B0aW9ucy5jb250ZW50ID8/IFwiXCIpO1xyXG4gICAgICAgIHRoaXMuI3NldHVwTW92ZW1lbnQob3B0aW9ucy5tb3ZhYmxlID8/IGZhbHNlKTtcclxuICAgICAgICB0aGlzLiNzZXR1cFJlc2l6ZShvcHRpb25zLnJlc2l6YWJsZSA/PyBmYWxzZSk7XHJcblxyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgICAgICB0aGlzLmRpbWVuc2lvbnMgPSBkaW1lbnNpb25zO1xyXG4gICAgICAgIHRoaXMuaGlkZGVuID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy4jY29udGFpbmVyKTtcclxuICAgICAgICBCYXNlV2luZG93Lmluc3RhbmNlcy5wdXNoKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgICNzZXR1cEJhcihiYXI/OiB7IGljb24/OiBzdHJpbmcgfCBIVE1MRWxlbWVudDsgdGl0bGU/OiBzdHJpbmc7IGNsb3NlPzogYm9vbGVhbiB9KSB7XHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gdGhpcy4jcXMoXCIud2luZG93LWhlYWRlclwiKSE7XHJcblxyXG4gICAgICAgIGlmICghYmFyKSByZXR1cm4gaGVhZGVyLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uRWwgPSB0aGlzLiNxcyhcIi53aW5kb3ctaWNvblwiKSE7XHJcbiAgICAgICAgY29uc3QgdGl0bGVFbCA9IHRoaXMuI3FzPEhUTUxIZWFkaW5nRWxlbWVudD4oXCIud2luZG93LXRpdGxlXCIpITtcclxuICAgICAgICBjb25zdCBjbG9zZUJ0biA9IHRoaXMuI3FzPEhUTUxCdXR0b25FbGVtZW50PihcIi53aW5kb3ctY2xvc2VcIikhO1xyXG5cclxuICAgICAgICBpZiAoYmFyLmljb24pIGljb25FbC5hcHBlbmQoYmFyLmljb24gaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IGJhci5pY29uIDogYmFyLmljb24udG9TdHJpbmcoKSk7XHJcbiAgICAgICAgaWYgKGJhci50aXRsZSkgdGl0bGVFbC50ZXh0Q29udGVudCA9IGJhci50aXRsZTtcclxuXHJcbiAgICAgICAgaWYgKGJhci5jbG9zZSkge1xyXG4gICAgICAgICAgICBjbG9zZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jbG9zZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjbG9zZUJ0bi5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgI3NldHVwQ29udGVudChjb250ZW50OiBzdHJpbmcgfCBIVE1MRWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuI3FzKFwiLndpbmRvdy1jb250ZW50XCIpIS5hcHBlbmQoY29udGVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ID8gY29udGVudCA6IGNvbnRlbnQudG9TdHJpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgI3NldHVwTW92ZW1lbnQobW92YWJsZTogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICghbW92YWJsZSkgcmV0dXJuIHRoaXMuI3FzKFwiLndpbmRvdy10aXRsZVwiKT8uY2xhc3NMaXN0LmFkZChcIm5vLW1vdmVcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc2V0ID0gdGhpcy4jcmVzZXREcmFnZ2luZy5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcmVzZXQpO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsIHJlc2V0KTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCByZXNldCk7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLiNkcmFnLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLiNxcyhcIi53aW5kb3ctdGl0bGVcIik/LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKCkgPT4gKHRoaXMuI2lzRHJhZ2dpbmcudGl0bGUgPSB0cnVlKSk7XHJcbiAgICAgICAgdGhpcy4jcXMoXCIud2luZG93LXRpdGxlXCIpPy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuI2lzRHJhZ2dpbmcudGl0bGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy4jbGFzdC50aXRsZSA9IHsgeDogMCwgeTogMCB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICNzZXR1cFJlc2l6ZShyZXNpemFibGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAoIXJlc2l6YWJsZSkgcmV0dXJuIHRoaXMuI2FsbChcIi50cmlnZ2VyXCIpLmZvckVhY2goKGVsKSA9PiBlbC5yZW1vdmUoKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJpbmQgPSAoc2VsOiBzdHJpbmcsIGZsYWdzOiAoa2V5b2YgRHJhZ1N0YXRlKVtdKSA9PlxyXG4gICAgICAgICAgICB0aGlzLiNxcyhzZWwpIS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZsYWdzLmZvckVhY2goKGYpID0+ICh0aGlzLiNpc0RyYWdnaW5nW2ZdID0gdHJ1ZSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLnJcIiwgW1wiclwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLmxcIiwgW1wibFwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLnRcIiwgW1widFwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLmJcIiwgW1wiYlwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLnRyXCIsIFtcInRcIiwgXCJyXCJdKTtcclxuICAgICAgICBiaW5kKFwiLnRyaWdnZXIudGxcIiwgW1widFwiLCBcImxcIl0pO1xyXG4gICAgICAgIGJpbmQoXCIudHJpZ2dlci5iclwiLCBbXCJiXCIsIFwiclwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLmJsXCIsIFtcImJcIiwgXCJsXCJdKTtcclxuICAgIH1cclxuXHJcbiAgICAjZHJhZyhlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuI2lzRHJhZ2dpbmcudGl0bGUpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLiNsYXN0LnRpdGxlLnggfHwgIXRoaXMuI2xhc3QudGl0bGUueSkgdGhpcy4jbGFzdC50aXRsZSA9IHsgeDogZS5jbGllbnRYLCB5OiBlLmNsaWVudFkgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHsgdG9wLCBsZWZ0IH0gPSB0aGlzLiNjb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gTWF0aC5tYXgobGVmdCArIGUuY2xpZW50WCAtIHRoaXMuI2xhc3QudGl0bGUueCwgMCkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS50b3AgPSBNYXRoLm1heCh0b3AgKyBlLmNsaWVudFkgLSB0aGlzLiNsYXN0LnRpdGxlLnksIDApICsgXCJweFwiO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4jbGFzdC50aXRsZSA9IHsgeDogZS5jbGllbnRYLCB5OiBlLmNsaWVudFkgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLiNjb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB0aGlzLiNjb250YWluZXIuc3R5bGU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLiNpc0RyYWdnaW5nLnIpIHN0eWxlLndpZHRoID0gZS5jbGllbnRYIC0gcmVjdC5sZWZ0ICsgXCJweFwiO1xyXG5cclxuICAgICAgICBpZiAodGhpcy4jaXNEcmFnZ2luZy5iKSBzdHlsZS5oZWlnaHQgPSBlLmNsaWVudFkgLSByZWN0LnRvcCArIFwicHhcIjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuI2lzRHJhZ2dpbmcubCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuI2xhc3QubC54KVxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLiNsYXN0LmwsIHtcclxuICAgICAgICAgICAgICAgICAgICB4OiBlLmNsaWVudFgsXHJcbiAgICAgICAgICAgICAgICAgICAgeTogZS5jbGllbnRZLFxyXG4gICAgICAgICAgICAgICAgICAgIGw6IHJlY3QubGVmdCxcclxuICAgICAgICAgICAgICAgICAgICB3OiBwYXJzZUludCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLiNjb250YWluZXIpLndpZHRoKSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbCA9IE1hdGgubWF4KHJlY3QubGVmdCArIGUuY2xpZW50WCAtIHRoaXMuI2xhc3QubC54LCAwKTtcclxuICAgICAgICAgICAgY29uc3QgdyA9IE1hdGgubWF4KHRoaXMuI2xhc3QubC5sICsgdGhpcy4jbGFzdC5sLncgLSBsLCBCYXNlV2luZG93LldJTkRPV19NSU5fV0lEVEgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGwgPCBsICsgdyAtIEJhc2VXaW5kb3cuV0lORE9XX01JTl9XSURUSCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4jbGFzdC5sLnggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiNsYXN0LmwueSA9IGUuY2xpZW50WTtcclxuICAgICAgICAgICAgICAgIHN0eWxlLmxlZnQgPSBsICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgc3R5bGUud2lkdGggPSB3ICsgXCJweFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy4jaXNEcmFnZ2luZy50KSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy4jbGFzdC50LngpXHJcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuI2xhc3QudCwge1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IGUuY2xpZW50WCxcclxuICAgICAgICAgICAgICAgICAgICB5OiBlLmNsaWVudFksXHJcbiAgICAgICAgICAgICAgICAgICAgdDogcmVjdC50b3AsXHJcbiAgICAgICAgICAgICAgICAgICAgaDogcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy4jY29udGFpbmVyKS5oZWlnaHQpLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0ID0gTWF0aC5tYXgocmVjdC50b3AgKyBlLmNsaWVudFkgLSB0aGlzLiNsYXN0LnQueSwgMCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGggPSBNYXRoLm1heCh0aGlzLiNsYXN0LnQudCArIHRoaXMuI2xhc3QudC5oIC0gdCwgQmFzZVdpbmRvdy5XSU5ET1dfTUlOX0hFSUdIVCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodCA8IHQgKyBoIC0gQmFzZVdpbmRvdy5XSU5ET1dfTUlOX0hFSUdIVCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4jbGFzdC50LnggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiNsYXN0LnQueSA9IGUuY2xpZW50WTtcclxuICAgICAgICAgICAgICAgIHN0eWxlLnRvcCA9IHQgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICBzdHlsZS5oZWlnaHQgPSBoICsgXCJweFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgICNyZXNldERyYWdnaW5nKCkge1xyXG4gICAgICAgIHRoaXMuI2lzRHJhZ2dpbmcgPSB7IHRpdGxlOiBmYWxzZSwgcjogZmFsc2UsIGw6IGZhbHNlLCB0OiBmYWxzZSwgYjogZmFsc2UgfTtcclxuICAgICAgICB0aGlzLiNsYXN0ID0ge1xyXG4gICAgICAgICAgICB0aXRsZTogeyB4OiAwLCB5OiAwIH0sXHJcbiAgICAgICAgICAgIGw6IHsgeDogMCwgeTogMCwgbDogMCwgdzogMCB9LFxyXG4gICAgICAgICAgICB0OiB7IHg6IDAsIHk6IDAsIHQ6IDAsIGg6IDAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB4KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiNwb3NpdGlvbi54O1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB4KHg6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI3Bvc2l0aW9uLnggPSB4O1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gYCR7eH1weGA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHkoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI3Bvc2l0aW9uLnk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHkoeTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy4jcG9zaXRpb24ueSA9IHk7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyLnN0eWxlLnRvcCA9IGAke3l9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBwb3NpdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jcG9zaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHBvc2l0aW9uKHBvczogVmVjdG9yMikge1xyXG4gICAgICAgIHRoaXMuI3Bvc2l0aW9uID0gcG9zO1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gYCR7cG9zLnh9cHhgO1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS50b3AgPSBgJHtwb3MueX1weGA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHdpZHRoKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiNkaW1lbnNpb25zLng7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHdpZHRoKHc6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI2RpbWVuc2lvbnMueCA9IHc7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyLnN0eWxlLndpZHRoID0gYCR7d31weGA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGhlaWdodCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jZGltZW5zaW9ucy55O1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBoZWlnaHQoaDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy4jZGltZW5zaW9ucy55ID0gaDtcclxuICAgICAgICB0aGlzLiNjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gYCR7aH1weGA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGRpbWVuc2lvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RpbWVuc2lvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGRpbWVuc2lvbnMoZDogVmVjdG9yMikge1xyXG4gICAgICAgIHRoaXMuI2RpbWVuc2lvbnMgPSBkO1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS53aWR0aCA9IGAke2QueH1weGA7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGAke2QueX1weGA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGhpZGRlbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jaGlkZGVuO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBoaWRkZW4oaGlkZGVuOiBib29sZWFuKSB7XHJcbiAgICAgICAgdGhpcy4jaGlkZGVuID0gaGlkZGVuO1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5jbGFzc0xpc3QudG9nZ2xlKFwic2hvdy13aW5kb3dcIiwgIWhpZGRlbik7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyLmNsYXNzTGlzdC50b2dnbGUoXCJoaWRlLXdpbmRvd1wiLCBoaWRkZW4pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENvbnRhaW5lcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jY29udGFpbmVyO1xyXG4gICAgfVxyXG5cclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIHRoaXMuaGlkZGVuID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLiNkZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG4gICAgI2Rlc3Ryb3koKSB7XHJcbiAgICAgICAgQmFzZVdpbmRvdy5pbnN0YW5jZXMgPSBCYXNlV2luZG93Lmluc3RhbmNlcy5maWx0ZXIoKHcpID0+IHcgIT09IHRoaXMpO1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLiNjb250YWluZXIucmVwbGFjZUNoaWxkcmVuKCk7XHJcbiAgICAgICAgKHRoaXMgYXMgYW55KS4jY29udGFpbmVyID0gbnVsbDtcclxuICAgICAgICAodGhpcyBhcyBhbnkpLiNwb3NpdGlvbiA9IG51bGw7XHJcbiAgICAgICAgKHRoaXMgYXMgYW55KS4jZGltZW5zaW9ucyA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgI3FzPFQgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHNlbDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yPFQ+KHNlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgI2FsbDxUIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWw6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiNjb250YWluZXIucXVlcnlTZWxlY3RvckFsbDxUPihzZWwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBodG1sPFQ+KHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKTogVCB7XHJcbiAgICByZXR1cm4gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhTdHJpbmcucmF3KHsgcmF3OiBzdHJpbmdzIH0sIC4uLnZhbHVlcyksIFwidGV4dC9odG1sXCIpLmJvZHkuZmlyc3RDaGlsZCBhcyBUO1xyXG59XHJcblxyXG5leHBvcnQgeyBCYXNlV2luZG93LCBodG1sLCBXaW5kb3dPcHRpb25zIH07XHJcbiIsImV4cG9ydCBjbGFzcyBWZWN0b3IyIHtcclxuICAgIHN0YXRpYyBPUkRFUiA9IDI7XHJcblxyXG4gICAgI2Nvb3JkczogW251bWJlciwgbnVtYmVyXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih4PzogbnVtYmVyLCB5PzogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy4jY29vcmRzID0gW3ggPz8gMCwgeSA/PyAwXTtcclxuICAgIH1cclxuXHJcbiAgICAqW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmFibGVJdGVyYXRvcjxudW1iZXI+IHtcclxuICAgICAgICB5aWVsZCogdGhpcy4jY29vcmRzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZCh2OiBWZWN0b3IyKTogVmVjdG9yMjtcclxuICAgIGFkZCh4OiBudW1iZXIsIHk/OiBudW1iZXIpOiBWZWN0b3IyO1xyXG4gICAgYWRkKHg6IFZlY3RvcjIgfCBudW1iZXIsIHk/OiBudW1iZXIpOiBWZWN0b3IyIHtcclxuICAgICAgICBpZiAoVmVjdG9yMi5pc1ZlY3RvcjIoeCkpIHtcclxuICAgICAgICAgICAgdGhpcy54ICs9IHgueDtcclxuICAgICAgICAgICAgdGhpcy55ICs9IHgueTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnggKz0geDtcclxuICAgICAgICAgICAgdGhpcy55ICs9IHkgPz8geDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc3VidHJhY3QodjogVmVjdG9yMik6IFZlY3RvcjI7XHJcbiAgICBzdWJ0cmFjdCh4OiBudW1iZXIsIHk/OiBudW1iZXIpOiBWZWN0b3IyO1xyXG4gICAgc3VidHJhY3QoeDogVmVjdG9yMiB8IG51bWJlciwgeT86IG51bWJlcik6IFZlY3RvcjIge1xyXG4gICAgICAgIGlmIChWZWN0b3IyLmlzVmVjdG9yMih4KSkge1xyXG4gICAgICAgICAgICB0aGlzLnggLT0geC54O1xyXG4gICAgICAgICAgICB0aGlzLnkgLT0geC55O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMueCAtPSB4O1xyXG4gICAgICAgICAgICB0aGlzLnkgLT0geSA/PyB4O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBtdWx0aXBseSh2OiBWZWN0b3IyKTogVmVjdG9yMjtcclxuICAgIG11bHRpcGx5KHg6IG51bWJlciwgeT86IG51bWJlcik6IFZlY3RvcjI7XHJcbiAgICBtdWx0aXBseSh4OiBWZWN0b3IyIHwgbnVtYmVyLCB5PzogbnVtYmVyKTogVmVjdG9yMiB7XHJcbiAgICAgICAgaWYgKFZlY3RvcjIuaXNWZWN0b3IyKHgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMueCAqPSB4Lng7XHJcbiAgICAgICAgICAgIHRoaXMueSAqPSB4Lnk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy54ICo9IHg7XHJcbiAgICAgICAgICAgIHRoaXMueSAqPSB5ID8/IHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGRpdmlkZSh2OiBWZWN0b3IyKTogVmVjdG9yMjtcclxuICAgIGRpdmlkZSh4OiBudW1iZXIsIHk/OiBudW1iZXIpOiBWZWN0b3IyO1xyXG4gICAgZGl2aWRlKHg6IFZlY3RvcjIgfCBudW1iZXIsIHk/OiBudW1iZXIpOiBWZWN0b3IyIHtcclxuICAgICAgICBpZiAoVmVjdG9yMi5pc1ZlY3RvcjIoeCkpIHtcclxuICAgICAgICAgICAgdGhpcy54IC89IHgueDtcclxuICAgICAgICAgICAgdGhpcy55IC89IHgueTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnggLz0geDtcclxuICAgICAgICAgICAgdGhpcy55IC89IHkgPz8geDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgbmVnYXRlKCk6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KC0xKTtcclxuICAgIH1cclxuXHJcbiAgICBhbmdsZVRvKHZlY3RvcjogVmVjdG9yMik6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguYWNvcygodGhpcy5kb3QodmVjdG9yKSAvIHRoaXMubWFnbml0dWRlKSAqIHZlY3Rvci5tYWduaXR1ZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGRvdCh2ZWN0b3I6IFZlY3RvcjIpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiB2ZWN0b3IueCArIHRoaXMueSAqIHZlY3Rvci55O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBtaW4oKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5taW4oLi4udGhpcy4jY29vcmRzKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbWF4KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KC4uLnRoaXMuI2Nvb3Jkcyk7XHJcbiAgICB9XHJcblxyXG4gICAgbm9ybWFsaXplKCk6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRpdmlkZSh0aGlzLm1hZ25pdHVkZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZXF1YWxzKHZlY3RvcjogVmVjdG9yMik6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB2ZWN0b3IueCA9PT0gdGhpcy54ICYmIHZlY3Rvci55ID09PSB0aGlzLnk7XHJcbiAgICB9XHJcblxyXG4gICAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gYFZlY3RvcjIgKCR7dGhpcy4jY29vcmRzLmpvaW4oXCIsIFwiKX0pYDtcclxuICAgIH1cclxuXHJcbiAgICBjbG9uZSgpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoLi4udGhpcy4jY29vcmRzKTtcclxuICAgIH1cclxuXHJcbiAgICB0b0FycmF5KCk6IFtudW1iZXIsIG51bWJlcl0ge1xyXG4gICAgICAgIHJldHVybiBbLi4udGhpcy4jY29vcmRzXTtcclxuICAgIH1cclxuXHJcbiAgICB0b1BvaW50KCk6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfSB7XHJcbiAgICAgICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiB7IHgsIHkgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbWFnbml0dWRlKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tYWduaXR1ZGU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHgoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jY29vcmRzWzBdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB4KHY6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI2Nvb3Jkc1swXSA9IHY7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jY29vcmRzWzFdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB5KHY6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI2Nvb3Jkc1sxXSA9IHY7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IDAoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jY29vcmRzWzBdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCAwKHY6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI2Nvb3Jkc1swXSA9IHY7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IDEoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jY29vcmRzWzFdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCAxKHY6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI2Nvb3Jkc1sxXSA9IHY7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCB6ZXJvKCk6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMigwLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IG9yaWdpbigpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoMCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCB1cCgpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoMCwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBkb3duKCk6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMigwLCAtMSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBsZWZ0KCk6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMigtMSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCByaWdodCgpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoMSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGxlcnAoYTogVmVjdG9yMiwgYjogVmVjdG9yMiwgdDogbnVtYmVyKTogVmVjdG9yMiB7XHJcbiAgICAgICAgaWYgKHQgPCAwIHx8IHQgPiAxKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcInQgaW4gbGVycChhLCBiLCB0KSBpcyBiZXR3ZWVuIDAgYW5kIDEgaW5jbHVzaXZlXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBsZXJwID0gKGE6IG51bWJlciwgYjogbnVtYmVyLCB0OiBudW1iZXIpID0+ICgxIC0gdCkgKiBhICsgdCAqIGI7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMihsZXJwKGEueCwgYi54LCB0KSwgbGVycChhLnksIGIueSwgdCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhZGQoYTogVmVjdG9yMiwgYjogVmVjdG9yMik6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiBhLmNsb25lKCkuYWRkKGIpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBzdWJ0cmFjdChhOiBWZWN0b3IyLCBiOiBWZWN0b3IyKTogVmVjdG9yMiB7XHJcbiAgICAgICAgcmV0dXJuIGEuY2xvbmUoKS5zdWJ0cmFjdChiKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgbXVsdGlwbHkoYTogVmVjdG9yMiwgYjogVmVjdG9yMik6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiBhLmNsb25lKCkubXVsdGlwbHkoYik7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGRpdmlkZShhOiBWZWN0b3IyLCBiOiBWZWN0b3IyKTogVmVjdG9yMiB7XHJcbiAgICAgICAgcmV0dXJuIGEuY2xvbmUoKS5kaXZpZGUoYik7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIG5lZ2F0ZSh2ZWN0b3I6IFZlY3RvcjIpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gdmVjdG9yLmNsb25lKCkubmVnYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFuZ2xlVG8oYTogVmVjdG9yMiwgYjogVmVjdG9yMik6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIGEuYW5nbGVUbyhiKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgbm9ybWFsaXplKHZlY3RvcjogVmVjdG9yMik6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiB2ZWN0b3IuY2xvbmUoKS5ub3JtYWxpemUoKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaXNWZWN0b3IyKHY6IHVua25vd24pOiB2IGlzIFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiB2IGluc3RhbmNlb2YgVmVjdG9yMjtcclxuICAgIH1cclxufVxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IEJhc2VXaW5kb3cgfSBmcm9tIFwiLi9CYXNlV2luZG93XCI7XHJcbmltcG9ydCB7IFZlY3RvcjIgfSBmcm9tIFwiLi9WZWN0b3IyXCI7XHJcblxyXG5uZXcgQmFzZVdpbmRvdyhuZXcgVmVjdG9yMih3aW5kb3cuaW5uZXJXaWR0aCAvIDIgLSAzMDAgLyAyLCB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyIC0gMjAwIC8gMiksIG5ldyBWZWN0b3IyKDMwMCwgMjAwKSwge1xyXG4gICAgYmFyOiB7IGljb246IFwi8J+Mn1wiLCB0aXRsZTogXCJjYW52YXNraWxsXCIsIGNsb3NlOiB0cnVlIH0sXHJcbiAgICBtb3ZhYmxlOiB0cnVlLFxyXG4gICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgY29udGVudDogXCJUaGlzIGlzIGEgc2ltcGxlIHdpbmRvdyBleGFtcGxlLlwiLFxyXG59KTtcclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9