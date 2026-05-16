import nusaApiClient from "./nusaApiClient";

export const getCoinPackages = () => nusaApiClient.get("/coin-packages");
export const checkoutCoinPackage = (id) => nusaApiClient.post(`/coin-packages/${id}/checkout`);
export const getWallet = () => nusaApiClient.get("/wallet");
export const getWalletTransactions = () => nusaApiClient.get("/nusa-koin/transactions");
