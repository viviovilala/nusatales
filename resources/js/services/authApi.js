import api, { clearStoredToken, setStoredToken } from "./api";

function unwrapAuthResponse(response) {
    return response.data?.data ?? response.data ?? {};
}

export async function login(payload = {}) {
    const response = await api.post("/auth/login", {
        email: payload.email,
        password: payload.password,
    });
    const data = unwrapAuthResponse(response);
    const token = data.token;

    if (token) {
        setStoredToken(token);
    }

    return data;
}

export async function register(payload = {}) {
    const response = await api.post("/auth/register", {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.password_confirmation ?? payload.passwordConfirm,
    });
    const data = unwrapAuthResponse(response);
    const token = data.token;

    if (token) {
        setStoredToken(token);
    }

    return data;
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

    return unwrapAuthResponse(response);
}

export async function updateProfile(payload) {
    const response = await api.post("/auth/profile", payload);

    return unwrapAuthResponse(response);
}
