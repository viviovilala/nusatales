import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { authRepository } from "./authRepository";
import { profileRepository } from "../profile/profileRepository";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);

    // Explicit state machines
    // authState: 'initializing' | 'anonymous' | 'authenticated' | 'error'
    const [authState, setAuthState] = useState("initializing");
    // profileState: 'idle' | 'loading' | 'ready' | 'missing' | 'error'
    const [profileState, setProfileState] = useState("idle");

    const profileRevisionRef = useRef(0);

    // Standalone profile loader with race condition protection
    const loadProfile = useCallback(async (userId) => {
        if (!userId) {
            setProfile(null);
            setProfileState("idle");
            return null;
        }

        const currentRev = ++profileRevisionRef.current;
        setProfileState("loading");

        try {
            const { data, error } = await profileRepository.getProfile(userId);
            if (currentRev !== profileRevisionRef.current) return null;

            if (error) {
                console.error("[AuthProvider] Profile fetch error:", error);
                setProfileState("error");
                return null;
            }

            if (data) {
                setProfile(data);
                setProfileState("ready");
                return data;
            } else {
                setProfile(null);
                setProfileState("missing");
                return null;
            }
        } catch (err) {
            if (currentRev === profileRevisionRef.current) {
                console.error("[AuthProvider] Unexpected profile load error:", err);
                setProfileState("error");
            }
            return null;
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user?.id) {
            return await loadProfile(user.id);
        }
        return null;
    }, [user?.id, loadProfile]);

    // 1. Synchronous Auth Listener & Initial Session Bootstrap
    useEffect(() => {
        let isMounted = true;

        async function initAuth() {
            try {
                const { data, error } = await authRepository.getSession();
                if (!isMounted) return;

                if (error) {
                    console.error("[AuthProvider] Session retrieval error:", error);
                    setAuthState("error");
                    return;
                }

                const currentSession = data?.session || null;
                const currentUser = currentSession?.user || null;

                setSession(currentSession);
                setUser(currentUser);
                setAuthState(currentUser ? "authenticated" : "anonymous");
            } catch (err) {
                if (isMounted) {
                    console.error("[AuthProvider] Auth initialization error:", err);
                    setAuthState("error");
                }
            }
        }

        initAuth();

        // Supabase Auth listener — strictly SYNCHRONOUS state updates inside callback
        const { data: authListener } = authRepository.onAuthStateChange(
            (_event, newSession) => {
                if (!isMounted) return;

                const nextUser = newSession?.user || null;
                setSession(newSession || null);
                setUser(nextUser);
                setAuthState(nextUser ? "authenticated" : "anonymous");
            }
        );

        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    // 2. Independent Effect for Profile fetching (decoupled from onAuthStateChange to prevent lockups)
    useEffect(() => {
        if (user?.id) {
            loadProfile(user.id);
        } else {
            profileRevisionRef.current++;
            setProfile(null);
            setProfileState("idle");
        }
    }, [user?.id, loadProfile]);

    const signOut = useCallback(async () => {
        try {
            await authRepository.signOut();
        } catch (err) {
            console.error("[AuthProvider] Sign out error:", err);
        } finally {
            setUser(null);
            setSession(null);
            setProfile(null);
            setAuthState("anonymous");
            setProfileState("idle");
        }
    }, []);

    const value = {
        user,
        session,
        profile,
        isAuthenticated: Boolean(user),
        isLoading: authState === "initializing",
        authState,
        profileState,
        isConfigured: isSupabaseConfigured,
        signOut,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
