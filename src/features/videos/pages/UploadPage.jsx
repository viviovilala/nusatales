import React from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";

export default function UploadPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
                <div className="mb-6">
                    <Link to="/studio" className="text-xs font-bold text-amber-800 hover:underline">
                        ← Kembali ke Studio
                    </Link>
                    <h1
                        className="text-3xl font-black text-[#3B2A0E] mt-2"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        Unggah Video Cerita Rakyat
                    </h1>
                    <p className="text-sm text-neutral-600">
                        Pipa pengunggahan media TUS/Supabase Storage akan dihubungkan di Slice 3.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-amber-200/70 shadow-sm text-center">
                    <div className="border-2 border-dashed border-amber-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-amber-50/40">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-amber-700 mb-4">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <h4 className="font-bold text-neutral-800 mb-1">Pilih Video Animasi (MP4 / WebM)</h4>
                        <p className="text-xs text-neutral-500 max-w-sm mb-4">
                            Maksimal 100 MB, durasi hingga 180 detik, rasio disarankan 9:16 (vertikal).
                        </p>
                        <button
                            type="button"
                            disabled
                            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-neutral-400 cursor-not-allowed"
                        >
                            Menunggu Konfigurasi Supabase Storage
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
