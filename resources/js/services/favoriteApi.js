import api from "./api";

export const getFavorites = (params = {}) => api.get("/favorites", { params });
export const addFavorite = (payload) => api.post("/favorites", payload);
export const removeFavorite = (favoriteId) => api.delete(`/favorites/${favoriteId}`);
