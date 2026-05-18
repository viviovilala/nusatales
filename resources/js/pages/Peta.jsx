import { useState } from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../navbar/AppNavbar.jsx";

// Data legenda per pulau di Indonesia
const islandStories = {
    sumatra: {
        name: "Sumatra",
        stories: [
            { id: 3, title: "Malin Kundang", desc: "Kisah durhaka, kutukan batu, dan ombak abadi Sumatra Barat.", origin: "Sumatra Barat" }
        ],
        icon: "🌊",
        color: "#8DC63F"
    },
    jawa: {
        name: "Jawa",
        stories: [
            { id: 1, title: "Kisah Seribu Candi", desc: "Legenda Roro Jonggrang mendirikan candi dalam semalam.", origin: "Jawa Tengah" },
            { id: 2, title: "Timun Mas", desc: "Keberanian seorang gadis melarikan diri dari raksasa jahat.", origin: "Jawa Tengah" },
            { id: 5, title: "Sangkuriang", desc: "Legenda terciptanya Gunung Tangkuban Parahu di Jawa Barat.", origin: "Jawa Barat" }
        ],
        icon: "⛰️",
        color: "#D47C00"
    },
    kalimantan: {
        name: "Kalimantan",
        stories: [
            { id: "dummy-kalimantan-1", title: "Legenda Pesut Mahakam", desc: "Kisah mengharukan dua bersaudara yang berubah menjadi lumba-lumba air tawar.", origin: "Kalimantan Timur" }
        ],
        icon: "🐬",
        color: "#4A8F2A"
    },
    sulawesi: {
        name: "Sulawesi",
        stories: [
            { id: "dummy-sulawesi-1", title: "Legenda Danau Poso", desc: "Pertarungan naga penunggu danau yang melegenda.", origin: "Sulawesi Tengah" }
        ],
        icon: "🐉",
        color: "#2E5B82"
    },
    bali_nt: {
        name: "Bali & Nusa Tenggara",
        stories: [
            { id: "dummy-bali-1", title: "Legenda Calon Arang", desc: "Kisah pertempuran ilmu hitam di Kerajaan Kediri kuno.", origin: "Bali" }
        ],
        icon: "🎭",
        color: "#E29A26"
    },
    papua: {
        name: "Maluku & Papua",
        stories: [
            { id: "dummy-papua-1", title: "Kisah Burung Cendrawasih", desc: "Asal usul burung surga yang anggun dan berwarna-warni.", origin: "Papua" }
        ],
        icon: "🦜",
        color: "#A05A9C"
    }
};

