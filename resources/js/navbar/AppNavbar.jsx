import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function NavItem({ to, href, isActive, children }) {
    const className = "text-sm font-bold transition-colors duration-200 relative py-2 px-1";
    const style = { color: isActive ? "#8DC63F" : "#6B5A3E" };
    const indicator = isActive ? (
        <span
            className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full transition-transform duration-200"
            style={{ backgroundColor: "#8DC63F" }}
        />
    ) : null;

    if (to) {
        return (
            <Link to={to} className={className} style={style}>
                {children}
                {indicator}
            </Link>
        );
    }

    return (
        <a href={href} className={className} style={style}>
            {children}
            {indicator}
        </a>
    );
}

export default function AppNavbar({ current = "home" }) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const nextScrollY = window.scrollY;
            const scrollDelta = Math.abs(nextScrollY - lastScrollY.current);

            if (scrollDelta < 8) {
                return;
            }

            setVisible(nextScrollY < lastScrollY.current || nextScrollY < 12);
            lastScrollY.current = nextScrollY;
        };

        lastScrollY.current = window.scrollY;
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setVisible(true);
        lastScrollY.current = window.scrollY;
    }, [location.pathname]);

    const activeNav = useMemo(() => {
        if (location.pathname === "/") return "home";
        if (location.pathname.startsWith("/shorts")) return "shorts";
        if (location.pathname.startsWith("/jelajah")) return "jelajah";
        if (location.pathname.startsWith("/peta")) return "peta";
        if (location.pathname.startsWith("/favorit")) return "favorit";
        return current;
    }, [current, location.pathname]);

    return (
        <div 
            className="px-6 pt-2 py-6 sticky top-2 z-50 transition-all duration-500 ease-in-out transform"
            style={{
                transform: visible ? "translateY(0)" : "translateY(-120%)",
                opacity: visible ? 1 : 0
            }}
        >
            <nav className="max-w-7xl mx-auto bg-white rounded-4xl px-6 py-3 flex items-center justify-between shadow-xl border border-amber-100/50">
                {/* Custom Logo Image Replacement */}
                <Link 
                    to="/" 
                    onClick={(e) => {
                        if (window.location.pathname === "/") {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            window.history.pushState(null, "", "/");
                        } else {
                            window.scrollTo(0, 0);
                        }
                    }}
                    className="flex items-center transition-transform duration-300 hover:scale-105"
                >
                    <img 
                        src="/poto/logo.png" 
                        className="h-10 w-auto object-contain" 
                        alt="NusaTales Logo" 
                    />
                </Link>

                {/* Navbar Links with active state and color transition animations */}
                <div className="hidden md:flex items-center gap-4">
                    <NavItem to="/" isActive={activeNav === "home"}>
                        Beranda
                    </NavItem>
                    <NavItem to="/shorts" isActive={activeNav === "shorts"}>
                        Shorts
                    </NavItem>
                    <NavItem to="/jelajah" isActive={activeNav === "jelajah"}>
                        Jelajah
                    </NavItem>
                    <NavItem to="/peta" isActive={activeNav === "peta"}>
                        Peta
                    </NavItem>
                    <NavItem to="/favorit" isActive={activeNav === "favorit"}>
                        Favorit
                    </NavItem>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/api/test"
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition hover:bg-amber-50/50"
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
                            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition hover:opacity-90 shadow-sm"
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
                            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition hover:opacity-90 shadow-sm"
                            style={{ backgroundColor: "#3B2A0E" }}
                        >
                            Daftar
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition hover:opacity-90 shadow-sm"
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
