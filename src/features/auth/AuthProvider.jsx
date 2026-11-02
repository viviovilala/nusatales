import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authRepository } from "./authRepository";
import { profileRepository } from "../profile/profileRepository";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadProfile = useCallback(async (userId) => {
        if (!userId) {
            setProfile(null);
            return null;
        }
        try {
            const { data } = await profileRepository.getProfile(userId);
            setProfile(data || null);
            return data;
        } catch (err) {
            console.error("[AuthProvider] Failed to fetch profile:", err);
            return null;
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user?.id) {
            return await loadProfile(user.id);
        }
        return null;
    }, [user?.id, loadProfile]);

    useEffect(() => {
        let isMounted = true;

        async function initAuth() {
            try {
                const { data } = await authRepository.getSession();
                if (!isMounted) return;

                const currentSession = data?.session || null;
                setSession(currentSession);
                const currentUser = currentSession?.user || null;
                setUser(currentUser);

                if (currentUser) {
                    await loadProfile(currentUser.id);
                }
            } catch (err) {
                console.error("[AuthProvider] Session initialization error:", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        initAuth();

        const { data: authListener } = authRepository.onAuthStateChange(
            async (_event, newSession) => {
                if (!isMounted) return;

                setSession(newSession || null);
                const newUser = newSession?.user || null;
                setUser(newUser);

                if (newUser) {
                    await loadProfile(newUser.id);
                } else {
                    setProfile(null);
                }

                setIsLoading(false);
            }
        );

        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, [loadProfile]);

    const signOut = useCallback(async () => {
        setIsLoading(true);
        try {
            await authRepository.signOut();
            setUser(null);
            setSession(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const value = {
        user,
        session,
        profile,
        isAuthenticated: Boolean(user),
        isLoading,
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
