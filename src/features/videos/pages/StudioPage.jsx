import React from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { useAuth } from "../../auth/AuthProvider";

export default function StudioPage() {
    const { user, profile } = useAuth();
    const displayName = profile?.display_name || user?.user_metadata?.display_name || "Kreator";

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                            Studio Kreator
                        </span>
                        <h1
                            className="text-3xl font-black text-[#3B2A0E]"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Halo, {displayName}
                        </h1>
                        <p className="text-sm text-neutral-600">
                            Kelola draf video animasi cerita rakyat dan publikasikan ke penonton.
                        </p>
                    </div>

                    <Link
                        to="/studio/upload"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white shadow-sm transition hover:opacity-90 self-start md:self-auto"
                        style={{ backgroundColor: "#8DC63F" }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Unggah Video Baru
                    </Link>
                </div>

                {/* Video list placeholder / container */}
                <div className="bg-white rounded-3xl p-8 border border-amber-200/70 shadow-sm text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                            <line x1="7" y1="2" x2="7" y2="22" />
                            <line x1="17" y1="2" x2="17" y2="22" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">Belum Ada Video di Studio</h3>
                    <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
                        Unggah karya animasi cerita daerah pertama Anda. Video akan tersimpan sebagai draf sampai Anda siap mempublikasikannya.
                    </p>
                    <Link
                        to="/studio/upload"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 transition"
                    >
                        Buka Formulir Unggah
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
