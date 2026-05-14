import apiClient from "./apiClient";

export async function getGenres() {
    const response = await apiClient.get("/genres");

    return response.data.data;
}

export async function getSeries(params = {}) {
    const response = await apiClient.get("/series", { params });

    return response.data;
}

export async function getSeriesBySlug(slug) {
    const response = await apiClient.get(`/series/${slug}`);

    return response.data.data;
}

export async function getEpisodeById(id) {
    const response = await apiClient.get(`/episodes/${id}`);

    return response.data.data;
}

export async function saveEpisodeProgress(id, payload) {
    const response = await apiClient.post(`/episodes/${id}/progress`, payload);

    return response.data.data;
}

export async function getContinueWatching(params = {}) {
    const response = await apiClient.get("/continue-watching", { params });

    return response.data;
}

export async function getFavorites(params = {}) {
    const response = await apiClient.get("/favorites", { params });

    return response.data;
}

export async function addFavorite(payload) {
    const response = await apiClient.post("/favorites", payload);

    return response.data.data;
}

export async function removeFavorite(id) {
    const response = await apiClient.delete(`/favorites/${id}`);

    return response.data;
}

export async function submitRating(payload) {
    const response = await apiClient.post("/ratings", payload);

    return response.data.data;
}

