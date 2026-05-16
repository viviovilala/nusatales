import nusaApiClient from "./nusaApiClient";

export const getStudioStatus = () => nusaApiClient.get("/creator/studio-status");
export const activateStudio = () => nusaApiClient.post("/creator/activate-studio");
export const getStudioDashboard = () => nusaApiClient.get("/creator/dashboard");
export const getStudioVideos = () => nusaApiClient.get("/creator/animations");
function toFormData(payload = {}) {
    if (payload instanceof FormData) {
        return payload;
    }

    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => formData.append(`${key}[]`, item));
            return;
        }

        formData.append(key, value);
    });

    return formData;
}

export const createStudioVideo = (payload, config = {}) => nusaApiClient.post("/creator/animations", toFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
});
export const getStudioVideo = (id) => nusaApiClient.get(`/creator/animations/${id}`);
export const updateStudioVideo = (id, payload) => nusaApiClient.post(`/creator/animations/${id}`, payload);
export const deleteStudioVideo = (id) => nusaApiClient.delete(`/creator/animations/${id}`);
export const publishStudioVideo = (id) => nusaApiClient.post(`/creator/animations/${id}`, { status: "published" });
export const scheduleStudioVideo = (id, payload) => nusaApiClient.post(`/creator/animations/${id}`, { ...payload, status: "scheduled" });
export const uploadThumbnail = (id, payload) => nusaApiClient.post(`/creator/animations/${id}`, payload);
export const getStudioAnalytics = () => nusaApiClient.get("/creator/dashboard");
export const getStudioMonetization = () => nusaApiClient.get("/creator/monetization/summary");
export const agreeMonetization = () => nusaApiClient.post("/creator/monetization/agree", { agreed: true });
export const updateVideoMonetization = (id, payload) => nusaApiClient.post(`/creator/animations/${id}`, payload);
export const getStudioRevenue = () => nusaApiClient.get("/creator/monetization/earnings");
export const getStudioSettings = () => nusaApiClient.get("/creator/studio-status");
