import React, { useState } from "react";
import { Button } from "../../../components/ui/form";
import { authRepository } from "../authRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

/** Google OAuth is handled by Supabase; no Google secret is used by the client. */
export default function GoogleSignInButton({ disabled = false, onError }) {
    const [pending, setPending] = useState(false);

    async function startGoogleSignIn() {
        if (pending || disabled) return;
        onError?.("");
        setPending(true);
        try {
            const { error } = await authRepository.signInWithGoogle();
            if (error) {
                onError?.(normalizeSupabaseError(error, "Login Google belum tersedia. Coba lagi nanti."));
            }
            // Supabase redirects the browser to Google on success.
        } catch (error) {
            onError?.(normalizeSupabaseError(error, "Login Google gagal dimulai."));
        } finally {
            setPending(false);
        }
    }

    return <Button type="button" variant="outline" className="ui-button-full"
        disabled={disabled} busy={pending} onClick={startGoogleSignIn}>
        <span aria-hidden="true" style={{ fontWeight: 800 }}>G</span>
        <span>Lanjutkan dengan Google</span>
    </Button>;
}
