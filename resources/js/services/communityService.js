import apiClient from "./apiClient";

export async function toggleLike(videoId) {
    const response = await apiClient.post(`/animations/${videoId}/like`);

    return response.data.data;
}

export async function getComments(videoId, params = {}) {
    const response = await apiClient.get(`/animations/${videoId}/comments`, { params });

    return response.data;
}

export async function addComment(videoId, content) {
    const response = await apiClient.post(`/animations/${videoId}/comments`, {
        content,
    });

    return response.data.data;
}

export async function shareAnimation(videoId, platformShare) {
    const response = await apiClient.post(`/animations/${videoId}/share`, {
        platform_share: platformShare,
    });

    return response.data.data;
}

export async function recordView(videoId) {
    const response = await apiClient.post(`/animations/${videoId}/view`);

    return response.data;
}

export async function followCreator(creatorId) {
    const response = await apiClient.post(`/creators/${creatorId}/follow`);

    return response.data.data;
}

export async function saveWatchHistory(videoId, watchedDuration) {
    const response = await apiClient.post(`/animations/${videoId}/watch-history`, {
        durasi_tonton: watchedDuration,
    });

    return response.data.data;
}

export async function getNotifications(params = {}) {
    const response = await apiClient.get("/notifications", { params });

    return response.data;
}

export async function updateNotificationStatus(id, status) {
    const response = await apiClient.patch(`/notifications/${id}`, { status });

    return response.data.data;
}

export async function getWatchHistory(params = {}) {
    const response = await apiClient.get("/watch-history", { params });

    return response.data.data;
}

export async function getMissions(params = {}) {
    const response = await apiClient.get("/missions", { params });

    return response.data;
}
