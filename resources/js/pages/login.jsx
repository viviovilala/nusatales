import { useState, useTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import AppNavbar from "../navbar/AppNavbar.jsx";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const { setUser } = useAuth();

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");

        startTransition(async () => {
            try {
                const { user } = await login({
                    email,
                    password,
                    device_name: "react-web",
                });

                setUser(user);
                navigate("/dashboard");
            } catch (error) {
                const message =
                    error.response?.data?.message ||
                    "Login failed. Please check your credentials.";

                setErrorMessage(message);
            }
        });
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="login" />

            {/* Main content */}
            <div className="flex-1 flex items-start justify-center gap-8 px-4 pt-10 pb-16 relative">
                {/* Login Card */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-sm border"
                    style={{ borderColor: "#C8E6A0" }}
                >
                    <h1 className="text-4xl font-bold text-center mb-8" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Masuk</h1>

                    {/* Email */}
                    <div className="mb-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Masukkan email anda..."
                            className="w-full px-5 py-4 rounded-full text-sm outline-none transition"
                            style={{ backgroundColor: "#F0EEE8", color: "#3B2A0E", border: "none" }}
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-2 relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Masukkan password anda..."
                            className="w-full px-5 py-4 rounded-full text-sm outline-none pr-12"
                            style={{ backgroundColor: "#F0EEE8", color: "#3B2A0E", border: "none" }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Forgot password */}
                    <div className="text-right mb-5">
                        <a href="#" className="text-sm font-medium" style={{ color: "#E05C3A" }}>Lupa Password ?</a>
                    </div>

                    {errorMessage ? (
                        <div
                            className="mb-4 rounded-2xl px-4 py-3 text-sm"
                            style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}
                        >
                            {errorMessage}
                        </div>
                    ) : null}

                    {/* Login button */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-4 rounded-full text-white font-semibold text-base transition hover:opacity-90 mb-5 disabled:opacity-60"
                        style={{ backgroundColor: "#8DC63F" }}
                    >
                        {isPending ? "Memproses..." : "Masuk"}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px" style={{ backgroundColor: "#E0D8C8" }}></div>
                        <span className="text-sm" style={{ color: "#9B8E7A" }}>Atau masuk dengan akun</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: "#E0D8C8" }}></div>
                    </div>

                    {/* Social login */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {/* Facebook */}
                        <button type="button" className="flex items-center justify-center py-3 rounded-2xl border transition hover:bg-gray-50" style={{ borderColor: "#E0D8C8" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </button>
                        {/* Google */}
                        <button type="button" className="flex items-center justify-center py-3 rounded-2xl border transition hover:bg-gray-50" style={{ borderColor: "#E0D8C8" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        </button>
                        {/* Apple */}
                        <button type="button" className="flex items-center justify-center py-3 rounded-2xl border transition hover:bg-gray-50" style={{ borderColor: "#E0D8C8" }}>
                            <svg width="22" height="22" viewBox="0 0 814 1000" fill="#000">
                                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-36.8-162.3-105.1C110.7 717.8 67 610 67 507.9c0-190.3 124.4-290.9 246.8-290.9 64.7 0 118.5 42.1 158.8 42.1 38.5 0 98.5-44.7 171.5-44.7 27.5 0 108.2 2.6 168.4 80.6zm-198.3-167.8c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                            </svg>
                        </button>
                    </div>

                    {/* Register link */}
                    <p className="text-center text-sm" style={{ color: "#6B5A3E" }}>
                        Tidak mempunyai akun?{" "}
                        <Link to="/register" className="font-semibold" style={{ color: "#3B82F6" }}>Daftar</Link>
                    </p>
                </form>

                {/* Mascot Sitompel */}
                <div className="hidden lg:flex flex-col items-center relative mt-10">
                    {/* Speech bubble */}
                    <div className="relative mb-4">
                        <div className="px-6 py-4 rounded-2xl border-2 text-center" style={{ backgroundColor: "#F0FFF0", borderColor: "#8DC63F" }}>
                            <p className="font-bold text-sm leading-snug" style={{ color: "#5A8A00", fontFamily: "Georgia, serif" }}>
                                CERITA SERU<br />SIAP<br />DIMULAI !!!
                            </p>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0" style={{
                            borderLeft: "10px solid transparent",
                            borderRight: "10px solid transparent",
                            borderTop: "12px solid #8DC63F"
                        }}></div>
                    </div>
                    <img src="/poto/nunjuk.webp" className="w-48 h-auto" />
                </div>
            </div>

            {/* Footer */}
            <footer className="py-10 px-4" style={{ backgroundColor: "#5C3A1E" }}>
                <h2 className="text-center text-3xl font-bold mb-6" style={{ color: "#8DC63F", fontFamily: "Georgia, serif" }}>NusaTales</h2>
                <div className="flex items-center justify-center gap-8 mb-4 flex-wrap">
                    {["Tentang Kami", "Kredit Budaya", "Privasi", "Syarat & Ketentuan"].map((item, i) => (
                        <a key={item} href="#" className="text-sm transition hover:opacity-80" style={{ color: "#F5F0E0" }}>
                            {item}
                            {i === 1 && <span className="block w-8 h-0.5 mx-auto mt-1" style={{ backgroundColor: "#8DC63F" }}></span>}
                        </a>
                    ))}
                </div>
                <div className="w-16 h-px mx-auto mb-4" style={{ backgroundColor: "#8DC63F" }}></div>
                <p className="text-center text-xs" style={{ color: "#C8B89A" }}>© 2026 NusaTales: Sang Penjaga Cerita Nusantara.</p>
                <p className="text-center text-xs mt-1" style={{ color: "#C8B89A" }}>Dibuat dengan cinta untuk warisan budaya.</p>

                {/* Scroll to top */}
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-80"
                        style={{ backgroundColor: "#7A5230" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5F0E0" strokeWidth="2.5">
                            <path d="M18 15l-6-6-6 6"/>
                        </svg>
                    </button>
                </div>
            </footer>
        </div>
    );
}
