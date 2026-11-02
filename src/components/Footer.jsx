import React from "react";

export default function Footer() {
    return (
        <footer className="py-10 px-6 mt-auto" style={{ backgroundColor: "#5C3A1E" }}>
            <div className="max-w-7xl mx-auto">
                <h2 className="text-center text-3xl font-bold mb-6" style={{ color: "#8DC63F", fontFamily: "Georgia, serif" }}>
                    NusaTales
                </h2>
                <div className="flex items-center justify-center gap-8 mb-4 flex-wrap text-sm" style={{ color: "#F5F0E0" }}>
                    <a href="#about" className="transition hover:opacity-80">Tentang Kami</a>
                    <a href="#kredit" className="transition hover:opacity-80">Kredit Budaya</a>
                    <a href="#privasi" className="transition hover:opacity-80">Privasi</a>
                    <a href="#syarat" className="transition hover:opacity-80">Syarat & Ketentuan</a>
                </div>
                <div className="w-16 h-px mx-auto mb-4" style={{ backgroundColor: "#8DC63F" }}></div>
                <p className="text-center text-xs" style={{ color: "#C8B89A" }}>
                    © 2026 NusaTales: Sang Penjaga Cerita Nusantara.
                </p>
                <p className="text-center text-xs mt-1" style={{ color: "#C8B89A" }}>
                    Dibuat dengan cinta untuk warisan cerita rakyat dan budaya Indonesia.
                </p>
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-80 cursor-pointer"
                        style={{ backgroundColor: "#7A5230" }}
                        aria-label="Kembali ke atas"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5F0E0" strokeWidth="2.5">
                            <path d="M18 15l-6-6-6 6" />
                        </svg>
                    </button>
                </div>
            </div>
        </footer>
    );
}
