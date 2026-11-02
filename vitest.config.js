import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, defineConfig({
    test: { include: ["tests/**/*.test.js"], setupFiles: ["./tests/unit-setup.js"] },
}));
