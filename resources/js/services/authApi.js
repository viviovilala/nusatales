import nusaApiClient from "./nusaApiClient";
import { setStoredToken } from "./apiClient";

export async function login(payload) {
    const response = await nusaApiClient.post("/auth/login", payload);
    const token = response.data?.data?.token;

    if (token) {
        setStoredToken(token);
    }

    return response.data?.data ?? response.data;
}

export async function register(payload) {
    const { role: _role, ...safePayload } = payload ?? {};
    const response = await nusaApiClient.post("/auth/register", safePayload);
    const token = response.data?.data?.token;

    if (token) {
        setStoredToken(token);
    }

    return response.data?.data ?? response.data;
}

export async function logout() {
    const response = await nusaApiClient.post("/auth/logout");
    setStoredToken(null);

    return response.data;
}

export async function me() {
    const response = await nusaApiClient.get("/auth/me");

    return response.data?.data ?? response.data;
}

export async function updateProfile(payload) {
    const response = await nusaApiClient.post("/auth/profile", payload);

    return response.data?.data ?? response.data;
}
