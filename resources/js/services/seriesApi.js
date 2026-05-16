import nusaApiClient from "./nusaApiClient";

export const getSeries = (params = {}) => nusaApiClient.get("/series", { params });
export const getPopularSeries = () => nusaApiClient.get("/series/popular");
export const getSeriesDetail = (slug) => nusaApiClient.get(`/series/${slug}`);
export const getSeriesEpisodes = (slug) => nusaApiClient.get(`/series/${slug}/episodes`);
export const getLatestEpisodes = () => nusaApiClient.get("/episodes/latest");
export const getCategories = () => nusaApiClient.get("/categories");
export const getGenres = () => nusaApiClient.get("/genres");
