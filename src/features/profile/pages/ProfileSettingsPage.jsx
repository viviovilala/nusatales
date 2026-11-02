import ActionFormLayout from "../../../components/ActionFormLayout";
import { Button, Field, Input, Textarea, Notice } from "../../../components/ui/form";
import { LockKeyhole } from "lucide-react";
import { useStorageImageUrl } from "../../../components/StorageImage";
import React, { useState, useEffect, useRef, useId } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { profileRepository, USERNAME_REGEX } from "../profileRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function ProfileSettingsPage({ embedded = false }) {
    const { user, profile, refreshProfile } = useAuth();
    const formId = useId();
    const initializedProfileRef = useRef(null);
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarPath, setAvatarPath] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Validation & status states
    const [usernameStatus, setUsernameStatus] = useState({ state: "idle", message: "" });
    const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const fileInputRef = useRef(null);
    const checkTimeoutRef = useRef(null);

    // Populate initial values
    useEffect(() => {
        if (profile && initializedProfileRef.current !== user?.id) {
            initializedProfileRef.current = user?.id;
            setDisplayName(profile.display_name || "");
            setUsername(profile.username || "");
            setBio(profile.bio || "");
            setAvatarPath(profile.avatar_path || "");
        } else if (!profile && user && !initializedProfileRef.current) {
            setDisplayName(user.user_metadata?.display_name || "");
        }
    }, [profile, user]);

    // Debounced username availability checker
    useEffect(() => {
        if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
        }

        const trimmed = username.trim().toLowerCase();

        if (!trimmed) {
            setUsernameStatus({ state: "idle", message: "" });
            return;
        }

        if (profile?.username && trimmed === profile.username.toLowerCase()) {
            setUsernameStatus({ state: "valid", message: "Username Anda saat ini" });
            return;
        }

        if (!USERNAME_REGEX.test(trimmed)) {
            setUsernameStatus({
                state: "invalid",
                message: "3-24 karakter (hanya huruf kecil, angka, garis bawah).",
            });
            return;
        }

        setUsernameStatus({ state: "checking", message: "Memeriksa ketersediaan..." });

        checkTimeoutRef.current = setTimeout(async () => {
            const isAvailable = await profileRepository.isUsernameAvailable(trimmed, user?.id);
            if (isAvailable) {
                setUsernameStatus({ state: "available", message: "Username tersedia!" });
            } else {
                setUsernameStatus({ state: "taken", message: "Username sudah digunakan orang lain." });
            }
        }, 400);

        return () => {
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
            }
        };
    }, [username, profile?.username, user?.id]);

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        // Local preview
        const reader = new FileReader();
        reader.onload = (event) => setAvatarPreview(event.target?.result);
        reader.readAsDataURL(file);

        setIsUploadingAvatar(true);
        setStatusMessage({ type: "", text: "" });

        try {
            const { data, error } = await profileRepository.uploadAvatar(user.id, file);
            if (error) {
                setStatusMessage({
                    type: "error",
                    text: normalizeSupabaseError(error, "Gagal mengunggah foto profil."),
                });
                return;
            }

            if (data?.path) {
                setAvatarPath(data.path);
                // Immediately save avatar_path to profile
                const result = await profileRepository.updateProfile(user.id, { avatar_path: data.path });
                if (result.error) throw result.error;
                await refreshProfile();
                setStatusMessage({ type: "success", text: "Foto profil berhasil diperbarui!" });
            }
        } catch (err) {
            setStatusMessage({ type: "error", text: normalizeSupabaseError(err) });
        } finally {
            setIsUploadingAvatar(false);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        setStatusMessage({ type: "", text: "" });

        if (!displayName.trim()) {
            setStatusMessage({ type: "error", text: "Nama tampilan tidak boleh kosong." });
            return;
        }

        const cleanUsername = username.trim().toLowerCase();
        if (cleanUsername && !USERNAME_REGEX.test(cleanUsername)) {
            setStatusMessage({
                type: "error",
                text: "Format username tidak valid. Gunakan 3-24 karakter (huruf kecil, angka, atau _).",
            });
            return;
        }

        if (usernameStatus.state === "taken") {
            setStatusMessage({ type: "error", text: "Username sudah digunakan orang lain." });
            return;
        }

        setIsSaving(true);
        try {
            if (user?.id) {
                const { error } = await profileRepository.updateProfile(user.id, {
                    display_name: displayName.trim(),
                    username: cleanUsername || null,
                    bio: bio.trim() || null,
                    avatar_path: avatarPath || null,
                });

                if (error) {
                    setStatusMessage({
                        type: "error",
                        text: normalizeSupabaseError(error, "Gagal menyimpan perubahan profil."),
                    });
                    return;
                }

                await refreshProfile();
                setStatusMessage({ type: "success", text: "Profil berhasil disimpan!" });
            }
        } catch (err) {
            setStatusMessage({ type: "error", text: normalizeSupabaseError(err) });
        } finally {
            setIsSaving(false);
        }
    }

    const signedAvatarUrl = useStorageImageUrl(avatarPath);
    const currentAvatarUrl = avatarPreview || signedAvatarUrl;
    const initialLetter = (displayName || user?.email || "U").charAt(0).toUpperCase();

    return <ActionFormLayout embedded={embedded} title="Edit profil" description="Perkenalkan dirimu dan cerita yang ingin kamu bagikan.">
        <form onSubmit={handleSave} className="ui-form ui-profile-form">
            <Notice tone={statusMessage.type === "success" ? "success" : "error"}>{statusMessage.text}</Notice>
            <div className="ui-avatar-editor">
                <div className="ui-avatar-preview">{currentAvatarUrl ? <img src={currentAvatarUrl} alt={displayName || "Foto profil"} /> : <span>{initialLetter}</span>}</div>
                <div><p className="ui-section-label">Foto profil</p><p className="ui-hint">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
                    <input id={`${formId}-avatar`} ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="sr-only" tabIndex={-1} aria-label="Pilih foto profil" />
                    <Button variant="outline" busy={isUploadingAvatar} disabled={isSaving} onClick={() => fileInputRef.current?.click()}>{isUploadingAvatar ? "Mengunggah..." : "Pilih Foto Baru"}</Button>
                </div>
            </div>
            <div className="ui-account-email"><div><p>{user?.email}</p><span>Email akun, tidak ditampilkan di profil publik.</span></div><LockKeyhole size={15} aria-hidden="true" /></div>
            <div className="ui-form-columns">
            <Field id={`${formId}-name`} label="Nama tampilan / studio" required>
                <Input id={`${formId}-name`} required maxLength={60} autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Contoh: Sanggar Animasi Borobudur" disabled={isSaving} />
            </Field>
            <Field id={`${formId}-username`} label="Username" hint={usernameStatus.message || "3-24 karakter: huruf kecil, angka, atau garis bawah."}>
                <div className="ui-input-prefix"><span aria-hidden="true">@</span><Input id={`${formId}-username`} maxLength={24} autoCapitalize="none" autoComplete="username" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="namastudio" disabled={isSaving} aria-invalid={["invalid", "taken"].includes(usernameStatus.state)} aria-describedby={`${formId}-username-hint`} /></div>
            </Field>
            </div>
            <Field id={`${formId}-bio`} label="Tentang kamu" trailing={<span className="ui-counter">{bio.length}/160</span>}>
                <Textarea id={`${formId}-bio`} rows={3} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Ceritakan sedikit tentang karya animasi atau ketertarikan Anda pada cerita rakyat..." disabled={isSaving} />
            </Field>
            <div className="ui-form-footer"><p className="ui-hint">Perubahan nama dan bio disimpan saat kamu menekan tombol ini.</p><Button type="submit" busy={isSaving} disabled={isUploadingAvatar || ["checking", "invalid", "taken"].includes(usernameStatus.state)}>{isSaving ? "Menyimpan..." : "Simpan Profil"}</Button></div>
        </form>
    </ActionFormLayout>;
}
