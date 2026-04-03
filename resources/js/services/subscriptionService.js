import apiClient from "./apiClient";

export async function getSubscriptionPlans() {
    const response = await apiClient.get("/subscriptions/plans");

    return response.data.data;
}

export async function subscribe(planId) {
    const response = await apiClient.post("/subscriptions", {
        plan_id: planId,
    });

    return response.data.data;
}

export async function getSubscriptions(params = {}) {
    const response = await apiClient.get("/subscriptions", { params });

    return response.data;
}

export async function getNusaKoinTransactions(params = {}) {
    const response = await apiClient.get("/nusa-koin/transactions", { params });

    return response.data;
}

export async function getWalletSummary() {
    const response = await apiClient.get("/wallet");

    return response.data.data;
}
