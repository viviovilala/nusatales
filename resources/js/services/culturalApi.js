import api from "./api";

export const getRegions = () => api.get("/regions");
export const getRegionSeries = (slug) => api.get(`/regions/${slug}/series`);
export const getCulturalProgress = () => api.get("/cultural-progress");
export const getMyCulturalProgress = () => api.get("/me/cultural-progress");
export const getMissions = () => api.get("/missions");
export const getBadges = () => api.get("/badges");
export const getMyBadges = () => api.get("/me/badges");
export const addFavorite = (payload) => api.post("/favorites", payload);
export const getFavorites = (params = {}) => api.get("/favorites", { params });
export const removeFavorite = (id) => api.delete(`/favorites/${id}`);
