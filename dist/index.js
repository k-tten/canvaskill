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
    static #zIndexCounter = 1;
    static WINDOW_MIN_WIDTH = 192;
    static WINDOW_MIN_HEIGHT = 24;
    static #LISTENERS = new Map();
    static {
        ["click", "mouseleave", "mouseup", "mousemove"].forEach((event) => {
            const listeners = new Map();
            BaseWindow.#LISTENERS.set(event, listeners);
            document.addEventListener(event, (e) => listeners.forEach((l) => l(e)));
        });
    }
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
        this.#container.style.zIndex = String(BaseWindow.#zIndexCounter++);
        ["mousedown", "touchstart", "pointerdown", "focusin", "click"].forEach((evt) => {
            this.#container.addEventListener(evt, () => this.bringToFront());
        });
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
        BaseWindow.#LISTENERS.get("click").set(this, reset);
        BaseWindow.#LISTENERS.get("mouseup").set(this, reset);
        BaseWindow.#LISTENERS.get("mouseleave").set(this, reset);
        BaseWindow.#LISTENERS.get("mousemove").set(this, (e) => this.#drag(e));
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
    bringToFront() {
        BaseWindow.#zIndexCounter++;
        this.#container.style.zIndex = String(BaseWindow.#zIndexCounter);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDckIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUM3QixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1NBQ2hDLENBQUM7SUFDTixDQUFDO0lBRUQsWUFBWTtRQUNSLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQsSUFBSSxDQUFDLENBQUMsQ0FBUztRQUNYLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztJQUMxQyxDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQsSUFBSSxDQUFDLENBQUMsQ0FBUztRQUNYLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztJQUN6QyxDQUFDO0lBRUQsSUFBSSxRQUFRO1FBQ1IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLFFBQVEsQ0FBQyxHQUFZ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QTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7Ozs7Ozs7Ozs7O0FDTjBDO0FBQ047QUFFcEMsSUFBSSxtREFBVSxDQUFDLElBQUksNkNBQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLDZDQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ2xILEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO0lBQ3JELE9BQU8sRUFBRSxJQUFJO0lBQ2IsU0FBUyxFQUFFLElBQUk7SUFDZixPQUFPLEVBQUUsa0NBQWtDO0NBQzlDLENBQUMsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2NhbnZhc2tpbGwvLi9zcmMvQmFzZVdpbmRvdy50cyIsIndlYnBhY2s6Ly9jYW52YXNraWxsLy4vc3JjL1ZlY3RvcjIudHMiLCJ3ZWJwYWNrOi8vY2FudmFza2lsbC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jYW52YXNraWxsL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9jYW52YXNraWxsL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vY2FudmFza2lsbC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2NhbnZhc2tpbGwvLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVmVjdG9yMiB9IGZyb20gXCIuL1ZlY3RvcjJcIjtcclxuXHJcbmludGVyZmFjZSBXaW5kb3dPcHRpb25zIHtcclxuICAgIGJhcj86IHtcclxuICAgICAgICBpY29uPzogc3RyaW5nIHwgSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgdGl0bGU/OiBzdHJpbmc7XHJcbiAgICAgICAgY2xvc2U/OiBib29sZWFuO1xyXG4gICAgfTtcclxuICAgIHJlc2l6YWJsZT86IGJvb2xlYW47XHJcbiAgICBtb3ZhYmxlPzogYm9vbGVhbjtcclxuICAgIGNvbnRlbnQ/OiBzdHJpbmcgfCBIVE1MRWxlbWVudDtcclxufVxyXG5cclxuaW50ZXJmYWNlIERyYWdTdGF0ZSB7XHJcbiAgICB0aXRsZTogYm9vbGVhbjtcclxuICAgIHI6IGJvb2xlYW47XHJcbiAgICBsOiBib29sZWFuO1xyXG4gICAgdDogYm9vbGVhbjtcclxuICAgIGI6IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBMYXN0UG9zaXRpb24ge1xyXG4gICAgdGl0bGU6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfTtcclxuICAgIGw6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IGw6IG51bWJlcjsgdzogbnVtYmVyIH07XHJcbiAgICB0OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB0OiBudW1iZXI7IGg6IG51bWJlciB9O1xyXG59XHJcblxyXG5jbGFzcyBCYXNlV2luZG93IHtcclxuICAgIHN0YXRpYyBpbnN0YW5jZXM6IEJhc2VXaW5kb3dbXSA9IFtdO1xyXG4gICAgc3RhdGljICN6SW5kZXhDb3VudGVyID0gMTtcclxuICAgIHN0YXRpYyByZWFkb25seSBXSU5ET1dfTUlOX1dJRFRIID0gMTkyO1xyXG4gICAgc3RhdGljIHJlYWRvbmx5IFdJTkRPV19NSU5fSEVJR0hUID0gMjQ7XHJcblxyXG4gICAgc3RhdGljIHJlYWRvbmx5ICNMSVNURU5FUlMgPSBuZXcgTWFwPGtleW9mIERvY3VtZW50RXZlbnRNYXAsIE1hcDxCYXNlV2luZG93LCBFdmVudExpc3RlbmVyPj4oKTtcclxuXHJcbiAgICBzdGF0aWMge1xyXG4gICAgICAgIFtcImNsaWNrXCIsIFwibW91c2VsZWF2ZVwiLCBcIm1vdXNldXBcIiwgXCJtb3VzZW1vdmVcIl0uZm9yRWFjaCgoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gbmV3IE1hcDxCYXNlV2luZG93LCBFdmVudExpc3RlbmVyPigpO1xyXG5cclxuICAgICAgICAgICAgQmFzZVdpbmRvdy4jTElTVEVORVJTLnNldChldmVudCBhcyBrZXlvZiBEb2N1bWVudEV2ZW50TWFwLCBsaXN0ZW5lcnMpO1xyXG5cclxuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgKGUpID0+IGxpc3RlbmVycy5mb3JFYWNoKChsKSA9PiBsKGUpKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgI3Bvc2l0aW9uITogVmVjdG9yMjtcclxuICAgICNkaW1lbnNpb25zITogVmVjdG9yMjtcclxuICAgICNoaWRkZW4hOiBib29sZWFuO1xyXG4gICAgI2NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgI2lzRHJhZ2dpbmc6IERyYWdTdGF0ZSA9IHsgdGl0bGU6IGZhbHNlLCByOiBmYWxzZSwgbDogZmFsc2UsIHQ6IGZhbHNlLCBiOiBmYWxzZSB9O1xyXG5cclxuICAgICNsYXN0OiBMYXN0UG9zaXRpb24gPSB7XHJcbiAgICAgICAgdGl0bGU6IHsgeDogMCwgeTogMCB9LFxyXG4gICAgICAgIGw6IHsgeDogMCwgeTogMCwgbDogMCwgdzogMCB9LFxyXG4gICAgICAgIHQ6IHsgeDogMCwgeTogMCwgdDogMCwgaDogMCB9LFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbjogVmVjdG9yMiwgZGltZW5zaW9uczogVmVjdG9yMiwgb3B0aW9uczogV2luZG93T3B0aW9ucyA9IHt9KSB7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyID0gaHRtbDxIVE1MRWxlbWVudD5gXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3aW5kb3dcIj5cclxuICAgICAgICAgICAgICAgIDxhcnRpY2xlIGNsYXNzPVwid2luZG93LWNvbnRhaW5lclwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3M9XCJ3aW5kb3ctaGVhZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwid2luZG93LWljb25cIj48L2k+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoNCBjbGFzcz1cIndpbmRvdy10aXRsZVwiPjwvaDQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ3aW5kb3ctY2xvc2VcIj48L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICA8bWFpbiBjbGFzcz1cIndpbmRvdy1jb250ZW50XCI+PC9tYWluPlxyXG4gICAgICAgICAgICAgICAgPC9hcnRpY2xlPlxyXG4gICAgICAgICAgICAgICAgJHtbXCJyXCIsIFwibFwiLCBcInRcIiwgXCJiXCIsIFwidHJcIiwgXCJ0bFwiLCBcImJyXCIsIFwiYmxcIl0ubWFwKChkKSA9PiBgPGRpdiBjbGFzcz1cInRyaWdnZXIgJHtkfVwiPjwvZGl2PmApLmpvaW4oXCJcIil9XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIGA7XHJcblxyXG4gICAgICAgIHRoaXMuI3NldHVwQmFyKG9wdGlvbnMuYmFyKTtcclxuICAgICAgICB0aGlzLiNzZXR1cENvbnRlbnQob3B0aW9ucy5jb250ZW50ID8/IFwiXCIpO1xyXG4gICAgICAgIHRoaXMuI3NldHVwTW92ZW1lbnQob3B0aW9ucy5tb3ZhYmxlID8/IGZhbHNlKTtcclxuICAgICAgICB0aGlzLiNzZXR1cFJlc2l6ZShvcHRpb25zLnJlc2l6YWJsZSA/PyBmYWxzZSk7XHJcblxyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgICAgICB0aGlzLmRpbWVuc2lvbnMgPSBkaW1lbnNpb25zO1xyXG4gICAgICAgIHRoaXMuaGlkZGVuID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS56SW5kZXggPSBTdHJpbmcoQmFzZVdpbmRvdy4jekluZGV4Q291bnRlcisrKTtcclxuICAgICAgICBbXCJtb3VzZWRvd25cIiwgXCJ0b3VjaHN0YXJ0XCIsIFwicG9pbnRlcmRvd25cIiwgXCJmb2N1c2luXCIsIFwiY2xpY2tcIl0uZm9yRWFjaCgoZXZ0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuI2NvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKGV2dCwgKCkgPT4gdGhpcy5icmluZ1RvRnJvbnQoKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy4jY29udGFpbmVyKTtcclxuICAgICAgICBCYXNlV2luZG93Lmluc3RhbmNlcy5wdXNoKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgICNzZXR1cEJhcihiYXI/OiB7IGljb24/OiBzdHJpbmcgfCBIVE1MRWxlbWVudDsgdGl0bGU/OiBzdHJpbmc7IGNsb3NlPzogYm9vbGVhbiB9KSB7XHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gdGhpcy4jcXMoXCIud2luZG93LWhlYWRlclwiKSE7XHJcblxyXG4gICAgICAgIGlmICghYmFyKSByZXR1cm4gaGVhZGVyLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uRWwgPSB0aGlzLiNxcyhcIi53aW5kb3ctaWNvblwiKSE7XHJcbiAgICAgICAgY29uc3QgdGl0bGVFbCA9IHRoaXMuI3FzPEhUTUxIZWFkaW5nRWxlbWVudD4oXCIud2luZG93LXRpdGxlXCIpITtcclxuICAgICAgICBjb25zdCBjbG9zZUJ0biA9IHRoaXMuI3FzPEhUTUxCdXR0b25FbGVtZW50PihcIi53aW5kb3ctY2xvc2VcIikhO1xyXG5cclxuICAgICAgICBpZiAoYmFyLmljb24pIGljb25FbC5hcHBlbmQoYmFyLmljb24gaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IGJhci5pY29uIDogYmFyLmljb24udG9TdHJpbmcoKSk7XHJcbiAgICAgICAgaWYgKGJhci50aXRsZSkgdGl0bGVFbC50ZXh0Q29udGVudCA9IGJhci50aXRsZTtcclxuXHJcbiAgICAgICAgaWYgKGJhci5jbG9zZSkge1xyXG4gICAgICAgICAgICBjbG9zZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jbG9zZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjbG9zZUJ0bi5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgI3NldHVwQ29udGVudChjb250ZW50OiBzdHJpbmcgfCBIVE1MRWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuI3FzKFwiLndpbmRvdy1jb250ZW50XCIpIS5hcHBlbmQoY29udGVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ID8gY29udGVudCA6IGNvbnRlbnQudG9TdHJpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgI3NldHVwTW92ZW1lbnQobW92YWJsZTogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICghbW92YWJsZSkgcmV0dXJuIHRoaXMuI3FzKFwiLndpbmRvdy10aXRsZVwiKT8uY2xhc3NMaXN0LmFkZChcIm5vLW1vdmVcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc2V0ID0gdGhpcy4jcmVzZXREcmFnZ2luZy5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICBCYXNlV2luZG93LiNMSVNURU5FUlMuZ2V0KFwiY2xpY2tcIikhLnNldCh0aGlzLCByZXNldCk7XHJcbiAgICAgICAgQmFzZVdpbmRvdy4jTElTVEVORVJTLmdldChcIm1vdXNldXBcIikhLnNldCh0aGlzLCByZXNldCk7XHJcbiAgICAgICAgQmFzZVdpbmRvdy4jTElTVEVORVJTLmdldChcIm1vdXNlbGVhdmVcIikhLnNldCh0aGlzLCByZXNldCk7XHJcbiAgICAgICAgQmFzZVdpbmRvdy4jTElTVEVORVJTLmdldChcIm1vdXNlbW92ZVwiKSEuc2V0KHRoaXMsIChlKSA9PiB0aGlzLiNkcmFnKGUgYXMgTW91c2VFdmVudCkpO1xyXG5cclxuICAgICAgICB0aGlzLiNxcyhcIi53aW5kb3ctdGl0bGVcIik/LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKCkgPT4gKHRoaXMuI2lzRHJhZ2dpbmcudGl0bGUgPSB0cnVlKSk7XHJcbiAgICAgICAgdGhpcy4jcXMoXCIud2luZG93LXRpdGxlXCIpPy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuI2lzRHJhZ2dpbmcudGl0bGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy4jbGFzdC50aXRsZSA9IHsgeDogMCwgeTogMCB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICNzZXR1cFJlc2l6ZShyZXNpemFibGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAoIXJlc2l6YWJsZSkgcmV0dXJuIHRoaXMuI2FsbChcIi50cmlnZ2VyXCIpLmZvckVhY2goKGVsKSA9PiBlbC5yZW1vdmUoKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJpbmQgPSAoc2VsOiBzdHJpbmcsIGZsYWdzOiAoa2V5b2YgRHJhZ1N0YXRlKVtdKSA9PlxyXG4gICAgICAgICAgICB0aGlzLiNxcyhzZWwpIS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZsYWdzLmZvckVhY2goKGYpID0+ICh0aGlzLiNpc0RyYWdnaW5nW2ZdID0gdHJ1ZSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLnJcIiwgW1wiclwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLmxcIiwgW1wibFwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLnRcIiwgW1widFwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLmJcIiwgW1wiYlwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLnRyXCIsIFtcInRcIiwgXCJyXCJdKTtcclxuICAgICAgICBiaW5kKFwiLnRyaWdnZXIudGxcIiwgW1widFwiLCBcImxcIl0pO1xyXG4gICAgICAgIGJpbmQoXCIudHJpZ2dlci5iclwiLCBbXCJiXCIsIFwiclwiXSk7XHJcbiAgICAgICAgYmluZChcIi50cmlnZ2VyLmJsXCIsIFtcImJcIiwgXCJsXCJdKTtcclxuICAgIH1cclxuXHJcbiAgICAjZHJhZyhlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuI2lzRHJhZ2dpbmcudGl0bGUpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLiNsYXN0LnRpdGxlLnggfHwgIXRoaXMuI2xhc3QudGl0bGUueSkgdGhpcy4jbGFzdC50aXRsZSA9IHsgeDogZS5jbGllbnRYLCB5OiBlLmNsaWVudFkgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHsgdG9wLCBsZWZ0IH0gPSB0aGlzLiNjb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gTWF0aC5tYXgobGVmdCArIGUuY2xpZW50WCAtIHRoaXMuI2xhc3QudGl0bGUueCwgMCkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS50b3AgPSBNYXRoLm1heCh0b3AgKyBlLmNsaWVudFkgLSB0aGlzLiNsYXN0LnRpdGxlLnksIDApICsgXCJweFwiO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4jbGFzdC50aXRsZSA9IHsgeDogZS5jbGllbnRYLCB5OiBlLmNsaWVudFkgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLiNjb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB0aGlzLiNjb250YWluZXIuc3R5bGU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLiNpc0RyYWdnaW5nLnIpIHN0eWxlLndpZHRoID0gZS5jbGllbnRYIC0gcmVjdC5sZWZ0ICsgXCJweFwiO1xyXG5cclxuICAgICAgICBpZiAodGhpcy4jaXNEcmFnZ2luZy5iKSBzdHlsZS5oZWlnaHQgPSBlLmNsaWVudFkgLSByZWN0LnRvcCArIFwicHhcIjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuI2lzRHJhZ2dpbmcubCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuI2xhc3QubC54KVxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLiNsYXN0LmwsIHtcclxuICAgICAgICAgICAgICAgICAgICB4OiBlLmNsaWVudFgsXHJcbiAgICAgICAgICAgICAgICAgICAgeTogZS5jbGllbnRZLFxyXG4gICAgICAgICAgICAgICAgICAgIGw6IHJlY3QubGVmdCxcclxuICAgICAgICAgICAgICAgICAgICB3OiBwYXJzZUludCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLiNjb250YWluZXIpLndpZHRoKSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbCA9IE1hdGgubWF4KHJlY3QubGVmdCArIGUuY2xpZW50WCAtIHRoaXMuI2xhc3QubC54LCAwKTtcclxuICAgICAgICAgICAgY29uc3QgdyA9IE1hdGgubWF4KHRoaXMuI2xhc3QubC5sICsgdGhpcy4jbGFzdC5sLncgLSBsLCBCYXNlV2luZG93LldJTkRPV19NSU5fV0lEVEgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGwgPCBsICsgdyAtIEJhc2VXaW5kb3cuV0lORE9XX01JTl9XSURUSCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4jbGFzdC5sLnggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiNsYXN0LmwueSA9IGUuY2xpZW50WTtcclxuICAgICAgICAgICAgICAgIHN0eWxlLmxlZnQgPSBsICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgc3R5bGUud2lkdGggPSB3ICsgXCJweFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy4jaXNEcmFnZ2luZy50KSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy4jbGFzdC50LngpXHJcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuI2xhc3QudCwge1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IGUuY2xpZW50WCxcclxuICAgICAgICAgICAgICAgICAgICB5OiBlLmNsaWVudFksXHJcbiAgICAgICAgICAgICAgICAgICAgdDogcmVjdC50b3AsXHJcbiAgICAgICAgICAgICAgICAgICAgaDogcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy4jY29udGFpbmVyKS5oZWlnaHQpLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0ID0gTWF0aC5tYXgocmVjdC50b3AgKyBlLmNsaWVudFkgLSB0aGlzLiNsYXN0LnQueSwgMCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGggPSBNYXRoLm1heCh0aGlzLiNsYXN0LnQudCArIHRoaXMuI2xhc3QudC5oIC0gdCwgQmFzZVdpbmRvdy5XSU5ET1dfTUlOX0hFSUdIVCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodCA8IHQgKyBoIC0gQmFzZVdpbmRvdy5XSU5ET1dfTUlOX0hFSUdIVCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4jbGFzdC50LnggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiNsYXN0LnQueSA9IGUuY2xpZW50WTtcclxuICAgICAgICAgICAgICAgIHN0eWxlLnRvcCA9IHQgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICBzdHlsZS5oZWlnaHQgPSBoICsgXCJweFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgICNyZXNldERyYWdnaW5nKCkge1xyXG4gICAgICAgIHRoaXMuI2lzRHJhZ2dpbmcgPSB7IHRpdGxlOiBmYWxzZSwgcjogZmFsc2UsIGw6IGZhbHNlLCB0OiBmYWxzZSwgYjogZmFsc2UgfTtcclxuICAgICAgICB0aGlzLiNsYXN0ID0ge1xyXG4gICAgICAgICAgICB0aXRsZTogeyB4OiAwLCB5OiAwIH0sXHJcbiAgICAgICAgICAgIGw6IHsgeDogMCwgeTogMCwgbDogMCwgdzogMCB9LFxyXG4gICAgICAgICAgICB0OiB7IHg6IDAsIHk6IDAsIHQ6IDAsIGg6IDAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGJyaW5nVG9Gcm9udCgpIHtcclxuICAgICAgICBCYXNlV2luZG93LiN6SW5kZXhDb3VudGVyKys7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyLnN0eWxlLnpJbmRleCA9IFN0cmluZyhCYXNlV2luZG93LiN6SW5kZXhDb3VudGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jcG9zaXRpb24ueDtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgeCh4OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLiNwb3NpdGlvbi54ID0geDtcclxuICAgICAgICB0aGlzLiNjb250YWluZXIuc3R5bGUubGVmdCA9IGAke3h9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB5KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiNwb3NpdGlvbi55O1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB5KHk6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI3Bvc2l0aW9uLnkgPSB5O1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS50b3AgPSBgJHt5fXB4YDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgcG9zaXRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI3Bvc2l0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBwb3NpdGlvbihwb3M6IFZlY3RvcjIpIHtcclxuICAgICAgICB0aGlzLiNwb3NpdGlvbiA9IHBvcztcclxuICAgICAgICB0aGlzLiNjb250YWluZXIuc3R5bGUubGVmdCA9IGAke3Bvcy54fXB4YDtcclxuICAgICAgICB0aGlzLiNjb250YWluZXIuc3R5bGUudG9wID0gYCR7cG9zLnl9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB3aWR0aCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jZGltZW5zaW9ucy54O1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB3aWR0aCh3OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLiNkaW1lbnNpb25zLnggPSB3O1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS53aWR0aCA9IGAke3d9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBoZWlnaHQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RpbWVuc2lvbnMueTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgaGVpZ2h0KGg6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI2RpbWVuc2lvbnMueSA9IGg7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGAke2h9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBkaW1lbnNpb25zKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiNkaW1lbnNpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBkaW1lbnNpb25zKGQ6IFZlY3RvcjIpIHtcclxuICAgICAgICB0aGlzLiNkaW1lbnNpb25zID0gZDtcclxuICAgICAgICB0aGlzLiNjb250YWluZXIuc3R5bGUud2lkdGggPSBgJHtkLnh9cHhgO1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBgJHtkLnl9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBoaWRkZW4oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2hpZGRlbjtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgaGlkZGVuKGhpZGRlbjogYm9vbGVhbikge1xyXG4gICAgICAgIHRoaXMuI2hpZGRlbiA9IGhpZGRlbjtcclxuICAgICAgICB0aGlzLiNjb250YWluZXIuY2xhc3NMaXN0LnRvZ2dsZShcInNob3ctd2luZG93XCIsICFoaWRkZW4pO1xyXG4gICAgICAgIHRoaXMuI2NvbnRhaW5lci5jbGFzc0xpc3QudG9nZ2xlKFwiaGlkZS13aW5kb3dcIiwgaGlkZGVuKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb250YWluZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2NvbnRhaW5lcjtcclxuICAgIH1cclxuXHJcbiAgICBjbG9zZSgpIHtcclxuICAgICAgICB0aGlzLmhpZGRlbiA9IHRydWU7XHJcbiAgICAgICAgdGhpcy4jZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuICAgICNkZXN0cm95KCkge1xyXG4gICAgICAgIEJhc2VXaW5kb3cuaW5zdGFuY2VzID0gQmFzZVdpbmRvdy5pbnN0YW5jZXMuZmlsdGVyKCh3KSA9PiB3ICE9PSB0aGlzKTtcclxuICAgICAgICB0aGlzLiNjb250YWluZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy4jY29udGFpbmVyLnJlcGxhY2VDaGlsZHJlbigpO1xyXG4gICAgICAgICh0aGlzIGFzIGFueSkuI2NvbnRhaW5lciA9IG51bGw7XHJcbiAgICAgICAgKHRoaXMgYXMgYW55KS4jcG9zaXRpb24gPSBudWxsO1xyXG4gICAgICAgICh0aGlzIGFzIGFueSkuI2RpbWVuc2lvbnMgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgICNxczxUIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWw6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiNjb250YWluZXIucXVlcnlTZWxlY3RvcjxUPihzZWwpO1xyXG4gICAgfVxyXG5cclxuICAgICNhbGw8VCBleHRlbmRzIEVsZW1lbnQgPSBIVE1MRWxlbWVudD4oc2VsOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGw8VD4oc2VsKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaHRtbDxUPihzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4udmFsdWVzOiBhbnlbXSk6IFQge1xyXG4gICAgcmV0dXJuIG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoU3RyaW5nLnJhdyh7IHJhdzogc3RyaW5ncyB9LCAuLi52YWx1ZXMpLCBcInRleHQvaHRtbFwiKS5ib2R5LmZpcnN0Q2hpbGQgYXMgVDtcclxufVxyXG5cclxuZXhwb3J0IHsgQmFzZVdpbmRvdywgaHRtbCwgV2luZG93T3B0aW9ucyB9O1xyXG4iLCJleHBvcnQgY2xhc3MgVmVjdG9yMiB7XHJcbiAgICBzdGF0aWMgT1JERVIgPSAyO1xyXG5cclxuICAgICNjb29yZHM6IFtudW1iZXIsIG51bWJlcl07XHJcblxyXG4gICAgY29uc3RydWN0b3IoeD86IG51bWJlciwgeT86IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuI2Nvb3JkcyA9IFt4ID8/IDAsIHkgPz8gMF07XHJcbiAgICB9XHJcblxyXG4gICAgKltTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8bnVtYmVyPiB7XHJcbiAgICAgICAgeWllbGQqIHRoaXMuI2Nvb3JkcztcclxuICAgIH1cclxuXHJcbiAgICBhZGQodjogVmVjdG9yMik6IFZlY3RvcjI7XHJcbiAgICBhZGQoeDogbnVtYmVyLCB5PzogbnVtYmVyKTogVmVjdG9yMjtcclxuICAgIGFkZCh4OiBWZWN0b3IyIHwgbnVtYmVyLCB5PzogbnVtYmVyKTogVmVjdG9yMiB7XHJcbiAgICAgICAgaWYgKFZlY3RvcjIuaXNWZWN0b3IyKHgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMueCArPSB4Lng7XHJcbiAgICAgICAgICAgIHRoaXMueSArPSB4Lnk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy54ICs9IHg7XHJcbiAgICAgICAgICAgIHRoaXMueSArPSB5ID8/IHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHN1YnRyYWN0KHY6IFZlY3RvcjIpOiBWZWN0b3IyO1xyXG4gICAgc3VidHJhY3QoeDogbnVtYmVyLCB5PzogbnVtYmVyKTogVmVjdG9yMjtcclxuICAgIHN1YnRyYWN0KHg6IFZlY3RvcjIgfCBudW1iZXIsIHk/OiBudW1iZXIpOiBWZWN0b3IyIHtcclxuICAgICAgICBpZiAoVmVjdG9yMi5pc1ZlY3RvcjIoeCkpIHtcclxuICAgICAgICAgICAgdGhpcy54IC09IHgueDtcclxuICAgICAgICAgICAgdGhpcy55IC09IHgueTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnggLT0geDtcclxuICAgICAgICAgICAgdGhpcy55IC09IHkgPz8geDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgbXVsdGlwbHkodjogVmVjdG9yMik6IFZlY3RvcjI7XHJcbiAgICBtdWx0aXBseSh4OiBudW1iZXIsIHk/OiBudW1iZXIpOiBWZWN0b3IyO1xyXG4gICAgbXVsdGlwbHkoeDogVmVjdG9yMiB8IG51bWJlciwgeT86IG51bWJlcik6IFZlY3RvcjIge1xyXG4gICAgICAgIGlmIChWZWN0b3IyLmlzVmVjdG9yMih4KSkge1xyXG4gICAgICAgICAgICB0aGlzLnggKj0geC54O1xyXG4gICAgICAgICAgICB0aGlzLnkgKj0geC55O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMueCAqPSB4O1xyXG4gICAgICAgICAgICB0aGlzLnkgKj0geSA/PyB4O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBkaXZpZGUodjogVmVjdG9yMik6IFZlY3RvcjI7XHJcbiAgICBkaXZpZGUoeDogbnVtYmVyLCB5PzogbnVtYmVyKTogVmVjdG9yMjtcclxuICAgIGRpdmlkZSh4OiBWZWN0b3IyIHwgbnVtYmVyLCB5PzogbnVtYmVyKTogVmVjdG9yMiB7XHJcbiAgICAgICAgaWYgKFZlY3RvcjIuaXNWZWN0b3IyKHgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMueCAvPSB4Lng7XHJcbiAgICAgICAgICAgIHRoaXMueSAvPSB4Lnk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy54IC89IHg7XHJcbiAgICAgICAgICAgIHRoaXMueSAvPSB5ID8/IHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIG5lZ2F0ZSgpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tdWx0aXBseSgtMSk7XHJcbiAgICB9XHJcblxyXG4gICAgYW5nbGVUbyh2ZWN0b3I6IFZlY3RvcjIpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmFjb3MoKHRoaXMuZG90KHZlY3RvcikgLyB0aGlzLm1hZ25pdHVkZSkgKiB2ZWN0b3IubWFnbml0dWRlKTtcclxuICAgIH1cclxuXHJcbiAgICBkb3QodmVjdG9yOiBWZWN0b3IyKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54ICogdmVjdG9yLnggKyB0aGlzLnkgKiB2ZWN0b3IueTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbWluKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgubWluKC4uLnRoaXMuI2Nvb3Jkcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG1heCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiBNYXRoLm1heCguLi50aGlzLiNjb29yZHMpO1xyXG4gICAgfVxyXG5cclxuICAgIG5vcm1hbGl6ZSgpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kaXZpZGUodGhpcy5tYWduaXR1ZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGVxdWFscyh2ZWN0b3I6IFZlY3RvcjIpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdmVjdG9yLnggPT09IHRoaXMueCAmJiB2ZWN0b3IueSA9PT0gdGhpcy55O1xyXG4gICAgfVxyXG5cclxuICAgIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIGBWZWN0b3IyICgke3RoaXMuI2Nvb3Jkcy5qb2luKFwiLCBcIil9KWA7XHJcbiAgICB9XHJcblxyXG4gICAgY2xvbmUoKTogVmVjdG9yMiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKC4uLnRoaXMuI2Nvb3Jkcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdG9BcnJheSgpOiBbbnVtYmVyLCBudW1iZXJdIHtcclxuICAgICAgICByZXR1cm4gWy4uLnRoaXMuI2Nvb3Jkc107XHJcbiAgICB9XHJcblxyXG4gICAgdG9Qb2ludCgpOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0ge1xyXG4gICAgICAgIGNvbnN0IHsgeCwgeSB9ID0gdGhpcztcclxuICAgICAgICByZXR1cm4geyB4LCB5IH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG1hZ25pdHVkZSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFnbml0dWRlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB4KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2Nvb3Jkc1swXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgeCh2OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLiNjb29yZHNbMF0gPSB2O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB5KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2Nvb3Jkc1sxXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgeSh2OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLiNjb29yZHNbMV0gPSB2O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCAwKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2Nvb3Jkc1swXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgMCh2OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLiNjb29yZHNbMF0gPSB2O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCAxKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuI2Nvb3Jkc1sxXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgMSh2OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLiNjb29yZHNbMV0gPSB2O1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXQgemVybygpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoMCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBvcmlnaW4oKTogVmVjdG9yMiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKDAsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXQgdXAoKTogVmVjdG9yMiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKDAsIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXQgZG93bigpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoMCwgLTEpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXQgbGVmdCgpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoLTEsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXQgcmlnaHQoKTogVmVjdG9yMiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKDEsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBsZXJwKGE6IFZlY3RvcjIsIGI6IFZlY3RvcjIsIHQ6IG51bWJlcik6IFZlY3RvcjIge1xyXG4gICAgICAgIGlmICh0IDwgMCB8fCB0ID4gMSkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJ0IGluIGxlcnAoYSwgYiwgdCkgaXMgYmV0d2VlbiAwIGFuZCAxIGluY2x1c2l2ZVwiKTtcclxuXHJcbiAgICAgICAgY29uc3QgbGVycCA9IChhOiBudW1iZXIsIGI6IG51bWJlciwgdDogbnVtYmVyKSA9PiAoMSAtIHQpICogYSArIHQgKiBiO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIobGVycChhLngsIGIueCwgdCksIGxlcnAoYS55LCBiLnksIHQpKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkKGE6IFZlY3RvcjIsIGI6IFZlY3RvcjIpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gYS5jbG9uZSgpLmFkZChiKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgc3VidHJhY3QoYTogVmVjdG9yMiwgYjogVmVjdG9yMik6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiBhLmNsb25lKCkuc3VidHJhY3QoYik7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIG11bHRpcGx5KGE6IFZlY3RvcjIsIGI6IFZlY3RvcjIpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gYS5jbG9uZSgpLm11bHRpcGx5KGIpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBkaXZpZGUoYTogVmVjdG9yMiwgYjogVmVjdG9yMik6IFZlY3RvcjIge1xyXG4gICAgICAgIHJldHVybiBhLmNsb25lKCkuZGl2aWRlKGIpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBuZWdhdGUodmVjdG9yOiBWZWN0b3IyKTogVmVjdG9yMiB7XHJcbiAgICAgICAgcmV0dXJuIHZlY3Rvci5jbG9uZSgpLm5lZ2F0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhbmdsZVRvKGE6IFZlY3RvcjIsIGI6IFZlY3RvcjIpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiBhLmFuZ2xlVG8oYik7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIG5vcm1hbGl6ZSh2ZWN0b3I6IFZlY3RvcjIpOiBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gdmVjdG9yLmNsb25lKCkubm9ybWFsaXplKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGlzVmVjdG9yMih2OiB1bmtub3duKTogdiBpcyBWZWN0b3IyIHtcclxuICAgICAgICByZXR1cm4gdiBpbnN0YW5jZW9mIFZlY3RvcjI7XHJcbiAgICB9XHJcbn1cclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBCYXNlV2luZG93IH0gZnJvbSBcIi4vQmFzZVdpbmRvd1wiO1xyXG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSBcIi4vVmVjdG9yMlwiO1xyXG5cclxubmV3IEJhc2VXaW5kb3cobmV3IFZlY3RvcjIod2luZG93LmlubmVyV2lkdGggLyAyIC0gMzAwIC8gMiwgd2luZG93LmlubmVySGVpZ2h0IC8gMiAtIDIwMCAvIDIpLCBuZXcgVmVjdG9yMigzMDAsIDIwMCksIHtcclxuICAgIGJhcjogeyBpY29uOiBcIvCfjJ9cIiwgdGl0bGU6IFwiY2FudmFza2lsbFwiLCBjbG9zZTogdHJ1ZSB9LFxyXG4gICAgbW92YWJsZTogdHJ1ZSxcclxuICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgIGNvbnRlbnQ6IFwiVGhpcyBpcyBhIHNpbXBsZSB3aW5kb3cgZXhhbXBsZS5cIixcclxufSk7XHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==