import { BaseWindow } from "./BaseWindow";
import { Vector2 } from "./Vector2";

new BaseWindow(new Vector2(window.innerWidth / 2 - 300 / 2, window.innerHeight / 2 - 200 / 2), new Vector2(300, 200), {
    bar: { icon: "🌟", title: "canvaskill", close: true },
    movable: true,
    resizable: true,
    content: "This is a simple window example.",
});
