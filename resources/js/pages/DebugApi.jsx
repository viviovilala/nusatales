import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api, { baseURL, getStoredToken, setStoredToken } from "../services/api";
import { getApiErrorMessage } from "../utils/errorMessage";

function sanitizeJson(value) {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeJson(item));
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => {
            const lowerKey = key.toLowerCase();

            if (lowerKey === "token" || lowerKey === "access_token" || lowerKey.includes("token")) {
                return [key, item ? "[masked]" : item];
            }

            return [key, sanitizeJson(item)];
        }));
    }

    return value;
}

export default function DebugApiPage() {
    const { refreshUser, user } = useAuth();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState("");

    async function run(label, request, options = {}) {
        setLoading(label);

        try {
            const response = await request();
            const payload = response?.data;

            if (options.storeToken) {
                const data = payload?.data || payload;
                const token = data?.token || data?.access_token;

                if (token) {
                    setStoredToken(token);
                    await refreshUser();
                }
            }

            setResult({
                label,
                status: response?.status,
                json: sanitizeJson(payload),
            });
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("API error:", error?.response?.status, error?.response?.data || error);
            }

            setResult({
                label,
                status: error?.response?.status || "NETWORK_ERROR",
                json: sanitizeJson(error?.response?.data || { message: getApiErrorMessage(error) }),
            });
        } finally {
            setLoading("");
        }
    }

    return (
        <main className="nt-container" style={{ padding: "2rem 0 4rem", display: "grid", gap: "1rem" }}>
            <section className="nt-card pad">
                <h1 className="nt-heading">Debug API</h1>
                <p><strong>API base URL:</strong> {baseURL}</p>
                <p><strong>Token exists:</strong> {getStoredToken() ? "true" : "false"}</p>
                <p><strong>Current user:</strong></p>
                <pre style={{ whiteSpace: "pre-wrap", overflow: "auto" }}>{JSON.stringify(user || null, null, 2)}</pre>
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                    <button type="button" className="nt-btn ghost" disabled={Boolean(loading)} onClick={() => run("Test Health", () => api.get("/health"))}>
                        {loading === "Test Health" ? "Testing..." : "Test Health"}
                    </button>
                    <button type="button" className="nt-btn ghost" disabled={Boolean(loading)} onClick={() => run("Test Login Demo", () => api.post("/auth/login", {
                        email: "user@nusatales.test",
                        password: "Password123!",
                    }), { storeToken: true })}>
                        {loading === "Test Login Demo" ? "Testing..." : "Test Login Demo"}
                    </button>
                    <button type="button" className="nt-btn ghost" disabled={Boolean(loading)} onClick={() => run("Test Me", () => api.get("/auth/me"))}>
                        {loading === "Test Me" ? "Testing..." : "Test Me"}
                    </button>
                    <button type="button" className="nt-btn ghost" disabled={Boolean(loading)} onClick={() => run("Test Studio Status", () => api.get("/creator/studio-status"))}>
                        {loading === "Test Studio Status" ? "Testing..." : "Test Studio Status"}
                    </button>
                </div>
            </section>

            {result ? (
                <section className="nt-card pad">
                    <h2 style={{ marginTop: 0, color: "var(--nt-brown)" }}>{result.label}</h2>
                    <p><strong>Status:</strong> {result.status}</p>
                    <pre style={{ whiteSpace: "pre-wrap", overflow: "auto" }}>{JSON.stringify(result.json, null, 2)}</pre>
                </section>
            ) : null}
        </main>
    );
}
