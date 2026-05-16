import axios from "axios";

export const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const TOKEN_STORAGE_KEY = "token";
const LEGACY_TOKEN_STORAGE_KEY = "nusatales_auth_token";

function localStorageSafe() {
    return typeof window !== "undefined" ? window.localStorage : null;
}

const api = axios.create({
    baseURL,
    headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

export function getStoredToken() {
    const storage = localStorageSafe();

    if (!storage) {
        return null;
    }

    const token = storage.getItem(TOKEN_STORAGE_KEY);

    if (token) {
        return token;
    }

    const legacyToken = storage.getItem(LEGACY_TOKEN_STORAGE_KEY);

    if (legacyToken) {
        storage.setItem(TOKEN_STORAGE_KEY, legacyToken);
    }

    return legacyToken;
}

export function setStoredToken(token) {
    const storage = localStorageSafe();

    if (!storage) {
        return;
    }

    if (!token) {
        storage.removeItem(TOKEN_STORAGE_KEY);
        storage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
        delete api.defaults.headers.common.Authorization;
        window.dispatchEvent(new Event("nusatales:auth-token-cleared"));
        return;
    }

    storage.setItem(TOKEN_STORAGE_KEY, token);
    storage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function clearStoredToken() {
    setStoredToken(null);
}

export function getValidationErrors(error) {
    return error?.response?.data?.errors ?? error?.errors ?? {};
}

export function getErrorMessage(error, fallback = "Terjadi kendala. Silakan coba lagi.") {
    const data = error?.response?.data;

    if (data?.message) {
        return data.message;
    }

    if (error?.message && !error.message.includes("status code")) {
        return error.message;
    }

    return fallback;
}

api.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url ?? "";

        error.api = {
            status,
            message: getErrorMessage(error),
            errors: getValidationErrors(error),
        };

        if (status === 401 && getStoredToken() && !url.includes("/auth/login") && !url.includes("/auth/register")) {
            clearStoredToken();
        }

        if (status >= 500) {
            console.warn("NusaTales API error", error.api.message);
        }

        return Promise.reject(error);
    },
);

const initialToken = getStoredToken();

if (initialToken) {
    api.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

export default api;
