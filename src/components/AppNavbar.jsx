import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

function NavLinkItem({ to, isActive, children }) {
    return (
        <Link
            to={to}
            className="text-sm font-bold transition-colors duration-200 relative py-2 px-1"
            style={{ color: isActive ? "#8DC63F" : "#6B5A3E" }}
        >
            {children}
            {isActive && (
                <span
                    className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full transition-transform duration-200"
                    style={{ backgroundColor: "#8DC63F" }}
                />
            )}
        </Link>
    );
}

export default function AppNavbar() {
    const { isAuthenticated, profile, user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [visible, setVisible] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const lastScrollY = useRef(0);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const nextScrollY = window.scrollY;
            const scrollDelta = Math.abs(nextScrollY - lastScrollY.current);

            if (scrollDelta < 8) return;

            setVisible(nextScrollY < lastScrollY.current || nextScrollY < 12);
            lastScrollY.current = nextScrollY;
        };

        lastScrollY.current = window.scrollY;
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setVisible(true);
        setMenuOpen(false);
        lastScrollY.current = window.scrollY;
    }, [location.pathname]);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    const isCurrent = (path) => {
        if (path === "/" && location.pathname === "/") return true;
        if (path !== "/" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Kreator";

    return (
        <header
            className="px-4 sm:px-6 pt-3 pb-3 sticky top-2 z-50 transition-all duration-300 ease-in-out"
            style={{
                transform: visible ? "translateY(0)" : "translateY(-120%)",
                opacity: visible ? 1 : 0,
            }}
        >
            <nav className="max-w-7xl mx-auto bg-white/95 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center justify-between shadow-lg border border-amber-100/70">
                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-2 transition-transform duration-200 hover:scale-105"
                >
                    <img
                        src="/poto/logo.png"
                        className="h-9 w-auto object-contain"
                        alt="NusaTales Logo"
                    />
                </Link>

                {/* Primary navigation */}
                <div className="hidden md:flex items-center gap-6">
                    <NavLinkItem to="/" isActive={isCurrent("/")}>
                        Beranda
                    </NavLinkItem>
                    <NavLinkItem to="/animations" isActive={isCurrent("/animations")}>
                        Animasi
                    </NavLinkItem>
                    <NavLinkItem to="/reels" isActive={isCurrent("/reels")}>
                        Reels
                    </NavLinkItem>
                    {isAuthenticated && (
                        <>
                            <NavLinkItem to="/studio" isActive={isCurrent("/studio")}>
                                Studio
                            </NavLinkItem>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/studio/upload"
                                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
                                style={{ backgroundColor: "#8DC63F" }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Unggah
                            </Link>

                            {/* User Menu Dropdown */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-amber-200/80 hover:bg-amber-50/50 transition cursor-pointer text-xs font-bold text-amber-950"
                                >
                                    <span className="max-w-[120px] truncate">{displayName}</span>
                                    <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center text-xs">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-amber-100 py-2 z-50 text-sm">
                                        <div className="px-4 py-2 border-b border-neutral-100">
                                            <p className="font-bold text-neutral-800 truncate">{displayName}</p>
                                            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/studio"
                                            className="block px-4 py-2 text-neutral-700 hover:bg-amber-50 transition"
                                        >
                                            Studio Saya
                                        </Link>
                                        <Link
                                            to="/studio/upload"
                                            className="block px-4 py-2 text-neutral-700 hover:bg-amber-50 transition"
                                        >
                                            Unggah Animasi
                                        </Link>
                                        <Link
                                            to="/settings/profile"
                                            className="block px-4 py-2 text-neutral-700 hover:bg-amber-50 transition"
                                        >
                                            Pengaturan Profil
                                        </Link>
                                        <div className="border-t border-neutral-100 my-1" />
                                        <button
                                            type="button"
                                            onClick={handleSignOut}
                                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition cursor-pointer font-medium"
                                        >
                                            Keluar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-4 py-1.5 rounded-full text-xs font-bold transition hover:bg-amber-100/50"
                                style={{ color: "#3B2A0E" }}
                            >
                                Masuk
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                                style={{ backgroundColor: "#8DC63F" }}
                            >
                                Daftar
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}
