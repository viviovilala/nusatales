import api from "./api";

export const getChallenges = () => api.get("/challenges");
export const getChallenge = (slug) => api.get(`/challenges/${slug}`);
export const submitChallenge = (id, payload) => api.post(`/challenges/${id}/submit`, payload);
export const getChallengeLeaderboard = (id) => api.get(`/challenges/${id}/leaderboard`);
