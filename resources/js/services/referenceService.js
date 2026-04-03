import apiClient from "./apiClient";

export async function getCategories() {
    const response = await apiClient.get("/references/categories");

    return response.data.data;
}

export async function getStories(params = {}) {
    const response = await apiClient.get("/references/stories", { params });

    return response.data.data;
}

export async function getCreators(params = {}) {
    const response = await apiClient.get("/creators", { params });

    return response.data.data;
}
