export async function mockMediaPlayback(page) {
    // Isolate playback controls from codecs/network while keeping native video
    // nodes, currentTime and all application event handlers under test.
    await page.addInitScript(() => {
        const positions = new WeakMap();
        const paused = new WeakMap();
        Object.defineProperty(HTMLMediaElement.prototype, "currentTime", { configurable: true, get() { return positions.get(this) || 0; }, set(value) { positions.set(this, value); } });
        Object.defineProperty(HTMLMediaElement.prototype, "duration", { configurable: true, get() { return 30; } });
        Object.defineProperty(HTMLMediaElement.prototype, "paused", { configurable: true, get() { return paused.get(this) !== false; } });
        HTMLMediaElement.prototype.play = function () {
            paused.set(this, false);
            this.dataset.playing = "true";
            queueMicrotask(() => this.dispatchEvent(new Event("playing")));
            return Promise.resolve();
        };
        HTMLMediaElement.prototype.pause = function () {
            paused.set(this, true);
            this.dataset.playing = "false";
            this.dispatchEvent(new Event("pause"));
        };
        window.addEventListener("error", (event) => {
            if (event.target instanceof HTMLMediaElement && !event.testMediaError) event.stopImmediatePropagation();
        }, true);
    });
}
