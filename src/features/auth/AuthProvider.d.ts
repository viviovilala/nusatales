import type { ReactNode, JSX } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthProfile = {
    id: string;
    username: string | null;
    display_name: string | null;
    bio: string | null;
    avatar_path: string | null;
};
export type AuthContextValue = {
    user: User | null;
    session: Session | null;
    profile: AuthProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    authState: "initializing" | "anonymous" | "authenticated" | "error";
    profileState: "idle" | "loading" | "ready" | "missing" | "error";
    isConfigured: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<AuthProfile | null>;
};

// The runtime remains the existing JSX provider; this is its typed public API.
export function AuthProvider(props: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
