import React from "react";
import { useParams, Link } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";

export default function PublicProfilePage() {
    const { username } = useParams();

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
                <div className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-sm text-center">
                    <div className="w-20 h-20 bg-amber-200 text-amber-900 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">
                        {username ? username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <h1
                        className="text-2xl font-black text-[#3B2A0E] mb-1"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        @{username}
                    </h1>
                    <p className="text-sm text-neutral-500 mb-6">
                        Profil kreator dan portofolio animasi budaya.
                    </p>
                    <div className="inline-flex gap-2">
                        <Link
                            to="/reels"
                            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition"
                        >
                            Tonton Karya di Reels
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
