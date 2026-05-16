import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { clearStoredToken, getStoredToken, setStoredToken } from "../services/api";
import {
    login as loginRequest,
    logout as logoutRequest,
    me as fetchMe,
    register as registerRequest,
    updateProfile as updateProfileRequest,
} from "../services/authApi";
import { activateStudio as activateStudioRequest } from "../services/studioApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(getStoredToken());
    const [loading, setLoading] = useState(Boolean(getStoredToken()));

    useEffect(() => {
        let ignore = false;

        async function bootstrapAuth() {
            if (!getStoredToken()) {
                setLoading(false);
                return;
            }

            try {
                const authenticatedUser = await fetchMe();

                if (!ignore) {
                    setUser(authenticatedUser);
                    setToken(getStoredToken());
                }
            } catch (_error) {
                clearStoredToken();
                if (!ignore) {
                    setUser(null);
                    setToken(null);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        bootstrapAuth();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        function handleTokenCleared() {
            setUser(null);
            setToken(null);
            setLoading(false);
        }

        window.addEventListener("nusatales:auth-token-cleared", handleTokenCleared);

        return () => {
            window.removeEventListener("nusatales:auth-token-cleared", handleTokenCleared);
        };
    }, []);

    const setAuthenticatedUser = (nextUser, nextToken = getStoredToken()) => {
        setUser(nextUser);
        setToken(nextToken);
    };

    const channel = user?.channel ?? null;
    const hasChannel = Boolean(channel);
    const isAuthenticated = Boolean(token && user);

    async function refreshUser() {
        if (!getStoredToken()) {
            clearStoredToken();
            setUser(null);
            setToken(null);

            return null;
        }

        try {
            const authenticatedUser = await fetchMe();
            setUser(authenticatedUser);
            setToken(getStoredToken());

            return authenticatedUser;
        } catch (error) {
            clearStoredToken();
            setUser(null);
            setToken(null);

            throw error;
        }
    }

    async function loadUserWithChannel(fallbackUser) {
        try {
            return await fetchMe();
        } catch (_error) {
            return fallbackUser ?? null;
        }
    }

    const value = {
        user,
        token,
        loading,
        isLoading: loading,
        channel,
        hasChannel,
        canUpload: isAuthenticated && hasChannel,
        isAdmin: user?.role === "admin",
        isAuthenticated,
        async login(email, password) {
            const result = await loginRequest({ email, password });
            const nextToken = result.token ?? getStoredToken();

            if (nextToken) {
                setStoredToken(nextToken);
            }

            const nextUser = await loadUserWithChannel(result.user);
            setAuthenticatedUser(nextUser, nextToken);

            return { ...result, user: nextUser };
        },
        async register(payload) {
            const result = await registerRequest({
                name: payload?.name,
                email: payload?.email,
                password: payload?.password,
                password_confirmation: payload?.password_confirmation ?? payload?.passwordConfirm,
            });
            const nextToken = result.token ?? getStoredToken();

            if (nextToken) {
                setStoredToken(nextToken);
            }

            const nextUser = await loadUserWithChannel(result.user);
            setAuthenticatedUser(nextUser, nextToken);

            return { ...result, user: nextUser };
        },
        refreshUser,
        async updateProfile(payload) {
            const updatedUser = await updateProfileRequest(payload);
            setUser(updatedUser);
            setToken(getStoredToken());

            return updatedUser;
        },
        async activateStudio() {
            const response = await activateStudioRequest();
            const channel = response.data?.data?.channel ?? response.data?.channel ?? null;

            try {
                const refreshed = await refreshUser();

                return refreshed?.channel ?? channel;
            } catch (_error) {
                if (channel) {
                    setUser((current) => current ? { ...current, channel, has_channel: true } : current);
                }

                return channel;
            }
        },
        async logout() {
            await logoutRequest();
            setUser(null);
            setToken(null);
        },
        setUser: setAuthenticatedUser,
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
