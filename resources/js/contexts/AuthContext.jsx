import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { clearStoredToken, getStoredToken } from "../services/apiClient";
import { logout as logoutRequest, me as fetchMe, updateProfile as updateProfileRequest } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(getStoredToken());
    const [isLoading, setIsLoading] = useState(Boolean(getStoredToken()));

    useEffect(() => {
        let ignore = false;

        async function bootstrapAuth() {
            if (!getStoredToken()) {
                setIsLoading(false);
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
                    setIsLoading(false);
                }
            }
        }

        bootstrapAuth();

        return () => {
            ignore = true;
        };
    }, []);

    const setAuthenticatedUser = (nextUser) => {
        setUser(nextUser);
        setToken(getStoredToken());
    };

    const channel = user?.channel ?? null;
    const hasChannel = Boolean(channel) || user?.has_channel === true;
    const isAuthenticated = Boolean(user && token);

    const value = {
        user,
        token,
        channel,
        hasChannel,
        canUpload: isAuthenticated && hasChannel,
        isAdmin: user?.role === "admin",
        isLoading,
        loading: isLoading,
        isAuthenticated,
        async refreshUser() {
            const authenticatedUser = await fetchMe();
            setUser(authenticatedUser);
            setToken(getStoredToken());

            return authenticatedUser;
        },
        async updateProfile(payload) {
            const updatedUser = await updateProfileRequest(payload);
            setUser(updatedUser);
            setToken(getStoredToken());

            return updatedUser;
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
