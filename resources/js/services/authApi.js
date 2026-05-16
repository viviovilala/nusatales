import api, { clearStoredToken } from "./api";

function unwrapPayload(response) {
    return response?.data ?? {};
}

function unwrapAuthData(response) {
    const payload = unwrapPayload(response);

    return payload?.data || payload;
}

function normalizeAuthResponse(response) {
    const data = unwrapAuthData(response);
    const user = data?.user ?? null;
    const token = data?.token ?? data?.access_token ?? null;

    return {
        ...data,
        token,
        user,
    };
}

function normalizeUserResponse(response) {
    const data = unwrapAuthData(response);

    return data?.user ?? data ?? null;
}

export async function login(payload = {}) {
    const response = await api.post("/auth/login", {
        email: payload.email,
        password: payload.password,
    });

    return normalizeAuthResponse(response);
}

export async function register(payload = {}) {
    const response = await api.post("/auth/register", {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.password_confirmation,
    });

    return normalizeAuthResponse(response);
}

export async function logout() {
    try {
        const response = await api.post("/auth/logout");

        return response.data;
    } finally {
        clearStoredToken();
    }
}

export async function me() {
    const response = await api.get("/auth/me");

    return normalizeUserResponse(response);
}

export async function updateProfile(payload) {
    const response = await api.post("/auth/profile", payload);

    return normalizeUserResponse(response);
}
