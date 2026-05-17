import axios from "axios";
import { getApiErrorMessage, getApiValidationErrors } from "../utils/errorMessage";

export const baseURL = "/api/v1";

const TOKEN_STORAGE_KEY = "token";
const LEGACY_TOKEN_STORAGE_KEY = "nusatales_auth_token";

function localStorageSafe() {
    return typeof window !== "undefined" ? window.localStorage : null;
}

function removeHeader(headers, key) {
    if (typeof headers?.delete === "function") {
        headers.delete(key);
        return;
    }

    delete headers[key];
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

export const getValidationErrors = getApiValidationErrors;
export const getErrorMessage = getApiErrorMessage;

api.interceptors.request.use((config) => {
    const token = getStoredToken();

    config.headers = config.headers || {};

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        removeHeader(config.headers, "Authorization");
    }

    if (config.data instanceof FormData) {
        removeHeader(config.headers, "Content-Type");
        removeHeader(config.headers, "content-type");
    } else {
        config.headers["Content-Type"] = "application/json";
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        error.api = {
            status,
            message: getApiErrorMessage(error),
            errors: getApiValidationErrors(error),
        };

        if (status === 401) {
            clearStoredToken();
        }

        return Promise.reject(error);
    },
);

const initialToken = getStoredToken();

if (initialToken) {
    api.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

export default api;
