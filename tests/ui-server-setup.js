import { createServer } from "vite";

// Own the preview lifecycle directly so Windows does not leave npm/cmd child
// processes running after the browser tests have completed.
export default async function setup() {
    const server = await createServer({
        // HTTP and WebSocket test fixtures must never target a developer's
        // configured Supabase project or consume real account data/events.
        define: {
            "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://fixture.supabase.co"),
            "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("fixture-public-key"),
        },
        server: { host: "127.0.0.1", port: 4173, strictPort: true },
        clearScreen: false,
    });
    await server.listen();
    return async () => { await server.close(); };
}
