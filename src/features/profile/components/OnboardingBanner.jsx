import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export default function OnboardingBanner() {
    const { profile, isAuthenticated } = useAuth();
    const [dismissed, setDismissed] = useState(false);

    if (!isAuthenticated || dismissed || (profile && profile.username)) {
        return null;
    }

    return (
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 shadow-md relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                        <img
                            src="/poto/splash-senyum.webp"
                            className="w-9 h-9 object-contain"
                            alt="Maskot"
                        />
                    </div>
                    <div>
                        <h4 className="font-bold text-base leading-tight">
                            Lengkapi Username Publik Anda!
                        </h4>
                        <p className="text-xs text-amber-100 mt-0.5">
                            Pilih @username unik Anda agar penonton dapat menemukan dan mengunjungi portofolio cerita Anda.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                        to="/settings/profile"
                        className="px-4 py-2 rounded-full text-xs font-bold text-amber-950 bg-white hover:bg-amber-50 shadow-sm transition"
                    >
                        Pilih Username
                    </Link>
                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        className="p-1.5 text-white/80 hover:text-white transition cursor-pointer"
                        aria-label="Tutup pesan"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
