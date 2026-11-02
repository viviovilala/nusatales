import ActionFormLayout from "../../../components/ActionFormLayout";
import { Button, Field, Input, PasswordInput, Notice } from "../../../components/ui/form";
import { AppLink as Link } from "../../../app/ModalContext";
import React, { useState, useId } from "react";

import { authRepository } from "../authRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function ForgotPasswordPage({ embedded = false }) {
    const formId = useId();
    const [email, setEmail] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMessage("");
        setStatusMessage("");

        if (!email.trim()) return;

        setIsPending(true);
        try {
            const { error } = await authRepository.resetPasswordForEmail(email.trim());
            if (error) {
                setErrorMessage(normalizeSupabaseError(error, "Gagal mengirim email reset kata sandi."));
                return;
            }
            setStatusMessage("Tautan reset kata sandi telah dikirim ke email Anda. Periksa kotak masuk Anda.");
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err));
        } finally {
            setIsPending(false);
        }
    }

    return <ActionFormLayout embedded={embedded} title="Lupa kata sandi" description="Masukkan email akunmu. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.">
        <form onSubmit={handleSubmit} className="ui-form">
            <Notice>{errorMessage}</Notice><Notice tone="success">{statusMessage}</Notice>
            <Field id={`${formId}-email`} label="Email terdaftar" required>
                <Input id={`${formId}-email`} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" disabled={isPending} />
            </Field>
            <Button type="submit" busy={isPending} className="ui-button-full">{isPending ? "Mengirim..." : "Kirim Tautan Reset"}</Button>
            <p className="ui-form-switch"><Link to="/login" className="ui-text-link">Kembali ke Masuk</Link></p>
        </form>
    </ActionFormLayout>;
}
