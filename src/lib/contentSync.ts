import { useEffect, useRef } from "react";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const CONTENT_CHANGED = "nusatales:videos-changed";
export type ContentChange = { remote?: boolean; id?: string; status?: "draft" | "published"; deleted?: boolean; publicly_available?: boolean };
let subscriptionId = 0;

/** All consumers re-query through RLS. A realtime payload is never a feed row. */
export function startContentSync(client: typeof supabase = supabase) {
    if (typeof window === "undefined") return () => {};
    let disposed = false, revision: string | null = null, timer: ReturnType<typeof setTimeout> | null = null, polling = false;
    const schedule = () => {
        if (disposed || document.hidden || timer) return;
        timer = setTimeout(() => {
            timer = null;
            if (!disposed && !document.hidden) window.dispatchEvent(new CustomEvent<ContentChange>(CONTENT_CHANGED, { detail: { remote: true } }));
        }, 150);
    };
    function accept(value: unknown) {
        if (typeof value !== "string" && typeof value !== "number") return;
        const next = String(value);
        if (!/^\d+$/.test(next) || (revision !== null && BigInt(next) <= BigInt(revision))) return;
        const previous = revision; revision = next;
        if (previous !== null) schedule();
    }
    async function poll() {
        if (disposed || polling || document.hidden) return;
        polling = true;
        try {
            const response = await client.from("public_content_revision").select("revision").eq("id", true).abortSignal(AbortSignal.timeout(10000)).maybeSingle();
            if (!disposed && !response.error) accept(response.data?.revision);
        } catch { /* Reconnect/focus and the next poll can recover. */ }
        finally { polling = false; }
    }
    const wake = () => { if (!document.hidden) { schedule(); void poll(); } };
    // Removal waits for a server acknowledgement. A new account/StrictMode
    // mount must not reuse the old channel while it is still leaving.
    const channel = client.channel(`public-content-updates-${++subscriptionId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "public_content_revision" }, (payload) => {
            const next = (payload.new as { revision?: unknown }).revision;
            // The first event must also invalidate a list loaded before join.
            if (revision === null) schedule();
            accept(next);
        })
        .subscribe((status) => { if (!disposed && status === "SUBSCRIBED") wake(); });
    void poll();
    const interval = setInterval(() => { void poll(); }, 30000);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
        disposed = true;
        if (timer) clearTimeout(timer);
        clearInterval(interval);
        window.removeEventListener("focus", wake);
        window.removeEventListener("online", wake);
        document.removeEventListener("visibilitychange", wake);
        void client.removeChannel(channel);
    };
}

export function useContentSync(accountId: string | null) {
    useEffect(() => { if (isSupabaseConfigured) return startContentSync(); }, [accountId]);
}

export function useContentUpdates(callback: (event: CustomEvent<ContentChange>) => void) {
    const current = useRef(callback); current.current = callback;
    useEffect(() => {
        const update = (event: Event) => current.current(event as CustomEvent<ContentChange>);
        window.addEventListener(CONTENT_CHANGED, update);
        return () => window.removeEventListener(CONTENT_CHANGED, update);
    }, []);
}
