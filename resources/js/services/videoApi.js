import api from "./api";

export const getVideos = (params = {}) => api.get("/videos", { params });
export const getFeaturedVideos = () => api.get("/videos/featured");
export const getTrendingVideos = () => api.get("/videos/trending");
export const getLatestVideos = () => api.get("/videos/latest");
export const getRecommendedVideos = () => api.get("/videos/recommended");
export const getVideo = (slug) => api.get(`/videos/${slug}`);
export const recordVideoView = (id) => api.post(`/videos/${id}/view`);
export const storeWatchProgress = (episode, payload) => api.post(`/episodes/${episode}/progress`, payload);
export const likeVideo = (id) => api.post(`/videos/${id}/like`);
export const unlikeVideo = (id) => api.delete(`/videos/${id}/like`);
export const getComments = (id) => api.get(`/videos/${id}/comments`);
export const postComment = (id, payload) => api.post(`/videos/${id}/comments`, payload);
export const replyComment = (id, payload) => api.post(`/comments/${id}/reply`, payload);
export const deleteComment = (id) => api.delete(`/comments/${id}`);
export const saveWatchLater = (id) => api.post("/favorites", { target_type: "episode", target_id: id });
export const removeWatchLater = (id) => api.delete(`/favorites/${id}`);
export const unlockVideo = (id) => api.post(`/videos/${id}/unlock`);
