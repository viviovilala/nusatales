import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    testMatch: "**/*.pw.js",
    fullyParallel: true,
    workers: 2,
    use: { baseURL: "http://127.0.0.1:4173", reducedMotion: "reduce", headless: true },
    globalSetup: "./tests/ui-server-setup.js",
});
