import React, { useState } from "react";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { useAuth } from "../../auth/AuthProvider";
import { profileRepository } from "../profileRepository";

export default function ProfileSettingsPage() {
    const { user, profile, refreshProfile } = useAuth();
    const [displayName, setDisplayName] = useState(
        profile?.display_name || user?.user_metadata?.display_name || ""
    );
    const [bio, setBio] = useState(profile?.bio || "");
    const [statusMessage, setStatusMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave(e) {
        e.preventDefault();
        setStatusMessage("");
        setIsSaving(true);

        try {
            if (user?.id) {
                await profileRepository.updateProfile(user.id, {
                    display_name: displayName.trim(),
                    bio: bio.trim(),
                });
                await refreshProfile();
                setStatusMessage("Profil berhasil disimpan.");
            }
        } catch (err) {
            console.error("Save error:", err);
            setStatusMessage("Gagal menyimpan profil.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8">
                <h1
                    className="text-3xl font-black text-[#3B2A0E] mb-2"
                    style={{ fontFamily: "Georgia, serif" }}
                >
                    Pengaturan Profil
                </h1>
                <p className="text-sm text-neutral-600 mb-6">
                    Kelola nama tampilan dan informasi publik kreator Anda.
                </p>

                <form
                    onSubmit={handleSave}
                    className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-sm space-y-5"
                >
                    {statusMessage && (
                        <div className="rounded-2xl px-4 py-3 text-sm bg-amber-50 text-amber-900 border border-amber-200">
                            {statusMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                            Email (Akun Supabase)
                        </label>
                        <input
                            type="text"
                            disabled
                            value={user?.email || ""}
                            className="w-full px-5 py-3 rounded-2xl bg-neutral-100 text-neutral-500 text-sm outline-none cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                            Nama Tampilan / Studio
                        </label>
                        <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Nama atau studio Anda"
                            className="w-full px-5 py-3 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                            Bio Singkat (Maks. 160 karakter)
                        </label>
                        <textarea
                            rows={3}
                            maxLength={160}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Ceritakan minat atau studio Anda..."
                            className="w-full px-5 py-3 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F] resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3.5 rounded-full text-white font-semibold shadow hover:opacity-95 transition disabled:opacity-60 cursor-pointer"
                        style={{ backgroundColor: "#8DC63F" }}
                    >
                        {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </form>
            </main>

            <Footer />
        </div>
    );
}
