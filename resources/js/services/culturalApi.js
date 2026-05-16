import nusaApiClient from "./nusaApiClient";

export const getRegions = () => nusaApiClient.get("/regions");
export const getRegionSeries = (slug) => nusaApiClient.get(`/regions/${slug}/series`);
export const getCulturalProgress = () => nusaApiClient.get("/me/cultural-progress");
export const getMissions = () => nusaApiClient.get("/me/missions");
export const getBadges = () => nusaApiClient.get("/me/badges");
export const addFavorite = (payload) => nusaApiClient.post("/favorites", payload);
