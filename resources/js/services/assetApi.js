import nusaApiClient from "./nusaApiClient";

export const getAssets = (params = {}) => nusaApiClient.get("/assets", { params });
export const getAsset = (slug) => nusaApiClient.get(`/assets/${slug}`);
export const checkoutAsset = (id) => nusaApiClient.post(`/assets/${id}/checkout`);
export const getMyAssets = () => nusaApiClient.get("/me/assets");
export const getAssetDownloads = () => nusaApiClient.get("/me/assets/downloads");
export const downloadAsset = (id) => nusaApiClient.get(`/assets/${id}/download`);
