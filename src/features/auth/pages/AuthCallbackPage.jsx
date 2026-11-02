import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("Memverifikasi autentikasi...");

    useEffect(() => {
        let isMounted = true;

        async function handleCallback() {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (isMounted) {
                    if (data?.session) {
                        setStatus("Autentikasi berhasil! Mengalihkan...");
                        navigate("/studio", { replace: true });
                    } else {
                        setStatus("Sesi tidak ditemukan. Mengalihkan ke login...");
                        navigate("/login", { replace: true });
                    }
                }
            } catch (err) {
                console.error("[AuthCallback] Error resolving session:", err);
                if (isMounted) {
                    setStatus("Terjadi kesalahan saat verifikasi.");
                    setTimeout(() => navigate("/login", { replace: true }), 2500);
                }
            }
        }

        handleCallback();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F0E0] p-6 text-center">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow border border-amber-100">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="font-bold text-neutral-800 mb-2">Memverifikasi Akun</h3>
                <p className="text-sm text-neutral-600">{status}</p>
            </div>
        </div>
    );
}
