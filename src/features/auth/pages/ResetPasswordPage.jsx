import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authRepository } from "../authRepository";
import { normalizeSupabaseError } from "../../../lib/errors";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

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

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-3xl p-8 w-full max-w-md shadow-sm border border-[#C8E6A0]"
                >
                    <h1
                        className="text-3xl font-bold text-center mb-3"
                        style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                    >
                        Buat Kata Sandi Baru
                    </h1>
                    <p className="text-center text-sm text-neutral-600 mb-6">
                        Silakan masukkan kata sandi baru untuk akun Anda.
                    </p>

                    {errorMessage && (
                        <div className="mb-4 rounded-2xl px-4 py-3 text-sm bg-[#FFF1EB] text-[#A63B1F] border border-red-200">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 rounded-2xl px-4 py-3 text-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {successMessage}
                        </div>
                    )}

                    <div className="space-y-4 mb-5">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                                Kata Sandi Baru
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="w-full px-5 py-3.5 rounded-full text-sm outline-none bg-[#F0EEE8] text-[#3B2A0E] focus:ring-2 focus:ring-[#8DC63F]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                                Konfirmasi Kata Sandi
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi kata sandi baru"
                                className="w-full px-5 py-3.5 rounded-full text-sm outline-none bg-[#F0EEE8] text-[#3B2A0E] focus:ring-2 focus:ring-[#8DC63F]"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3.5 rounded-full text-white font-semibold shadow hover:opacity-95 transition disabled:opacity-60 cursor-pointer"
                        style={{ backgroundColor: "#8DC63F" }}
                    >
                        {isPending ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
                    </button>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-sm font-semibold text-amber-800 hover:underline">
                            Kembali ke Halaman Masuk
                        </Link>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
}
