import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function NavAnchor({ href, children }) {
    return (
        <a
            href={href}
            className="text-sm font-medium transition-colors hover:text-amber-700"
            style={{ color: "#6B5A3E" }}
        >
            {children}
        </a>
    );
}

export default function AppNavbar({ current = "home" }) {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="px-6 pt-4 sticky top-4 z-50">
            <nav className="max-w-6xl mx-auto bg-white rounded-2xl px-6 py-3 flex items-center justify-between shadow-sm">
                <Link to="/" className="flex items-center gap-2">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <polygon points="14,2 26,14 14,26 2,14" fill="#C8960C" />
                        <polygon points="14,6 22,14 14,22 6,14" fill="#F5C842" />
                    </svg>
                    <span
                        className="font-bold text-xl"
                        style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                    >
                        NusaTales
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <NavAnchor href="/#hero">Beranda</NavAnchor>
                    <NavAnchor href="/#series-populer">Shorts</NavAnchor>
                    <NavAnchor href="/#jelajah">Jelajah</NavAnchor>
                    <NavAnchor href="/#creator-section">Kreator</NavAnchor>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/api/test"
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition"
                        style={{ borderColor: "#D1C9B0", color: "#6B5A3E" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        Cari Cerita 
                    </a>

                    {isAuthenticated ? (
                        <Link
                            to={user?.role === "admin" ? "/admin/studio" : "/dashboard"}
                            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ backgroundColor: "#3B2A0E" }}
                        >
                            {user?.role === "admin"
                                ? "Admin Panel"
                                : user?.role === "kreator"
                                    ? "Dashboard"
                                    : "Akun"}
                        </Link>
                    ) : current === "login" ? (
                        <Link
                            to="/register"
                            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ backgroundColor: "#3B2A0E" }}
                        >
                            Daftar
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ backgroundColor: "#3B2A0E" }}
                        >
                            Masuk
                        </Link>
                    )}
                </div>
            </nav>
        </div>
    );
}
