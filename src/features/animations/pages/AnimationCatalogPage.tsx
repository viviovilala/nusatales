import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Film, Search, SlidersHorizontal, X } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { Button, Input, Notice } from "../../../components/ui/form";
import CreatorQuickView from "../../reels/components/CreatorQuickView";
import CatalogHero from "../catalog/CatalogHero";
import CatalogCard from "../catalog/CatalogCard";
import { useAnimationCatalog } from "../catalog/useAnimationCatalog";
import { animationRepository } from "../animationRepository";
import type { Taxonomy } from "../animationTypes";
import { CATALOG_PAGE_SIZE, catalogParams, durationFilters, readCatalogQuery } from "../catalog/catalogTypes";
import type { CatalogQuery, CatalogSort, CatalogVideo } from "../catalog/catalogTypes";
import "../../reels/reels.css";
import "../catalog/catalog.css";

function paginationPages(current: number, total: number): Array<number | "left" | "right"> {
    const pages = new Set([1, total, current - 1, current, current + 1]);
    if (current <= 3) { pages.add(2); pages.add(3); pages.add(4); }
    if (current >= total - 2) { pages.add(total - 1); pages.add(total - 2); pages.add(total - 3); }
    const visible = [...pages].filter((number) => number > 0 && number <= total).sort((a, b) => a - b);
    const result: Array<number | "left" | "right"> = [];
    visible.forEach((number, index) => {
        if (index > 0 && number - visible[index - 1]! > 1) result.push(number < current ? "left" : "right");
        result.push(number);
    });
    return result;
}

