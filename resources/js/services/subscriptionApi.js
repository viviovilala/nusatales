import nusaApiClient from "./nusaApiClient";

export const getSubscriptionPlans = () => nusaApiClient.get("/subscription-plans");
export const checkoutSubscription = (planId) => nusaApiClient.post(`/subscriptions/${planId}/checkout`);
export const getMySubscription = () => nusaApiClient.get("/me/subscription");
export const cancelSubscription = () => nusaApiClient.post("/me/subscription/cancel");
export const getBilling = () => nusaApiClient.get("/me/billing");
