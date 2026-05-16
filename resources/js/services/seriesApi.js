import api from "./api";

export const getSeries = (params = {}) => api.get("/series", { params });
export const getPopularSeries = () => api.get("/series/popular");
export const getSeriesDetail = (slug) => api.get(`/series/${slug}`);
export const getSeriesEpisodes = (slug) => api.get(`/series/${slug}/episodes`);
export const getLatestEpisodes = () => api.get("/episodes/latest");
export const getCategories = () => api.get("/categories");
export const getGenres = () => api.get("/genres");
