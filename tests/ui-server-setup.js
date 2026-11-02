import { createServer } from "vite";

// Own the preview lifecycle directly so Windows does not leave npm/cmd child
// processes running after the browser tests have completed.
export default async function setup() {
    const server = await createServer({
        server: { host: "127.0.0.1", port: 4173, strictPort: true },
        clearScreen: false,
    });
    await server.listen();
    return async () => { await server.close(); };
}
