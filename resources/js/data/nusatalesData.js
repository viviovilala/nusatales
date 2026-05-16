export const mascotImage = "/poto/nunjuk.webp";

export function mockup(name) {
    return encodeURI(`/assets/nusatales/mockups/${name}`);
}

export const mockups = {
    logo: mockup("LOGO BRAND NUATALES.png"),
    home: mockup("Lakon & NusaSaga_ Beranda Animasi.png"),
    shorts: mockup("SHORT.png"),
    explore: mockup("Jelajah _ KISAH.png"),
    favorite: mockup("Favorit.png"),
    login: mockup("Login.png"),
    premium: mockup("NusaAdhi & NusaKoin_ Langganan & Dompet.png"),
    studio: mockup("NusaKarya_ Dasbor Kreator (Detail Tinggi).png"),
    karya: mockup("Profil Kreator_ Studio Jati.png"),
    channel: mockup("Profil Kreator_ Studio Jati-1.png"),
    profile: mockup("Profil_ Sang Penjelajah Budaya.png"),
    watch: mockup("Tonton_ Kisah & Diskusi Budaya.png"),
    upload: mockup("Unggah_ Penayangan Animasi Baru.png"),
    store: mockup("NusaToko_ Pasar Aset Digital Nusantara.png"),
    challenge: mockup("Event_ Sayembara Nusantara.png"),
    langlang: mockup("NusaLanglang_ Progres Pengetahuan.png"),
    mapDefault: mockup("NusaLanglang_ Progres Pengetahuan-4.png"),
    mapRegion: mockup("NusaLanglang_ Progres Pengetahuan-5.png"),
    mapStory: mockup("NusaLanglang_ Progres Pengetahuan-6.png"),
};

export const categories = [
    "Legenda",
    "Mitologi",
    "Komedi",
    "Petualangan",
    "Misteri",
    "Romantis",
];

export const genres = [
    "All Genre",
    "SC-FI",
    "Fantasy",
    "Mystery",
    "Drama",
    "Romance",
    "Thriller",
];

export const imagePool = [
    mockups.explore,
    mockups.favorite,
    mockups.home,
    mockups.shorts,
    mockups.watch,
    mockups.store,
    mockups.karya,
    mockups.channel,
];

export const featuredVideo = {
    id: 1,
    slug: "roro-jonggrang",
    title: "RORO JONGGRANG",
    subtitle: "Temukan rahasia di balik terciptanya seribu candi dalam 1 malam melalui kisah cinta dan janji yang terlanggar.",
    image: mockups.explore,
    creator: "Adi Bagas Koro",
};

export const seriesPopular = [
    {
        id: 1,
        slug: "kisah-seribu-candi",
        title: "KISAH SERIBU CANDI",
        creator: "Afiananr",
        description: "Temukan rahasia di balik terciptanya seribu candi dalam 1 malam melalui kisah cinta dan janji yang terlanggar.",
        episodes: 12,
        views: "850K",
        likes: "12.8 M",
        image: mockups.favorite,
        genre: "Romance, Action, Drama",
    },
    {
        id: 2,
        slug: "candi-borobudur",
        title: "Candi Borobudur",
        creator: "Studio Jati",
        description: "Kisah megah pembangunan candi terbesar di dunia yang menyimpan relief kebijaksanaan.",
        episodes: 10,
        views: "640K",
        likes: "12.8 M",
        image: mockups.home,
        genre: "Legenda, Edukasi",
    },
    {
        id: 3,
        slug: "kisah-nusantara",
        title: "Kisah Nusantara",
        creator: "LaluLalang",
        description: "Kumpulan cerita legenda dan mitologi dari Sulawesi, Jawa, Bali, dan pesisir timur.",
        episodes: 10,
        views: "520K",
        likes: "9.4 M",
        image: mockups.shorts,
        genre: "Mitologi, Fantasi",
    },
    {
        id: 4,
        slug: "malin-kundang",
        title: "Malin Kundang",
        creator: "Legenda Pesisir",
        description: "Cerita anak durhaka yang dikutuk menjadi batu setelah melupakan asal-usulnya.",
        episodes: 10,
        views: "480K",
        likes: "8.2 M",
        image: mockups.watch,
        genre: "Drama, Legenda",
    },
    {
        id: 5,
        slug: "timun-mas",
        title: "Timun Mas",
        creator: "Studio Jati",
        description: "Kisah gadis pemberani melawan raksasa dengan bekal pemberian ajaib.",
        episodes: 10,
        views: "410K",
        likes: "7.1 M",
        image: mockups.shorts,
        genre: "Petualangan, Fantasi",
    },
];

