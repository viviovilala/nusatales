import apiClient, { clearStoredToken, setStoredToken } from "./apiClient";

export async function login(payload) {
    const response = await apiClient.post("/auth/login", payload);
    const { token, user } = response.data.data;

    setStoredToken(token);

    return { token, user };
}

export async function register(payload) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
        }
    });

    const response = await apiClient.post("/auth/register", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    const { token, user } = response.data.data;
    setStoredToken(token);

    return { token, user };
}

export async function me() {
    const response = await apiClient.get("/auth/me");

    return response.data.data;
}

export async function logout() {
    try {
        await apiClient.post("/auth/logout");
    } finally {
        clearStoredToken();
    }
}
