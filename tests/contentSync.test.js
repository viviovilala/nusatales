import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTENT_CHANGED, startContentSync } from "../src/lib/contentSync";

function fixture() {
    vi.useFakeTimers();
    const windowTarget = new EventTarget(), documentTarget = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal("window", windowTarget); vi.stubGlobal("document", documentTarget);
    const state = { revision: 1, fail: false, received: [], change: null, status: null };
    windowTarget.addEventListener(CONTENT_CHANGED, (event) => state.received.push(event.detail));
    const channel = { on: vi.fn((type, filter, callback) => { state.change = callback; return channel; }), subscribe: vi.fn((callback) => { state.status = callback; return channel; }) };
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: { revision: state.revision }, error: state.fail ? { message: "offline" } : null })) };
    const client = { from: vi.fn(() => query), channel: vi.fn(() => channel), removeChannel: vi.fn(async () => "ok") };
    return { state, client, query, windowTarget, documentTarget, stop: startContentSync(client) };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("public content invalidation", () => {
    it("coalesces revisions, ignores stale events and exposes no row payload", async () => {
        const f = fixture(); await vi.advanceTimersByTimeAsync(0);
        f.state.status("SUBSCRIBED"); await vi.advanceTimersByTimeAsync(150); expect(f.state.received).toEqual([{ remote: true }]);
        f.state.change({ new: { revision: 2, title: "Never copied", storage_path: "private" } });
        f.state.change({ new: { revision: 3 } }); await vi.advanceTimersByTimeAsync(150); expect(f.state.received).toHaveLength(2);
        f.state.change({ new: { revision: 2 } }); f.state.change({ new: { revision: 3 } }); await vi.advanceTimersByTimeAsync(150);
        expect(f.state.received).toEqual([{ remote: true }, { remote: true }]);
        expect(f.client.channel).toHaveBeenCalledWith(expect.stringMatching(/^public-content-updates-\d+$/)); f.stop();
    });
    it("recovers via polling/focus and defers hidden-tab refresh until visible", async () => {
        const f = fixture(); await vi.advanceTimersByTimeAsync(0);
        f.state.revision = 2; await vi.advanceTimersByTimeAsync(30150); expect(f.state.received).toHaveLength(1);
        f.documentTarget.hidden = true; f.state.change({ new: { revision: 3 } }); await vi.advanceTimersByTimeAsync(150); expect(f.state.received).toHaveLength(1);
        f.documentTarget.hidden = false; f.documentTarget.dispatchEvent(new Event("visibilitychange")); await vi.advanceTimersByTimeAsync(150); expect(f.state.received).toHaveLength(2);
        f.state.fail = true; f.windowTarget.dispatchEvent(new Event("online")); await vi.advanceTimersByTimeAsync(150); expect(f.state.received).toHaveLength(3); f.stop();
    });
    it("cleans up channels, pending timers and event listeners on account changes", async () => {
        const f = fixture(); await vi.advanceTimersByTimeAsync(0); f.state.change({ new: { revision: 2 } }); f.stop();
        f.state.status("SUBSCRIBED"); f.windowTarget.dispatchEvent(new Event("focus")); await vi.advanceTimersByTimeAsync(60000);
        expect(f.state.received).toHaveLength(0); expect(f.client.removeChannel).toHaveBeenCalledOnce();
    });
    it("does not reuse a leaving channel while switching accounts", () => {
        const f = fixture(); f.client.removeChannel.mockReturnValue(new Promise(() => {}));
        f.stop(); const stop = startContentSync(f.client);
        expect(f.client.channel.mock.calls[0][0]).not.toBe(f.client.channel.mock.calls[1][0]); stop();
    });
});
