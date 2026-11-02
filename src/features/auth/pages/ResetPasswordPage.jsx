import ActionFormLayout from "../../../components/ActionFormLayout";
import { Button, Field, Input, PasswordInput, Notice } from "../../../components/ui/form";
import { AppLink as Link } from "../../../app/ModalContext";
import React, { useState, useId } from "react";
import { useNavigate } from "react-router-dom";

import { authRepository } from "../authRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();
    const formId = useId();

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!password || password.length < 6) {
            setErrorMessage("Kata sandi baru minimal 6 karakter.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Konfirmasi kata sandi tidak cocok.");
            return;
        }

        setIsPending(true);
        try {
            const { error } = await authRepository.updatePassword(password);
            if (error) {
                setErrorMessage(normalizeSupabaseError(error, "Gagal memperbarui kata sandi."));
                return;
            }

            setSuccessMessage("Kata sandi berhasil diperbarui! Mengalihkan ke halaman studio...");
            setTimeout(() => {
                navigate("/studio");
            }, 2000);
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err));
        } finally {
            setIsPending(false);
        }
    }

    return <ActionFormLayout title="Buat kata sandi baru" description="Pilih kata sandi baru agar kamu bisa melanjutkan petualangan.">
        <form onSubmit={handleSubmit} className="ui-form">
            <Notice>{errorMessage}</Notice><Notice tone="success">{successMessage}</Notice>
            <Field id={`${formId}-password`} label="Kata sandi baru" required hint="Minimal 6 karakter.">
                <PasswordInput id={`${formId}-password`} required minLength={6} autoComplete="new-password" aria-describedby={`${formId}-password-hint`} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" disabled={isPending} />
            </Field>
            <Field id={`${formId}-confirm`} label="Konfirmasi kata sandi" required>
                <PasswordInput id={`${formId}-confirm`} required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi" disabled={isPending} />
            </Field>
            <Button type="submit" busy={isPending} className="ui-button-full">{isPending ? "Menyimpan..." : "Simpan Kata Sandi"}</Button>
            <p className="ui-form-switch"><Link to="/login" className="ui-text-link">Kembali ke Masuk</Link></p>
        </form>
    </ActionFormLayout>;
}