export const latestEpisodes = [
    { id: 101, slug: "tragedi-sumpah-palapa", title: "Tragedi Sumpah Palapa", series: "Legenda Gajah Mada", episode: "Ep 24", age: "23 JAM YANG LALU", image: mockups.watch },
    { id: 102, slug: "perjalanan-dengan-siluman", title: "Perjalanan Dengan Siluman", series: "Timun Mas", episode: "Ep 24", age: "2 JAM YANG LALU", image: mockups.shorts },
    { id: 103, slug: "janji-yang-dingkari", title: "Janji yang Dingkari", series: "Kisah Seribu Candi", episode: "Ep 9", age: "5 JAM YANG LALU", image: mockups.home },
    { id: 104, slug: "penebusan-dosa", title: "Penebusan Dosa", series: "Kisah Seribu Candi", episode: "Ep 10", age: "10 JAM YANG LALU", image: mockups.favorite },
    { id: 105, slug: "pernikahan-malin-kundang", title: "Pernikahan Malin Kundang", series: "Malin Kundang", episode: "Ep 8", age: "31 JAM YANG LALU", image: mockups.watch },
];

export const exploreCards = Array.from({ length: 12 }, (_, index) => {
    const source = seriesPopular[index % seriesPopular.length];

    return {
        ...source,
        id: 200 + index,
        slug: `${source.slug}-${index + 1}`,
        title: index % 3 === 0 ? "Kisah Ceribu Candi" : source.title,
        image: imagePool[index % imagePool.length],
        badge: index < 4 ? "Episode Baru" : null,
    };
});

export const shorts = [
    {
        id: 301,
        slug: "kisah-cinta-kian-santang",
        title: "KISAH CINTA KIAN SANTANG",
        creator: "FerdyOwsem112",
        genre: "Comedi, Drama, Fantasy",
        description: "Kian Santang, putra Prabu Siliwangi yang gagah perkasa, justru jatuh hati pada sosok yang paling tak terduga.",
        audio: "JENNIE - LIKE JENNIE",
        views: "890rb x Ditonton",
        image: mockups.shorts,
    },
    {
        id: 302,
        slug: "misteri-candi-tersembunyi",
        title: "MISTERI CANDI TERSEMBUNYI",
        creator: "NinaSpark99",
        genre: "Mystery, Drama",
        description: "Dua sahabat menemukan gerbang batu yang menyimpan kisah kuno di balik kabut pegunungan.",
        audio: "Suara Gamelan Senja",
        views: "1.2jt x Ditonton",
        image: mockups.explore,
    },
    {
        id: 303,
        slug: "legenda-ratu-kidul",
        title: "LEGENDA RATU KIDUL",
        creator: "MaxGlow45",
        genre: "Legenda, Fantasy",
        description: "Ombak selatan memanggil penjelajah muda untuk memahami janji penjaga laut.",
        audio: "Ombak Pantai Selatan",
        views: "670rb x Ditonton",
        image: mockups.mapStory,
    },
    {
        id: 304,
        slug: "timun-mas-hutan-ajaib",
        title: "TIMUN MAS: HUTAN AJAIB",
        creator: "NadiaVibe77",
        genre: "Adventure, Family",
        description: "Benih ajaib menuntun Timun Mas melewati hutan yang berubah setiap malam.",
        audio: "Jejak Hutan",
        views: "1jt x Ditonton",
        image: mockups.shorts,
    },
];

export const creators = [
    {
        id: 1,
        slug: "kadek-wijaya",
        name: "Kadek Wijaya",
        subtitle: "Sang Penjaga Legenda (Guardian of Legends)",
        followers: "8.2K",
        totalEpisodes: 124,
        views: "850rb",
        totalSeries: 12,
        avatar: mockups.studio,
        image: mockups.channel,
        verified: true,
    },
    { id: 2, slug: "afiananr", name: "Afiananr", followers: "101K", avatar: mockups.favorite },
    { id: 3, slug: "kadek-wijaya-2", name: "Kadek Wijaya", followers: "42K", avatar: mockups.karya },
    { id: 4, slug: "dini-sastra", name: "DiniSastra", followers: "21K", avatar: mockups.profile },
];

