import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { clearStoredToken, getStoredToken } from "../services/apiClient";
import { logout as logoutRequest, me as fetchMe } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
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
                }
            } catch (_error) {
                clearStoredToken();
                if (!ignore) {
                    setUser(null);
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

    const value = {
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        async refreshUser() {
            const authenticatedUser = await fetchMe();
            setUser(authenticatedUser);

            return authenticatedUser;
        },
        async logout() {
            await logoutRequest();
            setUser(null);
        },
        setUser,
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
