export function getApiErrorMessage(error, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
    const response = error?.response;
    const data = response?.data;

    if (data?.message) return data.message;

    if (data?.errors && typeof data.errors === "object") {
        const firstKey = Object.keys(data.errors)[0];
        const firstError = data.errors[firstKey];
        if (Array.isArray(firstError)) return firstError[0];
        if (typeof firstError === "string") return firstError;
    }

    if (error?.message) return error.message;

    return fallback;
}

export function getApiValidationErrors(error) {
    return error?.response?.data?.errors || {};
}
