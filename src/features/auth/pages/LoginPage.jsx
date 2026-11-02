import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authRepository } from "../authRepository";
import { normalizeSupabaseError } from "../../../lib/errors";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
                navigate(fromPath, { replace: true });
            }
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 flex items-start justify-center gap-8 px-6 pt-6 pb-16">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-sm border border-[#C8E6A0]"
                >
                    <h1
                        className="text-4xl font-bold text-center mb-8"
                        style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                    >
                        Masuk
                    </h1>

                    {errorMessage && (
                        <div className="mb-4 rounded-2xl px-4 py-3 text-sm bg-[#FFF1EB] text-[#A63B1F] border border-red-200">
                            {errorMessage}
                        </div>
                    )}

                    {/* Email */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1.5 px-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="w-full px-5 py-4 rounded-full text-sm outline-none bg-[#F0EEE8] text-[#3B2A0E] focus:ring-2 focus:ring-[#8DC63F]"
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-2">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1.5 px-1">
                            Kata Sandi
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan kata sandi..."
                                className="w-full px-5 py-4 rounded-full text-sm outline-none pr-12 bg-[#F0EEE8] text-[#3B2A0E] focus:ring-2 focus:ring-[#8DC63F]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="text-right mb-5">
                        <Link to="/forgot-password" className="text-sm font-medium text-[#E05C3A] hover:underline">
                            Lupa Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-4 rounded-full text-white font-semibold text-base transition hover:opacity-90 mb-5 disabled:opacity-60 cursor-pointer shadow"
                        style={{ backgroundColor: "#8DC63F" }}
                    >
                        {isPending ? "Memproses..." : "Masuk"}
                    </button>

                    <p className="text-center text-sm" style={{ color: "#6B5A3E" }}>
                        Belum punya akun?{" "}
                        <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                            Daftar Sekarang
                        </Link>
                    </p>
                </form>

                {/* Mascot decoration */}
                <div className="hidden lg:flex flex-col items-center relative mt-10">
                    <div className="relative mb-4">
                        <div
                            className="px-6 py-4 rounded-2xl border-2 text-center"
                            style={{ backgroundColor: "#F0FFF0", borderColor: "#8DC63F" }}
                        >
                            <p
                                className="font-bold text-sm leading-snug"
                                style={{ color: "#5A8A00", fontFamily: "Georgia, serif" }}
                            >
                                CERITA SERU<br />SIAP<br />DIMULAI !!!
                            </p>
                        </div>
                        <div
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{
                                borderLeft: "10px solid transparent",
                                borderRight: "10px solid transparent",
                                borderTop: "12px solid #8DC63F",
                            }}
                        />
                    </div>
                    <img src="/poto/nunjuk.webp" className="w-48 h-auto" alt="Mascot NusaTales" />
                </div>
            </main>

            <Footer />
        </div>
    );
}
