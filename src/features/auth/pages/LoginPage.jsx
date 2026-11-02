import ActionFormLayout from "../../../components/ActionFormLayout";
import { Button, Field, Input, PasswordInput, Notice } from "../../../components/ui/form";
import { AppLink as Link } from "../../../app/ModalContext";
import React, { useState, useId } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { authRepository } from "../authRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function LoginPage({ embedded = false, onAuthenticated }) {
    const formId = useId();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isPending, setIsPending] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const fromPath = location.state?.from?.pathname || "/studio";

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");

        if (!email.trim() || !password) {
            setErrorMessage("Mohon lengkapi email dan kata sandi.");
            return;
        }

        setIsPending(true);
        try {
            const { data, error } = await authRepository.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                setErrorMessage(normalizeSupabaseError(error, "Gagal masuk. Periksa email dan password."));
                return;
            }

            if (data?.session) {
                if (embedded) onAuthenticated?.();
                else navigate(fromPath, { replace: true });
            }
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err));
        } finally {
            setIsPending(false);
        }
    }

    return <ActionFormLayout embedded={embedded} title="Masuk" description="Selamat datang kembali. Cerita berikutnya menunggumu.">
        <form onSubmit={handleSubmit} className="ui-form">
            <Notice>{errorMessage}</Notice>
            <Field id={`${formId}-email`} label="Email" required>
                <Input id={`${formId}-email`} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" disabled={isPending} />
            </Field>
            <Field id={`${formId}-password`} label="Kata sandi" required trailing={<Link to="/forgot-password" className="ui-text-link">Lupa kata sandi?</Link>}>
                <PasswordInput id={`${formId}-password`} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi..." disabled={isPending} />
            </Field>
            <Button type="submit" busy={isPending} className="ui-button-full">{isPending ? "Memproses..." : "Masuk"}</Button>
            <p className="ui-form-switch">Belum punya akun? <Link to="/register" className="ui-text-link">Daftar Sekarang</Link></p>
        </form>
    </ActionFormLayout>;
}
