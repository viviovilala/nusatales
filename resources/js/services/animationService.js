import apiClient from "./apiClient";

export async function getPublishedAnimations(params = {}) {
    const response = await apiClient.get("/animations", { params });

    return response.data;
}

export async function getAnimationById(id) {
    const response = await apiClient.get(`/animations/${id}`);

    return response.data.data;
}

export async function getCreatorAnimations(params = {}) {
    const response = await apiClient.get("/creator/animations", { params });

    return response.data;
}

export async function createAnimation(payload) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
        }
    });

    const response = await apiClient.post("/creator/animations", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data.data;
}

export async function updateAnimation(id, payload) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
        }
    });

    const response = await apiClient.post(`/creator/animations/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data.data;
}

export async function deleteAnimation(id) {
    const response = await apiClient.delete(`/creator/animations/${id}`);

    return response.data;
}
