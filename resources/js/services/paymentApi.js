import api from "./api";

export const createPaymentSnapToken = (payment) => api.post(`/payments/${payment}/snap-token`);
export const getPayment = (payment) => api.get(`/payments/${payment}`);
export const getMyPayments = () => api.get("/me/payments");
export const getMyInvoices = () => api.get("/me/invoices");
export const getInvoice = (invoiceNumber) => api.get(`/me/invoices/${invoiceNumber}`);
