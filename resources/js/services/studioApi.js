import api from "./api";

export const getStudioStatus = () => api.get("/creator/studio-status");
export const activateStudio = () => api.post("/creator/activate-studio");
export const getStudioDashboard = () => api.get("/creator/dashboard");
export const getStudioVideos = (params = {}) => api.get("/creator/animations", { params });
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

export const createStudioVideo = (payload, config = {}) => api.post("/creator/animations", toFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
});
export const getStudioVideo = (id) => api.get(`/creator/animations/${id}`);
export const updateStudioVideo = (id, payload) => api.post(`/creator/animations/${id}`, payload);
export const deleteStudioVideo = (id) => api.delete(`/creator/animations/${id}`);
export const publishStudioVideo = (id) => api.post(`/creator/animations/${id}`, { status: "published" });
export const scheduleStudioVideo = (id, payload) => api.post(`/creator/animations/${id}`, { ...payload, status: "scheduled" });
export const uploadThumbnail = (id, payload) => api.post(`/creator/animations/${id}`, payload);
export const getStudioAnalytics = () => api.get("/creator/dashboard");
export const getStudioMonetization = () => api.get("/creator/monetization/summary");
export const agreeMonetization = () => api.post("/creator/monetization/agree", { agreed: true });
export const updateVideoMonetization = (id, payload) => api.post(`/creator/animations/${id}`, payload);
export const getStudioRevenue = () => api.get("/creator/monetization/earnings");
export const getStudioSettings = () => api.get("/creator/studio-status");
