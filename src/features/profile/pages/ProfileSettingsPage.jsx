import { useStorageImageUrl } from "../../../components/StorageImage";
import React, { useState, useEffect, useRef } from "react";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { useAuth } from "../../auth/AuthProvider";
import { profileRepository, USERNAME_REGEX } from "../profileRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function ProfileSettingsPage() {
    const { user, profile, refreshProfile } = useAuth();
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
        if (profile) {
            setDisplayName(profile.display_name || "");
            setUsername(profile.username || "");
            setBio(profile.bio || "");
            setAvatarPath(profile.avatar_path || "");
        } else if (user) {
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
                await profileRepository.updateProfile(user.id, { avatar_path: data.path });
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

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        Preferensi Akun
                    </span>
                    <h1
                        className="text-3xl font-black text-[#3B2A0E] mt-1"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        Pengaturan Profil
                    </h1>
                    <p className="text-sm text-neutral-600">
                        Kelola identitas publik, username kreator, dan foto studio Anda.
                    </p>
                </div>

                {statusMessage.text && (
                    <div
                        className={`mb-6 rounded-2xl px-5 py-4 text-sm border font-medium ${
                            statusMessage.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-red-50 text-red-800 border-red-200"
                        }`}
                    >
                        {statusMessage.text}
                    </div>
                )}

                <form
                    onSubmit={handleSave}
                    className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-sm space-y-6"
                >
                    {/* Avatar Uploader Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-neutral-100">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-100 border-4 border-white shadow-md flex items-center justify-center">
                                {currentAvatarUrl ? (
                                    <img
                                        src={currentAvatarUrl}
                                        alt={displayName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-black text-amber-800">
                                        {initialLetter}
                                    </span>
                                )}
                            </div>
                            {isUploadingAvatar && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="text-center sm:text-left flex-1">
                            <h3 className="font-bold text-neutral-800 mb-1">Foto Profil / Logo Studio</h3>
                            <p className="text-xs text-neutral-500 mb-3">
                                Format JPG, PNG, atau WebP. Maksimal 5 MB.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                disabled={isUploadingAvatar}
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 rounded-full text-xs font-bold text-neutral-800 bg-[#F5F0E0] hover:bg-[#EAE2CE] transition cursor-pointer disabled:opacity-50"
                            >
                                {isUploadingAvatar ? "Mengunggah..." : "Pilih Foto Baru"}
                            </button>
                        </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                            Email Terdaftar (Supabase Auth)
                        </label>
                        <input
                            type="text"
                            disabled
                            value={user?.email || ""}
                            className="w-full px-5 py-3 rounded-2xl bg-neutral-100 text-neutral-500 text-sm outline-none cursor-not-allowed"
                        />
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                            Nama Tampilan / Nama Studio <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={60}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Contoh: Sanggar Animasi Borobudur"
                            className="w-full px-5 py-3.5 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F]"
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                            Username Publik (@username)
                        </label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">
                                @
                            </span>
                            <input
                                type="text"
                                maxLength={24}
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                placeholder="namastudio"
                                className="w-full pl-10 pr-5 py-3.5 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F]"
                            />
                        </div>
                        {usernameStatus.message && (
                            <p
                                className={`text-xs mt-1.5 px-2 ${
                                    usernameStatus.state === "available" || usernameStatus.state === "valid"
                                        ? "text-emerald-600 font-semibold"
                                        : usernameStatus.state === "checking"
                                        ? "text-neutral-500"
                                        : "text-red-600 font-medium"
                                }`}
                            >
                                {usernameStatus.message}
                            </p>
                        )}
                        <p className="text-[11px] text-neutral-500 mt-1 px-1">
                            Digunakan untuk tautan profil publik:{" "}
                            <span className="font-mono text-amber-900">
                                /u/{username.trim().toLowerCase() || "username"}
                            </span>
                        </p>
                    </div>

                    {/* Bio */}
                    <div>
                        <div className="flex items-center justify-between mb-1 px-1">
                            <label className="block text-xs font-semibold text-neutral-600">
                                Bio Singkat
                            </label>
                            <span className="text-[11px] text-neutral-400">
                                {bio.length}/160
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            maxLength={160}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Ceritakan sedikit tentang karya animasi atau ketertarikan Anda pada cerita rakyat..."
                            className="w-full px-5 py-3.5 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F] resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving || isUploadingAvatar || usernameStatus.state === "taken"}
                        className="w-full py-4 rounded-full text-white font-semibold text-sm shadow hover:opacity-95 transition disabled:opacity-60 cursor-pointer"
                        style={{ backgroundColor: "#8DC63F" }}
                    >
                        {isSaving ? "Menyimpan Perubahan..." : "Simpan Profil"}
                    </button>
                </form>
            </main>

            <Footer />
        </div>
    );
}
