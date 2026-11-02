import React from "react";
import AppNavbar from "../../../components/AppNavbar";
import { Link } from "react-router-dom";

export default function ReelsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-950 text-white">
            <AppNavbar />

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
                    <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Reels Cerita Nusantara</h1>
                    <p className="text-sm text-neutral-400 mb-6">
                        Pemain video vertikal dan feed animasi budaya sedang dalam tahap perakitan (Slice 4).
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link
                            to="/studio/upload"
                            className="px-5 py-2.5 rounded-full text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition"
                        >
                            Mulai Unggah Video
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
