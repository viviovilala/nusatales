import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authRepository } from "../authRepository";
import { normalizeSupabaseError } from "../../../lib/errors";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";

export default function RegisterPage() {
    const navigate = useNavigate();
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
                navigate("/studio", { replace: true });
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

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 px-6 py-8">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-center">
                    {/* Left Intro Banner */}
                    <section
                        className="rounded-4xl p-8 text-white shadow-md"
                        style={{ background: "linear-gradient(135deg, #5C3A1E 0%, #A56E28 100%)" }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200 mb-3">
                            NusaTales Studio
                        </p>
                        <h1
                            className="text-4xl sm:text-5xl font-bold leading-tight mb-4"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Mulai berkarya dan lestarikan cerita Nusantara.
                        </h1>
                        <p className="text-sm leading-relaxed text-amber-50/90">
                            Daftarkan akun NusaTales untuk mempublikasikan video animasi cerita rakyat,
                            menampilkan karya budaya Anda ke jutaan penonton di feed Reels, dan mengelola portofolio studio Anda.
                        </p>
                    </section>

                    {/* Right Form Card */}
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-4xl p-8 border shadow-sm bg-white border-[#E8DFC7]"
                    >
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <p className="text-xs font-semibold text-[#8A7B5A]">Buat Akun Baru</p>
                                <h2
                                    className="text-3xl font-bold"
                                    style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                                >
                                    Bergabung ke NusaTales
                                </h2>
                            </div>
                            <Link to="/login" className="text-sm font-semibold text-[#A56E28] hover:underline">
                                Masuk
                            </Link>
                        </div>

                        {errorMessage && (
                            <div className="mb-5 rounded-2xl px-4 py-3 text-sm bg-[#FFF1EB] text-[#A63B1F] border border-red-200">
                                {errorMessage}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-5 rounded-2xl px-4 py-3 text-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {successMessage}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                                    Nama Lengkap / Studio
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Contoh: Roro Studio"
                                    className="w-full px-5 py-3.5 rounded-2xl outline-none bg-[#F7F3EA] text-[#3B2A0E] focus:ring-2 focus:ring-[#8DC63F]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@email.com"
                                    className="w-full px-5 py-3.5 rounded-2xl outline-none bg-[#F7F3EA] text-[#3B2A0E] focus:ring-2 focus:ring-[#8DC63F]"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                                        Kata Sandi (min. 6)
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full px-5 py-3.5 rounded-2xl outline-none bg-[#F7F3EA] text-[#3B2A0E] focus:ring-2 focus:ring-[#8DC63F]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                                        Konfirmasi Sandi
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ulangi kata sandi"
                                        className="w-full px-5 py-3.5 rounded-2xl outline-none bg-[#F7F3EA] text-[#3B2A0E] focus:ring-2 focus:ring-[#8DC63F]"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full mt-6 py-4 rounded-2xl text-white font-semibold shadow hover:opacity-95 transition disabled:opacity-60 cursor-pointer"
                            style={{ backgroundColor: "#8DC63F" }}
                        >
                            {isPending ? "Mendaftarkan Akun..." : "Daftar Akun"}
                        </button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
