import api, { clearStoredToken, setStoredToken } from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? {};
}

function normalizeAuth(response) {
    const data = unwrap(response);

    return {
        ...data,
        token: data?.token ?? data?.access_token ?? null,
        user: data?.user ?? null,
    };
}

function normalizeUser(response) {
    const data = unwrap(response);

    return data?.user ?? data ?? null;
}

export async function login(payload = {}) {
    const response = await api.post("/auth/login", {
        email: payload.email,
        password: payload.password,
    });

    const { token, user } = normalizeAuth(response);

    if (!token) {
        throw new Error("Token login tidak ditemukan dari server.");
    }

    setStoredToken(token);

    return { token, user };
}

export async function register(payload = {}) {
    const response = await api.post("/auth/register", {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.password_confirmation,
    });

    const { token, user } = normalizeAuth(response);

    if (!token) {
        throw new Error("Token registrasi tidak ditemukan dari server.");
    }

    setStoredToken(token);

    return { token, user };
}

export async function me() {
    const response = await api.get("/auth/me");

    return normalizeUser(response);
}

export async function updateProfile(payload) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
        }
    });

    const response = await api.post("/auth/profile", formData);

    return normalizeUser(response);
}

export async function logout() {
    try {
        await api.post("/auth/logout");
    } finally {
        clearStoredToken();
    }
}