export default function Peta() {
    const [selectedIsland, setSelectedIsland] = useState("jawa");

    const activeData = islandStories[selectedIsland];

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="peta" />

            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
                {/* Header */}
                <div className="text-center md:text-left">
                    <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8A7B5A" }}>NusaMandala</p>
                    <h1 className="text-4xl font-extrabold mt-1" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                        Peta Budaya & Cerita Rakyat
                    </h1>
                    <p className="text-sm mt-2 max-w-xl" style={{ color: "#6B5A3E" }}>
                        Jelajahi keanekaragaman warisan Nusantara. Pilih salah satu wilayah geografis pada peta interaktif untuk menemukan mitos, legenda, dan cerita rakyat setempat.
                    </p>
                </div>

                {/* Map Grid */}
                <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
                    {/* SVG Map Container */}
                    <div className="rounded-3xl border p-6 flex flex-col items-center justify-center relative shadow-lg min-h-[360px]" 
                         style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <div className="absolute top-4 left-4 flex gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-100" style={{ color: "#8A7B5A" }}>
                                🧭 Peta Interaktif
                            </span>
                        </div>

                        {/* Interactive Island Tabs */}
                        <div className="flex flex-wrap justify-center gap-2 mb-8 mt-6">
                            {Object.entries(islandStories).map(([key, data]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedIsland(key)}
                                    className="px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                                    style={{
                                        backgroundColor: selectedIsland === key ? data.color : "#F8F2E4",
                                        color: selectedIsland === key ? "#FFFFFF" : "#6B5A3E"
                                    }}
                                >
                                    <span>{data.icon}</span>
                                    <span>{data.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Stylized Geographical Layout (Visual Archipelago representation) */}
                        <div className="w-full max-w-2xl aspect-[2/1] relative flex items-center justify-center overflow-hidden rounded-3xl bg-[#1FCB70]">
                            <img
                                src="/poto/peta-legenda.webp"
                                className="absolute inset-0 h-full w-full object-cover opacity-90"
                                style={{ objectPosition: "50% 50%" }}
                                alt="Peta legenda Nusantara"
                            />
                            <div className="absolute inset-0 bg-white/5" />
                            {/* Sumatra */}
                            <button 
                                onClick={() => setSelectedIsland("sumatra")}
                                className="absolute left-[5%] top-[20%] w-[25%] h-[35%] rounded-full bg-cover flex items-center justify-center font-bold text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                                style={{ 
                                    backgroundColor: selectedIsland === "sumatra" ? "#8DC63F" : "#E2DCBF",
                                    color: selectedIsland === "sumatra" ? "#FFFFFF" : "#6B5A3E",
                                    opacity: selectedIsland === "sumatra" ? 0.95 : 0.72
                                }}
                            >
                                Sumatra {islandStories.sumatra.icon}
                            </button>

                            {/* Jawa */}
                            <button 
                                onClick={() => setSelectedIsland("jawa")}
                                className="absolute left-[20%] bottom-[10%] w-[30%] h-[15%] rounded-full bg-cover flex items-center justify-center font-bold text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                                style={{ 
                                    backgroundColor: selectedIsland === "jawa" ? "#D47C00" : "#E2DCBF",
                                    color: selectedIsland === "jawa" ? "#FFFFFF" : "#6B5A3E",
                                    opacity: selectedIsland === "jawa" ? 0.95 : 0.72
                                }}
                            >
                                Jawa {islandStories.jawa.icon}
                            </button>

                            {/* Kalimantan */}
                            <button 
                                onClick={() => setSelectedIsland("kalimantan")}
                                className="absolute left-[35%] top-[15%] w-[25%] h-[35%] rounded-2xl bg-cover flex items-center justify-center font-bold text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                                style={{ 
                                    backgroundColor: selectedIsland === "kalimantan" ? "#4A8F2A" : "#E2DCBF",
                                    color: selectedIsland === "kalimantan" ? "#FFFFFF" : "#6B5A3E",
                                    opacity: selectedIsland === "kalimantan" ? 0.95 : 0.72
                                }}
                            >
                                Kalimantan {islandStories.kalimantan.icon}
                            </button>

                            {/* Sulawesi */}
                            <button 
                                onClick={() => setSelectedIsland("sulawesi")}
                                className="absolute right-[25%] top-[20%] w-[18%] h-[30%] rounded-xl bg-cover flex items-center justify-center font-bold text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                                style={{ 
                                    backgroundColor: selectedIsland === "sulawesi" ? "#2E5B82" : "#E2DCBF",
                                    color: selectedIsland === "sulawesi" ? "#FFFFFF" : "#6B5A3E",
                                    opacity: selectedIsland === "sulawesi" ? 0.95 : 0.72
                                }}
                            >
                                Sulawesi {islandStories.sulawesi.icon}
                            </button>

                            {/* Bali & NT */}
                            <button 
                                onClick={() => setSelectedIsland("bali_nt")}
                                className="absolute right-[22%] bottom-[10%] w-[22%] h-[12%] rounded-full bg-cover flex items-center justify-center font-bold text-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                                style={{ 
                                    backgroundColor: selectedIsland === "bali_nt" ? "#E29A26" : "#E2DCBF",
                                    color: selectedIsland === "bali_nt" ? "#FFFFFF" : "#6B5A3E",
                                    opacity: selectedIsland === "bali_nt" ? 0.95 : 0.72
                                }}
                            >
                                Bali & NT {islandStories.bali_nt.icon}
                            </button>

                            {/* Papua */}
                            <button 
                                onClick={() => setSelectedIsland("papua")}
                                className="absolute right-[2%] top-[25%] w-[20%] h-[35%] rounded-full bg-cover flex items-center justify-center font-bold text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                                style={{ 
                                    backgroundColor: selectedIsland === "papua" ? "#A05A9C" : "#E2DCBF",
                                    color: selectedIsland === "papua" ? "#FFFFFF" : "#6B5A3E",
                                    opacity: selectedIsland === "papua" ? 0.95 : 0.72
                                }}
                            >
                                Papua {islandStories.papua.icon}
                            </button>
                        </div>
                    </div>

                    {/* Regional Stories Side Drawer */}
                    <div className="rounded-3xl border p-6 shadow-lg" 
                         style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                                 style={{ backgroundColor: "#FFF8EA" }}>
                                {activeData.icon}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide" style={{ color: "#8A7B5A" }}>Cerita Rakyat Wilayah</p>
                                <h3 className="text-2xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                    {activeData.name}
                                </h3>
                            </div>
                        </div>

                        {/* Stories List */}
                        <div className="space-y-4">
                            {activeData.stories.map((story) => (
                                <div key={story.id} className="rounded-2xl p-5 border border-dashed transition-all hover:bg-amber-50/20" 
                                     style={{ borderColor: "#E8DFC7" }}>
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h4 className="font-bold text-lg" style={{ color: "#3B2A0E" }}>{story.title}</h4>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" 
                                              style={{ backgroundColor: activeData.color }}>
                                            {story.origin}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B5A3E" }}>
                                        {story.desc}
                                    </p>
                                    {typeof story.id === "number" ? (
                                        <Link 
                                            to={`/animations/${story.id}`} 
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white transition hover:opacity-90 active:scale-95"
                                            style={{ backgroundColor: "#8DC63F" }}
                                        >
                                            ▶️ Tonton Sekarang
                                        </Link>
                                    ) : (
                                        <Link 
                                            to="/register" 
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition hover:bg-amber-100"
                                            style={{ backgroundColor: "#F8F2E4", color: "#6B5A3E" }}
                                        >
                                            🔐 Masuk Untuk Menonton
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
