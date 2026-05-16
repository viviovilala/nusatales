import api from "./api";

export const getSubscriptionPlans = () => api.get("/subscriptions/plans");
export const checkoutSubscription = (planId) => api.post("/subscriptions", { plan_id: planId });
export const getMySubscription = (params = {}) => api.get("/subscriptions", { params });
export const cancelSubscription = () => Promise.resolve({ data: { success: true, message: "Pembatalan langganan segera hadir." } });
export const getBilling = () => api.get("/me/billing");
