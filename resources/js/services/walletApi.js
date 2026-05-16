import api from "./api";

export const getCoinPackages = () => api.get("/coin-packages");
export const checkoutCoinPackage = (id) => api.post(`/coin-packages/${id}/checkout`);
export const getWallet = () => api.get("/wallet");
export const getWalletTransactions = (params = {}) => api.get("/nusa-koin/transactions", { params });
