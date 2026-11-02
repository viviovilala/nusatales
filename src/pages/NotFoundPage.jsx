import React from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import Footer from "../components/Footer";

export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200/80 shadow-sm">
                    <img
                        src="/poto/splash-senyum.webp"
                        className="w-32 h-auto mx-auto mb-6 object-contain"
                        alt="Maskot NusaTales"
                    />
                    <h1
                        className="text-3xl font-black mb-2"
                        style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                    >
                        Halaman Tidak Ditemukan
                    </h1>
                    <p className="text-sm text-neutral-600 mb-6">
                        Cerita atau halaman yang Anda cari mungkin telah dipindahkan atau belum tersedia.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/"
                            className="px-6 py-3 rounded-full text-white font-semibold text-sm shadow transition hover:opacity-95"
                            style={{ backgroundColor: "#8DC63F" }}
                        >
                            Ke Beranda
                        </Link>
                        <Link
                            to="/reels"
                            className="px-6 py-3 rounded-full text-amber-950 font-semibold text-sm border border-amber-300 hover:bg-amber-50 transition"
                        >
                            Tonton Reels
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
