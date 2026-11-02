import { AppLink as Link } from "../app/ModalContext";
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Search, Menu, Plus, ChevronDown, UserRound, Clapperboard, LogOut, Settings } from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";
import StorageImage from "./StorageImage";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet";

const navigation = [
    { to: "/", label: "Beranda" },
    { to: "/reels", label: "Shorts" },
    { to: "/animations", label: "Jelajah" },
];

export default function AppNavbar() {
    const { isAuthenticated, profile, user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [search, setSearch] = useState("");
    const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Penjelajah";

    useEffect(() => {
        setMobileOpen(false);
        if (location.hash) {
            const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
            return () => cancelAnimationFrame(frame);
        }
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [location.pathname, location.hash]);

    function handleSearch(event) {
        event.preventDefault();
        setMobileOpen(false);
        navigate(`/animations${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
    }
    const searchForm = (mobile = false) => <form onSubmit={handleSearch} role="search" className={`nusa-search ${mobile ? "nusa-search-mobile" : "nusa-search-desktop"}`}>
        <label htmlFor={mobile ? "mobile-story-search" : "story-search"} className="sr-only">Cari cerita animasi</label>
        <input id={mobile ? "mobile-story-search" : "story-search"} type="search" value={search}
            onChange={(event) => setSearch(event.target.value)} placeholder="Cari cerita..." maxLength={120} />
        <button type="submit" aria-label="Cari cerita"><Search size={16} aria-hidden="true" /></button>
    </form>;

    return <header className="nusa-header">
        <a href="#main-content" className="nusa-skip-link" onClick={(event) => {
            const main = document.querySelector("main");
            if (main) { event.preventDefault(); main.tabIndex = -1; main.focus(); }
        }}>Lewati ke konten</a>
        <nav className="nusa-navbar" aria-label="Navigasi utama">
            <Link to="/" className="nusa-brand" aria-label="NusaTales — beranda">
                <img className="nusa-original-logo" src="/poto/logo.png" width="128" height="36" alt="NusaTales" />
            </Link>
            <div className="nusa-desktop-links">
                {navigation.map(({ to, label }) => <NavLink key={to} to={to} end={to === "/"}
                    className={({ isActive }) => `nusa-nav-link ${isActive ? "is-active" : ""}`}>{label}</NavLink>)}
                {isAuthenticated && <NavLink to="/studio" className={({ isActive }) => `nusa-nav-link ${isActive ? "is-active" : ""}`}>Studio</NavLink>}
            </div>
            <div className="nusa-nav-actions">
                {searchForm()}
                {isAuthenticated ? <>
                    <Link to="/studio/upload" className="nusa-button nusa-upload-link"><Plus size={15} aria-hidden="true" />Unggah</Link>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger className="nusa-account-trigger" aria-label={`Menu akun ${displayName}`}>
                            <span className="nusa-avatar">{profile?.avatar_path
                                ? <StorageImage path={profile.avatar_path} alt="" /> : displayName.charAt(0).toUpperCase()}</span>
                            <ChevronDown size={14} aria-hidden="true" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="nusa-dropdown" align="end" sideOffset={12}>
                                <DropdownMenu.Label className="nusa-dropdown-label">Halo, {displayName}</DropdownMenu.Label>
                                {profile?.username && <DropdownMenu.Item asChild><Link to={`/u/${profile.username}`}><UserRound size={16} />Profil saya</Link></DropdownMenu.Item>}
                                <DropdownMenu.Item asChild><Link to="/studio"><Clapperboard size={16} />Studio saya</Link></DropdownMenu.Item>
                                <DropdownMenu.Item asChild><Link to="/settings/profile"><Settings size={16} />Pengaturan profil</Link></DropdownMenu.Item>
                                <DropdownMenu.Separator className="nusa-dropdown-separator" />
                                <DropdownMenu.Item onSelect={async () => { await signOut(); navigate("/"); }}><LogOut size={16} />Keluar</DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </> : <Link to="/login" className="nusa-button nusa-button-brown nusa-login-link">Masuk<span className="nusa-login-extra"> / Daftar</span></Link>}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild><button className="nusa-icon-button nusa-mobile-trigger" aria-label="Buka menu navigasi"><Menu size={22} /></button></SheetTrigger>
                    <SheetContent>
                        <SheetTitle className="nusa-brand">NusaTales</SheetTitle>
                        <SheetDescription className="nusa-sheet-description">Cerita Nusantara, selalu dekat.</SheetDescription>
                        {searchForm(true)}
                        <div className="nusa-mobile-links">
                            {navigation.map(({ to, label }) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobileOpen(false)}>{label}</NavLink>)}
                            {isAuthenticated && <Link to="/studio" onClick={() => setMobileOpen(false)}>Studio saya</Link>}
                        </div>
                        <Link to={isAuthenticated ? "/studio/upload" : "/register"} onClick={() => setMobileOpen(false)} className="nusa-button">
                            {isAuthenticated ? "Bagikan karyamu" : "Mulai petualangan"}<Plus size={16} />
                        </Link>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    </header>;
}
