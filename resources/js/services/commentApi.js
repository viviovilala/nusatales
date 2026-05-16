import api from "./api";

export const getVideoComments = (videoId, params = {}) => api.get(`/videos/${videoId}/comments`, { params });
export const createVideoComment = (videoId, payload) => api.post(`/videos/${videoId}/comments`, payload);
export const replyToComment = (commentId, payload) => api.post(`/comments/${commentId}/reply`, payload);
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);
