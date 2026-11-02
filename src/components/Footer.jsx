import { AppLink as Link } from "../app/ModalContext";
import React from "react";

import { ArrowUp } from "lucide-react";

export default function Footer() {
    return <footer className="nusa-footer">
        <Link to="/" className="nusa-footer-brand">NusaTales</Link>
        <nav aria-label="Navigasi footer" className="nusa-footer-links">
            <Link to="/#tentang-kami">Tentang kami</Link>
            <Link to="/animations">Jelajah cerita</Link>
            <Link to="/reels">Shorts budaya</Link>
            <Link to="/studio/upload">Jadi kreator</Link>
        </nav>
        <p>© {new Date().getFullYear()} NusaTales · Sang Penjaga Cerita Nusantara.</p>
        <p>Dibuat dengan cinta untuk warisan cerita dan budaya Indonesia.</p>
        <a className="nusa-motif-credit" href="https://commons.wikimedia.org/wiki/File:Ragam_Hias_Jawa_-_Kawung_(Garis).svg" target="_blank" rel="noreferrer">Motif Kawung oleh Pinerineks · CC0</a>
        <button className="nusa-back-top" onClick={() => window.scrollTo({ top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })} aria-label="Kembali ke atas"><ArrowUp size={16} /></button>
    </footer>;
}
