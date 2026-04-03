import axios from "axios";

const API_BASE_URL = "/api/v1";
const TOKEN_STORAGE_KEY = "nusatales_auth_token";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

export function getStoredToken() {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
    if (!token) {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        delete apiClient.defaults.headers.common.Authorization;
        return;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function clearStoredToken() {
    setStoredToken(null);
}

const token = getStoredToken();
if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export default apiClient;
