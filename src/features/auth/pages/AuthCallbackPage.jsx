import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import ActionFormLayout from "../../../components/ActionFormLayout";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("Memverifikasi autentikasi...");

    useEffect(() => {
        let isMounted = true;
        let redirectTimer;

        async function handleCallback() {
            try {
                // OAuth denials return to the callback URL without a session.
                // Do not display raw provider details or leave the user stuck.
                const search = new URLSearchParams(window.location.search);
                const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
                if (search.has("error") || fragment.has("error")) {
                    navigate("/login", { replace: true, state: {
                        oauthError: "Login Google tidak berhasil atau dibatalkan. Silakan coba lagi.",
                    } });
                    return;
                }
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
                    redirectTimer = setTimeout(() => { if (isMounted) navigate("/login", { replace: true }); }, 2500);
                }
            }
        }

        handleCallback();

        return () => {
            isMounted = false;
            clearTimeout(redirectTimer);
        };
    }, [navigate]);

    return <ActionFormLayout title="Menghubungkan akun" description="Tunggu sebentar, kami sedang menyiapkan sesimu.">
        <div className="ui-loading" role="status"><Loader2 size={20} className="ui-spinner" /><span>{status}</span></div>
    </ActionFormLayout>;
}
