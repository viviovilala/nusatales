import StorageImage, { useStorageImageUrl } from "../../../components/StorageImage";
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { profileRepository } from "../profileRepository";
import { videoRepository } from "../../videos/videoRepository";

export default function PublicProfilePage() {
    const { username } = useParams();
    const [creator, setCreator] = useState(null);
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchCreatorData() {
            setIsLoading(true);
            setNotFound(false);

            try {
                const { data: profileData, error: profileErr } =
                    await profileRepository.getProfileByUsername(username);

                if (profileErr || !profileData) {
                    if (isMounted) setNotFound(true);
                    return;
                }

                if (isMounted) {
                    setCreator(profileData);
                }

                // Fetch published videos by creator
                const { data: videoData } =
                    await videoRepository.getCreatorPublishedVideos(profileData.id);

                if (isMounted) {
                    setVideos(videoData || []);
                }
            } catch (err) {
                console.error("[PublicProfilePage] Error fetching creator:", err);
                if (isMounted) setNotFound(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        if (username) {
            fetchCreatorData();
        }

        return () => {
            isMounted = false;
        };
    }, [username]);

    const avatarUrl = useStorageImageUrl(creator?.avatar_path);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
                <AppNavbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </main>
                <Footer />
            </div>
        );
    }

    if (notFound || !creator) {
        return (
            <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
                <AppNavbar />
                <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-amber-200/80 shadow-sm">
                        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold">?</span>
                        </div>
                        <h2
                            className="text-2xl font-black text-[#3B2A0E] mb-2"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Kreator Tidak Ditemukan
                        </h2>
                        <p className="text-sm text-neutral-600 mb-6">
                            Profil dengan username <span className="font-bold">@{username}</span> belum terdaftar di NusaTales.
                        </p>
                        <Link
                            to="/reels"
                            className="inline-flex px-6 py-2.5 rounded-full text-white text-xs font-bold shadow hover:opacity-95"
                            style={{ backgroundColor: "#8DC63F" }}
                        >
                            Jelajahi Reels Lainnya
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const initial = (creator.display_name || creator.username || "K").charAt(0).toUpperCase();

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-4xl p-8 border border-amber-200/80 shadow-sm mb-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-100 border-4 border-amber-50 shadow-md flex items-center justify-center shrink-0">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={creator.display_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-black text-amber-800">{initial}</span>
                            )}
                        </div>

                        <div className="flex-1">
                            <h1
                                className="text-2xl sm:text-3xl font-black text-[#3B2A0E]"
                                style={{ fontFamily: "Georgia, serif" }}
                            >
                                {creator.display_name}
                            </h1>
                            <p className="text-sm font-bold text-amber-800 mt-0.5">
                                @{creator.username || "kreator"}
                            </p>

                            {creator.bio && (
                                <p className="text-sm text-neutral-700 mt-3 leading-relaxed max-w-2xl">
                                    {creator.bio}
                                </p>
                            )}

                            <div className="flex items-center justify-center sm:justify-start gap-6 mt-4 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-600">
                                <div>
                                    <span className="font-bold text-neutral-900 text-sm">
                                        {videos.length}
                                    </span>{" "}
                                    Karya Animasi
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Published Videos Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2
                            className="text-2xl font-black text-[#3B2A0E]"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Karya Animasi
                        </h2>
                        <span className="text-xs font-bold text-neutral-500">
                            {videos.length} video dipublikasikan
                        </span>
                    </div>

                    {videos.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-amber-200/60 shadow-sm">
                            <img
                                src="/poto/splash-senyum.webp"
                                className="w-24 h-auto mx-auto mb-4 object-contain opacity-80"
                                alt="Maskot"
                            />
                            <h3 className="font-bold text-neutral-800 mb-1">Belum Ada Karya yang Dipublikasikan</h3>
                            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                                Kreator ini belum merilis animasi cerita rakyat ke publik. Nantikan karya terbarunya!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {videos.map((vid) => {
                                return (
                                    <Link
                                        key={vid.id}
                                        to={`/reels/${vid.id}`}
                                        className="group relative bg-white rounded-2xl overflow-hidden border border-amber-200/70 shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="aspect-[9/14] bg-neutral-900 relative overflow-hidden">
                                            <StorageImage
                                                path={vid.thumbnail_path}
                                                fallbackSrc="/poto/hero-roro-action.webp"
                                                alt={vid.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                            {vid.duration_seconds && (
                                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono font-bold">
                                                    {vid.duration_seconds}s
                                                </span>
                                            )}
                                            <div className="absolute bottom-2 left-2 right-2 text-white">
                                                <p className="font-bold text-xs line-clamp-2 leading-tight">
                                                    {vid.title}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
