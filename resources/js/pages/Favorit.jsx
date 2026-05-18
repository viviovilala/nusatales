import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getPublishedAnimations } from "../services/animationService";
import AppNavbar from "../navbar/AppNavbar.jsx";

export default function Favorit() {
    const { isAuthenticated } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;
        async function fetchFavorites() {
            try {
                // Dalam skenario demo, kita ambil video yang ada di database 
                // untuk ditampilkan di lemari buku favorit pengguna
                const response = await getPublishedAnimations({ per_page: 6 });
                if (!ignore) {
                    setFavorites(response.data ?? []);
                }
            } catch (e) {
                if (!ignore) setFavorites([]);
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }
        fetchFavorites();
        return () => { ignore = true; };
    }, []);

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="favorit" />

            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8A7B5A" }}>Rak Buku Anda</p>
                        <h1 className="text-4xl font-extrabold mt-1" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                            Cerita Favorit Saya
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>
                            Koleksi cerita pilihan dan seri animasi Nusantara yang telah Anda simpan.
                        </p>
                    </div>
                    <Link to="/" className="px-5 py-2.5 rounded-full text-xs font-bold text-white transition hover:opacity-90 active:scale-95 shadow-md" style={{ backgroundColor: "#3B2A0E" }}>
                        🏠 Kembali Ke Beranda
                    </Link>
                </div>

                {!isAuthenticated ? (
                    /* Not Authenticated State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed mt-6"
                         style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <div className="text-5xl mb-4">🔒</div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: "#3B2A0E" }}>Masuk Ke Akun Anda</h3>
                        <p className="text-sm max-w-sm mb-6" style={{ color: "#6B5A3E" }}>
                            Simpan seri cerita rakyat terpopuler dan catat riwayat menonton Anda dengan membuat akun NusaTales gratis.
                        </p>
                        <div className="flex gap-3">
                            <Link to="/login" className="px-5 py-2.5 rounded-full text-xs font-bold text-white transition hover:opacity-95" style={{ backgroundColor: "#8DC63F" }}>
                                Masuk Sekarang
                            </Link>
                            <Link to="/register" className="px-5 py-2.5 rounded-full text-xs font-bold border transition hover:bg-gray-50" style={{ borderColor: "#D1C9B0", color: "#6B5A3E" }}>
                                Daftar Akun
                            </Link>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="text-center py-12 text-[#6B5A3E] text-sm">Membuka lemari penyimpanan cerita...</div>
                ) : favorites.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-3xl border border-dashed mt-6"
                         style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <div className="text-5xl mb-4">📖</div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: "#3B2A0E" }}>Lemari Favorit Masih Kosong</h3>
                        <p className="text-sm max-w-sm mb-6" style={{ color: "#6B5A3E" }}>
                            Jelajahi petualangan menakjubkan di nusantara dan ketuk ikon hati pada video untuk menyimpannya di sini.
                        </p>
                        <Link to="/" className="px-6 py-3 rounded-full text-xs font-bold text-white shadow-md transition hover:opacity-90" style={{ backgroundColor: "#8DC63F" }}>
                            Mulai Jelajah Cerita
                        </Link>
                    </div>
                ) : (
                    /* Favorites Grid Shelf */
                    <div className="flex-1 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {favorites.map((item, index) => (
                                <div key={item.id} 
                                     className="rounded-2xl overflow-hidden shadow-md border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative" 
                                     style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                                    
                                    {/* Badge Episode/Penonton */}
                                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" 
                                         style={{ backgroundColor: "#8DC63F" }}>
                                        EPISODE {index + 1}
                                    </div>

                                    {/* Video / Image Poster */}
                                    <div className="aspect-video w-full relative flex items-center justify-center" 
                                         style={{ backgroundColor: "#EBDCB7" }}>
                                        <div className="text-5xl opacity-40">🎬</div>
                                        {item.thumbnail_url && (
                                            <img src={item.thumbnail_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                                        )}
                                    </div>

                                    {/* Info Body */}
                                    <div className="p-5 flex flex-col gap-2">
                                        <h3 className="font-bold text-lg leading-tight" style={{ color: "#3B2A0E" }}>
                                            {item.title}
                                        </h3>
                                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6B5A3E" }}>
                                            {item.description || "NusaTales premium folklore video series."}
                                        </p>
                                        
                                        {/* Action buttons */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed" style={{ borderColor: "#E8DFC7" }}>
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8A7B5A" }}>
                                                {item.counts?.likes ?? 12} Penonton
                                            </span>
                                            <Link 
                                                to={`/animations/${item.id}`} 
                                                className="px-4 py-2 rounded-full text-[11px] font-bold text-white shadow-sm transition hover:opacity-90"
                                                style={{ backgroundColor: "#3B2A0E" }}
                                            >
                                                ▶️ Tonton
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