export default function AnimationCatalogPage() {
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const query = readCatalogQuery(params);
    const queryKey = catalogParams(query).toString();
    const catalog = useAnimationCatalog(query);
    const [search, setSearch] = useState(query.search);
    const [creator, setCreator] = useState<CatalogVideo["creator"] | null>(null);
    const [genres, setGenres] = useState<Taxonomy[]>([]), [genreError, setGenreError] = useState(false), [genreRevision, setGenreRevision] = useState(0);
    const collection = useRef<HTMLHeadingElement>(null);
    const shouldScroll = useRef(false);
    const pages = Math.max(1, Math.ceil(catalog.count / CATALOG_PAGE_SIZE));
    const filtered = Boolean(query.search || query.duration !== "all" || query.genre);
    const pending = catalog.loading || (!catalog.error && query.page > pages);

    useEffect(() => { setSearch(query.search); }, [query.search]);
    useEffect(() => { let active = true; setGenreError(false); animationRepository.taxonomies().then((data) => { if (active) setGenres(data.genres); }).catch(() => { if (active) setGenreError(true); }); return () => { active = false; }; }, [genreRevision]);
    useEffect(() => {
        if (!shouldScroll.current) return;
        shouldScroll.current = false;
        const frame = requestAnimationFrame(() => {
            collection.current?.scrollIntoView({ block: "start", behavior: "instant" });
            collection.current?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
    }, [queryKey]);
    useEffect(() => {
        if (catalog.loading || catalog.error || query.page <= pages) return;
        setParams(catalogParams({ ...query, page: pages }), { replace: true });
    }, [catalog.loading, catalog.error, catalog.count, queryKey]);

    function update(changes: Partial<CatalogQuery>) {
        const next = { ...query, ...changes };
        if (catalogParams(next).toString() !== queryKey) shouldScroll.current = true;
        setParams(catalogParams(next));
    }
    function reset() { setSearch(""); update({ search: "", duration: "all", sort: "newest", genre: "", page: 1 }); }
    function pageHref(page: number) { return `/animations${catalogParams({ ...query, page }).size ? `?${catalogParams({ ...query, page })}` : ""}`; }
    const pageLinkClick = () => { shouldScroll.current = true; };

    return <div className="site-page catalog-page">
        <AppNavbar />
        <main id="main-content" className="catalog-main" tabIndex={-1}>
            <CatalogHero onCreator={setCreator} />
            <section id="koleksi" className="catalog-collection" aria-labelledby="catalog-title">
                <div className="catalog-collection-heading"><div><span className="catalog-eyebrow">JELAJAH CERITA</span><h2 id="catalog-title" ref={collection} tabIndex={-1}>{query.search ? `Hasil pencarian: “${query.search}”` : "Temukan kisah berikutnya."}</h2></div>
                    <p>Animasi pilihan dari kreator Nusantara.</p></div>
                <div className="catalog-toolbar">
                    <label className="catalog-genre">Genre<select className="ui-input" aria-label="Genre animasi" value={query.genre} onChange={(event) => update({ genre: event.target.value, page: 1 })}><option value="">Semua genre</option>{query.genre && !genres.some((genre) => genre.slug === query.genre) && <option value={query.genre}>{query.genre}</option>}{genres.map((genre) => <option key={genre.id} value={genre.slug}>{genre.name}</option>)}</select></label>
                    <div className="catalog-filter-scroll" role="group" aria-label="Filter total durasi animasi">{durationFilters.map((filter) => <button type="button" key={filter.value} aria-pressed={query.duration === filter.value} onClick={() => update({ duration: filter.value, page: 1 })}>{filter.label}</button>)}</div>
                    <form className="catalog-search" role="search" aria-label="Pencarian koleksi" onSubmit={(event) => { event.preventDefault(); update({ search: search.trim(), page: 1 }); }}>
                        <Search size={17} aria-hidden="true" /><label className="sr-only" htmlFor="catalog-search">Cari judul animasi</label><Input id="catalog-search" type="search" maxLength={120} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari judul animasi..." />
                        {search && <button type="button" className="catalog-clear-search" aria-label="Hapus pencarian" onClick={() => { setSearch(""); update({ search: "", page: 1 }); }}><X size={15} /></button>}
                        <button type="submit" className="catalog-search-submit" aria-label="Cari animasi">Cari</button>
                    </form>
                </div>
                {catalog.refreshError && <Notice>{catalog.refreshError}</Notice>}
                <p className="catalog-duration-note">Filter durasi memakai total durasi tayangan terbit dalam satu judul animasi.{genreError && <> Pilihan genre belum dimuat. <button type="button" onClick={() => setGenreRevision((value) => value + 1)}>Coba lagi</button></>}</p>
                <div className="catalog-meta-row"><div className="catalog-result-meta" role="status">{pending ? "Menyiapkan koleksi..." : catalog.error ? "Koleksi belum berhasil dimuat" : `${catalog.count.toLocaleString("id-ID")} animasi${filtered ? " ditemukan" : " untuk dijelajahi"}`}{filtered && <button type="button" onClick={reset}>Reset filter <X size={12} /></button>}</div>
                    <label className="catalog-sort"><SlidersHorizontal size={14} /><span className="sr-only">Urutkan animasi</span><select aria-label="Urutkan animasi" value={query.sort} onChange={(event) => update({ sort: event.target.value as CatalogSort, page: 1 })}><option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="title">Judul A–Z</option></select></label></div>

                {pending ? <div className="catalog-grid catalog-skeletons" role="status" aria-label="Memuat koleksi animasi">{Array.from({ length: 8 }, (_, index) => <div key={index}><span /><i /><i /></div>)}</div>
                    : catalog.error ? <div className="catalog-state"><div className="catalog-state-icon"><Film size={29} strokeWidth={1.4} /></div><h3>Koleksi belum bisa ditampilkan.</h3><Notice>{catalog.error}</Notice><Button variant="outline" onClick={catalog.retry}>Coba lagi</Button></div>
                    : !catalog.videos.length ? <div className="catalog-state"><div className="catalog-state-icon"><Search size={29} strokeWidth={1.4} /></div><h3>{filtered ? "Kisahnya belum ketemu." : "Koleksi cerita segera hadir."}</h3><p>{filtered ? "Coba judul lain atau ubah durasi untuk menemukan cerita yang kamu cari." : "Belum ada animasi yang dipublikasikan. Bagikan cerita pertamamu dan jadi bagian dari NusaTales."}</p>{filtered ? <Button variant="outline" onClick={reset}>Lihat semua animasi</Button> : <AppLink to="/studio/upload" className="nusa-button">Bagikan karyamu <ArrowRight size={16} /></AppLink>}</div>
                    : <div className="catalog-grid">{catalog.videos.map((video) => <CatalogCard key={video.id} video={video} onCreator={setCreator} />)}</div>}

                {!catalog.loading && !catalog.error && catalog.count > 0 && query.page <= pages && <div className="catalog-pagination-row"><span>Menampilkan {(query.page - 1) * CATALOG_PAGE_SIZE + 1}–{Math.min(query.page * CATALOG_PAGE_SIZE, catalog.count)} dari {catalog.count} animasi</span>
                    <nav className="catalog-pagination" aria-label="Halaman koleksi">
                        {query.page > 1 ? <AppLink to={pageHref(query.page - 1)} aria-label="Halaman sebelumnya" onClick={pageLinkClick}><ChevronLeft size={16} /></AppLink> : <span className="catalog-page-disabled" aria-hidden="true"><ChevronLeft size={16} /></span>}
                        {paginationPages(query.page, pages).map((number) => typeof number === "number" ? <AppLink key={number} to={pageHref(number)} aria-label={`Halaman ${number}`} aria-current={query.page === number ? "page" : undefined} onClick={(event) => { if (number === query.page) event.preventDefault(); else pageLinkClick(); }}>{number}</AppLink> : <span key={number} className="catalog-page-ellipsis" aria-hidden="true">…</span>)}
                        {query.page < pages ? <AppLink to={pageHref(query.page + 1)} aria-label="Halaman berikutnya" onClick={pageLinkClick}><ChevronRight size={16} /></AppLink> : <span className="catalog-page-disabled" aria-hidden="true"><ChevronRight size={16} /></span>}
                    </nav>
                </div>}
            </section>
        </main>
        <Footer />
        <CreatorQuickView creator={creator} open={Boolean(creator)} onClose={() => setCreator(null)} onReel={(id) => { setCreator(null); navigate(`/reels/${id}`); }} />
    </div>;
}
