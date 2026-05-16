import nusaApiClient from "./nusaApiClient";

export const getChallenges = () => nusaApiClient.get("/challenges");
export const getChallenge = (slug) => nusaApiClient.get(`/challenges/${slug}`);
export const submitChallenge = (id, payload) => nusaApiClient.post(`/challenges/${id}/submit`, payload);
export const getChallengeLeaderboard = (id) => nusaApiClient.get(`/challenges/${id}/leaderboard`);
