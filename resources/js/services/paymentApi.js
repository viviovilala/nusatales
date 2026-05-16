import nusaApiClient from "./nusaApiClient";

export const createPaymentSnapToken = (payment) => nusaApiClient.post(`/payments/${payment}/snap-token`);
export const getPayment = (payment) => nusaApiClient.get(`/payments/${payment}`);
export const getMyPayments = () => nusaApiClient.get("/me/payments");
export const getMyInvoices = () => nusaApiClient.get("/me/invoices");
export const getInvoice = (invoiceNumber) => nusaApiClient.get(`/me/invoices/${invoiceNumber}`);