export const favoriteItems = [
    {
        id: 1,
        title: "Kisah Ceribu Candi",
        genre: "Romance, Action, Drama",
        updated: "Terakhir di tonton 1 hari yang lalu",
        description: "Temukan rahasia di balik terciptanya seribu candi dalam 1 malam melalui kisah cinta dan janji yang terlanggar.",
        image: mockups.favorite,
        creator: "Afiananr",
    },
    {
        id: 2,
        title: "Petualangan di Pulau Misteri",
        genre: "Adventure, Fantasy, Mystery",
        updated: "Terakhir di tonton 3 hari yang lalu",
        description: "Ikuti perjalanan seru melintasi pulau penuh rahasia dengan makhluk ajaib dan teka-teki kuno.",
        image: mockups.shorts,
        creator: "Kadek Wijaya",
    },
    {
        id: 3,
        title: "Melodi di Balik Senja",
        genre: "Drama, Music, Slice of Life",
        updated: "Terakhir di tonton seminggu yang lalu",
        description: "Cerita mengharukan tentang perjuangan seorang musisi muda yang mencari makna hidup melalui nada.",
        image: mockups.home,
        creator: "Studio Jati",
    },
    {
        id: 4,
        title: "Jejak Sang Pemburu Bayangan",
        genre: "Thriller, Crime, Suspense",
        updated: "Terakhir di tonton 2 jam yang lalu",
        description: "Mengungkap misteri di balik pembunuhan berantai dengan kejar-kejaran penuh ketegangan.",
        image: mockups.watch,
        creator: "LaluLalang",
    },
];

export const coinPackages = [
    { id: "pemula", name: "Paket Pemula", coins: 100, price: 10000, priceLabel: "Rp10.000" },
    { id: "menengah", name: "Paket Menengah", coins: 270, bonus: "250+20", price: 25000, priceLabel: "Rp25.000", featured: true },
    { id: "sultan", name: "Paket Sultan", coins: 575, bonus: "500+75", price: 50000, priceLabel: "Rp50.000" },
];

export const subscriptionPlans = [
    {
        id: "supporter",
        name: "Supporter",
        price: "Rp15.000",
        suffix: "/Bulan",
        features: ["Bebas Iklan", "Akses lebih Cepat", "Dukung Creator Lokal"],
    },
    {
        id: "explorer",
        name: "Explorer",
        price: "Rp35.000",
        suffix: "/Bulan",
        featured: true,
        badge: "TERBAIK",
        features: ["Bebas Iklan", "Akses lebih Cepat", "Dukung Creator Lokal", "Akses Vidio Behind the Scenes", "Melihat Proses Story Board", "Sneak peek episode yang belum dirilis"],
    },
    {
        id: "vip",
        name: "VIP/Creator Pack",
        price: "Rp75.000",
        suffix: "/Bulan",
        features: ["Seluruh Benefit Paket Explorer", "Unduh File PSD Karakter", "Akses Desain Vektor Karakter", "Akses Unduh Background Art", "Akses Unduh Asset Animasi", "Akses Unduh Story Board"],
    },
];

export const transactions = [
    { id: 1, title: "Isi Saldo via BCA", date: "24 Okt 2024, 14:20", amount: "+500", tone: "plus" },
    { id: 2, title: "Akses Cerita: Legend of Borobudur", date: "22 Okt 2024, 09:15", amount: "-150", tone: "minus" },
    { id: 3, title: "Kostum Karakter: Batik Modern", date: "20 Okt 2024, 19:45", amount: "-300", tone: "minus" },
];

export const studioStats = [
    { label: "Penayangan", value: "12.4k", change: "+14%" },
    { label: "Pengikut", value: "892", change: "+5.2%" },
    { label: "Pendapatan", value: "Rp 4.2M", change: "Target 80%" },
];

export const studioEpisodes = [
    { id: 1, title: "Episode 1: Benih Ajaib", status: "GRATIS", meta: "PUBLIKASI - 2 JAM LALU", image: mockups.karya },
    { id: 2, title: "Episode 2: Kejaran Raksasa", status: "PREMIUM", meta: "PUBLIKASI - 1 HARI LALU", image: mockups.watch },
    { id: 3, title: "Episode 3: Pelarian Akhir", status: "PRIVAT", meta: "DRAF - DIEDIT 5M LALU", image: mockups.explore },
];

export const karyaItems = [
    { title: "Sketsa Karakter: Gatotkaca Muda", meta: "2 dlim lalu", image: mockups.channel },
    { title: "Latar Belakang: Hutan Larangan", meta: "Kemarin", image: mockups.studio },
];

export const popularStudioSeries = [
    { title: "Seribu Candi", views: "240rb", likes: "45rb", image: mockups.favorite },
    { title: "Anak Pesisir", views: "180rb", likes: "32rb", image: mockups.profile },
    { title: "Gadis Timun", views: "120rb", likes: "28rb", image: mockups.karya },
    { title: "Dua Saudari", views: "95rb", likes: "15rb", image: mockups.store },
];

