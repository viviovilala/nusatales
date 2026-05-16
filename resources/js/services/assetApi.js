import api from "./api";

export const getAssets = (params = {}) => api.get("/assets", { params });
export const getAsset = (slug) => api.get(`/assets/${slug}`);
export const checkoutAsset = (id) => api.post(`/assets/${id}/checkout`);
export const getMyAssets = () => api.get("/assets");
export const getAssetDownloads = () => api.get("/assets");
export const downloadAsset = (id) => api.get(`/assets/${id}`);
