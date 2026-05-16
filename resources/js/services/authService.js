import api, { clearStoredToken, setStoredToken } from "./api";

function unwrap(response) {
    return response.data?.data ?? response.data ?? {};
}

export async function login(payload = {}) {
    const response = await api.post("/auth/login", {
        email: payload.email,
        password: payload.password,
    });
    const { token, user } = unwrap(response);

    setStoredToken(token);

    return { token, user };
}

export async function register(payload = {}) {
    const response = await api.post("/auth/register", {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.password_confirmation ?? payload.passwordConfirm,
    });

    const { token, user } = unwrap(response);
    setStoredToken(token);

    return { token, user };
}

export async function me() {
    const response = await api.get("/auth/me");

    return unwrap(response);
}

export async function updateProfile(payload) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
        }
    });

    const response = await api.post("/auth/profile", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return unwrap(response);
}

export async function logout() {
    try {
        await api.post("/auth/logout");
    } finally {
        clearStoredToken();
    }
}
