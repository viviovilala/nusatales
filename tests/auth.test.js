import { describe, it, expect, vi } from "vitest";
import { authRepository } from "../src/features/auth/authRepository";
import { supabase } from "../src/lib/supabaseClient";

describe("Auth Repository & Session Handling", () => {
    it("getSession returns session data from supabase.auth", async () => {
        const mockSession = { user: { id: "user-abc", email: "kreator@nusatales.id" } };
        const getSessionSpy = vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
            data: { session: mockSession },
            error: null,
        });

        const res = await authRepository.getSession();
        expect(res.data.session).toEqual(mockSession);
        expect(res.error).toBeNull();

        getSessionSpy.mockRestore();
    });

    it("signInWithPassword passes credentials to Supabase auth client", async () => {
        const signInSpy = vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValue({
            data: { user: { id: "user-abc" }, session: {} },
            error: null,
        });

        const res = await authRepository.signInWithPassword({
            email: "kreator@nusatales.id",
            password: "rahasia_budaya",
        });

        expect(signInSpy).toHaveBeenCalledWith({
            email: "kreator@nusatales.id",
            password: "rahasia_budaya",
        });
        expect(res.error).toBeNull();

        signInSpy.mockRestore();
    });

    it("signOut clears session cleanly via Supabase auth client", async () => {
        const signOutSpy = vi.spyOn(supabase.auth, "signOut").mockResolvedValue({
            error: null,
        });

        const res = await authRepository.signOut();
        expect(signOutSpy).toHaveBeenCalled();
        expect(res.error).toBeNull();

        signOutSpy.mockRestore();
    });
});
