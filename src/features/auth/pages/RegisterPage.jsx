import ActionFormLayout from "../../../components/ActionFormLayout";
import { Button, Field, Input, PasswordInput, Notice } from "../../../components/ui/form";
import { AppLink as Link } from "../../../app/ModalContext";
import React, { useState, useId } from "react";
import { useNavigate } from "react-router-dom";

import { authRepository } from "../authRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function RegisterPage({ embedded = false, onAuthenticated }) {
    const navigate = useNavigate();
    const formId = useId();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!displayName.trim() || !email.trim() || !password) {
            setErrorMessage("Mohon lengkapi semua kolom yang wajib diisi.");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Kata sandi minimal 6 karakter.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Konfirmasi kata sandi tidak cocok.");
            return;
        }

        setIsPending(true);
        try {
            const { data, error } = await authRepository.signUp({
                email: email.trim(),
                password,
                displayName: displayName.trim(),
            });

            if (error) {
                setErrorMessage(normalizeSupabaseError(error, "Pendaftaran gagal. Periksa data Anda."));
                return;
            }

            // If session is returned immediately (email confirmation disabled in Supabase)
            if (data?.session) {
                if (embedded) onAuthenticated?.();
                else navigate("/studio", { replace: true });
                return;
            }

            // If email confirmation is required
            setSuccessMessage(
                "Pendaftaran berhasil! Kami telah mengirimkan tautan konfirmasi ke email Anda. Silakan periksa kotak masuk atau spam Anda."
            );
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err));
        } finally {
            setIsPending(false);
        }
    }

    return <ActionFormLayout embedded={embedded} title="Daftar akun" description="Satu akun untuk menikmati cerita dan membagikan karyamu.">
        <form onSubmit={handleSubmit} className="ui-form">
            <Notice>{errorMessage}</Notice><Notice tone="success">{successMessage}</Notice>
            <Field id={`${formId}-name`} label="Nama lengkap / studio" required>
                <Input id={`${formId}-name`} required autoComplete="name" maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Contoh: Roro Studio" disabled={isPending} />
            </Field>
            <Field id={`${formId}-email`} label="Email" required>
                <Input id={`${formId}-email`} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" disabled={isPending} />
            </Field>
            <div className="ui-form-columns">
                <Field id={`${formId}-password`} label="Kata sandi" required hint="Minimal 6 karakter.">
                    <PasswordInput id={`${formId}-password`} required minLength={6} autoComplete="new-password" aria-describedby={`${formId}-password-hint`} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" disabled={isPending} />
                </Field>
                <Field id={`${formId}-confirm`} label="Konfirmasi kata sandi" required>
                    <PasswordInput id={`${formId}-confirm`} required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi" disabled={isPending} />
                </Field>
            </div>
            <Button type="submit" busy={isPending} className="ui-button-full">{isPending ? "Membuat akun..." : "Daftar Akun"}</Button>
            <p className="ui-form-switch">Sudah punya akun? <Link to="/login" className="ui-text-link">Masuk</Link></p>
        </form>
    </ActionFormLayout>;
}
