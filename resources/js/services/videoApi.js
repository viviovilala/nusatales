import nusaApiClient from "./nusaApiClient";

export const getVideos = (params = {}) => nusaApiClient.get("/videos", { params });
export const getFeaturedVideos = () => nusaApiClient.get("/videos/featured");
export const getTrendingVideos = () => nusaApiClient.get("/videos/trending");
export const getLatestVideos = () => nusaApiClient.get("/videos/latest");
export const getRecommendedVideos = () => nusaApiClient.get("/videos/recommended");
export const getVideo = (slug) => nusaApiClient.get(`/videos/${slug}`);
export const recordVideoView = (id) => nusaApiClient.post(`/videos/${id}/view`);
export const storeWatchProgress = (payload) => nusaApiClient.post("/watch-progress", payload);
export const likeVideo = (id) => nusaApiClient.post(`/videos/${id}/like`);
export const unlikeVideo = (id) => nusaApiClient.delete(`/videos/${id}/like`);
export const saveWatchLater = (id) => nusaApiClient.post(`/me/watch-later/${id}`);
export const removeWatchLater = (id) => nusaApiClient.delete(`/me/watch-later/${id}`);
export const getComments = (id) => nusaApiClient.get(`/videos/${id}/comments`);
export const postComment = (id, payload) => nusaApiClient.post(`/videos/${id}/comments`, payload);
export const replyComment = (id, payload) => nusaApiClient.post(`/comments/${id}/reply`, payload);
export const unlockVideo = (id) => nusaApiClient.post(`/videos/${id}/unlock`);