export const comments = [
    {
        id: 1,
        author: "DiniSastra",
        body: "Visual reliefnya terasa hangat dan penjelasan budayanya mudah diikuti.",
        time: "2 menit lalu",
        admin: false,
    },
    {
        id: 2,
        author: "Admin NusaTales",
        body: "Terima kasih sudah berdiskusi di NusaRembug. Episode kedua akan membuka konteks sejarahnya.",
        time: "Baru saja",
        admin: true,
    },
];

export const regions = [
    {
        id: 1,
        slug: "pulau-jawa",
        title: "Pulau Jawa",
        description: "Pusat peradaban megah dengan ribuan candi dan pegunungan berapi yang agung.",
        series: [
            { title: "Misteri Ratu Kidul", progress: "2/12", image: mockups.mapStory },
            { title: "Jaka Tarub", progress: "12/48", image: mockups.shorts },
            { title: "Timun Mas", progress: "11/30", image: mockups.home },
        ],
    },
];

export const culturalProgress = {
    score: "450 / 600 Poin Budaya",
    stage: "Jalur Raja",
    levels: ["Awal Mula", "Mitologi Dasar", "Jalur Raja", "Hukum Adat", "Puncak Kejayaan"],
    missions: [
        {
            number: "01",
            title: "Misteri Borobudur",
            description: "Mempelajari relief Kamadhatu yang menceritakan hukum sebab-akibat.",
            status: "SELESAI",
            progress: 100,
        },
        {
            number: "02",
            title: "Legenda Nyai Roro Kidul",
            description: "Menelusuri mitologi samudra selatan melalui visualisasi animasi 3D.",
            status: "SEDANG BERJALAN",
            progress: 65,
        },
    ],
    knowledge: [
        { label: "Sastra Jawa", value: 85 },
        { label: "Legenda Sumatera", value: 40 },
    ],
};

export const products = [
    { id: 1, slug: "kris-sakti-majapahit", title: "Kris Sakti Majapa...", category: "ARTEFAK", rating: "4.9", price: "4 NusaKoin", image: mockups.store },
    { id: 2, slug: "permata-cundamani", title: "Permata Cundama...", category: "EFEK", rating: "4.7", price: "8 NusaKoin", image: mockups.profile },
    { id: 3, slug: "modern-batik", title: "Modern Batik", category: "KOSTUM", rating: "5.0", price: "10 NusaKoin", image: mockups.karya, hot: true },
    { id: 4, slug: "ksatria-chibi-pack", title: "Ksatria Chibi Pack", category: "STIKER", rating: "4.5", price: "20 NusaKoin", image: mockups.login },
];

export const challenge = {
    title: "Sayembara Karakter Wayang Modern",
    description: "Tuliskan narasi dan desain karakter pahlawan Nusantara dalam balutan gaya kontemporer. Jadilah bagian dari sejarah baru!",
    deadline: "15 Juli 2024",
    format: ".JPG / .PNG / .PDF",
    rewards: [
        { title: "Kontrak Eksklusif", body: "Karakter ciptaanmu akan dipatenkan dan masuk ke dalam kanon utama Living Manuscript NusaTales.", value: "IDR 10jt" },
        { title: "Lencana Emas", body: "Status profil permanen sebagai Pemenang Sayembara Utama." },
        { title: "5,000 NusaCoins", body: "Gunakan untuk membuka bab cerita premium dan item langka." },
        { title: "Paket Budaya", body: "Artbook fisik bertanda tangan, kaos eksklusif, dan set stiker Nusantara." },
    ],
    leaderboard: [
        { rank: 1, name: "Maya Kertanegara", work: "Ksatria Gatotkaca Cyberpunk", votes: "2.4k" },
        { rank: 2, name: "Budi Satria", work: "Srikandi sang Archery-Tech", votes: "1.8k" },
        { rank: 3, name: "Lala Indah", work: "Semar dalam Dimensi Digital", votes: "1.5k" },
    ],
};

export function unwrapApiData(response, fallback) {
    const payload = response?.data?.data ?? response?.data ?? response;

    if (Array.isArray(payload)) {
        return payload.length > 0 ? payload : fallback;
    }

    if (payload && typeof payload === "object") {
        return Array.isArray(fallback)
            ? (Object.keys(payload).length > 0 ? payload : fallback)
            : { ...fallback, ...payload };
    }

    return fallback;
}
