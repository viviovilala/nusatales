import apiClient from "./apiClient";

export async function getCreatorDashboard() {
    const response = await apiClient.get("/creator/dashboard");

    return response.data.data;
}

export async function getCreatorMonetizationSummary() {
    const response = await apiClient.get("/creator/monetization/summary");

    return response.data.data;
}

export async function getCreatorEarnings(params = {}) {
    const response = await apiClient.get("/creator/monetization/earnings", { params });

    return response.data;
}

export async function getAdminDashboard() {
    const response = await apiClient.get("/admin/dashboard");

    return response.data.data;
}

export async function getAdminAnimations(params = {}) {
    const response = await apiClient.get("/admin/animations", { params });

    return response.data;
}

export async function updateAdminAnimationStatus(id, payload) {
    const response = await apiClient.patch(`/admin/animations/${id}/status`, payload);

    return response.data.data;
}

export async function getAdminPlans(params = {}) {
    const response = await apiClient.get("/admin/plans", { params });

    return response.data;
}

export async function createAdminPlan(payload) {
    const response = await apiClient.post("/admin/plans", payload);

    return response.data.data;
}

export async function updateAdminPlan(id, payload) {
    const response = await apiClient.patch(`/admin/plans/${id}`, payload);

    return response.data.data;
}

export async function deleteAdminPlan(id) {
    const response = await apiClient.delete(`/admin/plans/${id}`);

    return response.data;
}

export async function getAdminMissions(params = {}) {
    const response = await apiClient.get("/admin/missions", { params });

    return response.data.data;
}

export async function createAdminMission(payload) {
    const response = await apiClient.post("/admin/missions", payload);

    return response.data.data;
}

export async function updateAdminMission(id, payload) {
    const response = await apiClient.patch(`/admin/missions/${id}`, payload);

    return response.data.data;
}

export async function deleteAdminMission(id) {
    const response = await apiClient.delete(`/admin/missions/${id}`);

    return response.data;
}

export async function getAdminAds(params = {}) {
    const response = await apiClient.get("/admin/ads", { params });

    return response.data;
}

export async function createAdminAd(payload) {
    const response = await apiClient.post("/admin/ads", payload);

    return response.data.data;
}

export async function updateAdminAd(id, payload) {
    const response = await apiClient.patch(`/admin/ads/${id}`, payload);

    return response.data.data;
}

export async function deleteAdminAd(id) {
    const response = await apiClient.delete(`/admin/ads/${id}`);

    return response.data;
}
