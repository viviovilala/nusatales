import { vi } from "vitest";

// Unit tests must never depend on (or target) the developer's live project.
vi.stubEnv("VITE_SUPABASE_URL", "https://unit-test.invalid");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "unit-test-public-key");
