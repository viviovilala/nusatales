import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Check, ChevronLeft, ChevronRight, Clapperboard, Eye, FilePenLine, Film, FolderOpen, Globe2, LayoutGrid, List, LockKeyhole, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Settings2, Smartphone, Sparkles, Trash2, UploadCloud, X } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AppLink as Link } from "../../../app/ModalContext";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import Reveal from "../../../components/Reveal";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { Button, Input, Notice } from "../../../components/ui/form";
import { useAuth } from "../../auth/AuthProvider";
import { useStudioWorks } from "../studio/useStudioWorks";
import { studioDate, studioDuration } from "../studio/studioTypes";
import type { StudioAction, StudioVideo } from "../studio/studioTypes";
import StudioDialog from "../studio/StudioDialog";
import StudioPreview from "../studio/StudioPreview";
import "../studio/studio.css";

type Format = "all" | StudioVideo["content_type"];
type Status = "all" | StudioVideo["status"];
type Sort = "newest" | "oldest" | "title";
const PAGE_SIZE = 12;

function Cover({ video }: { video: StudioVideo }) {
    const url = useStorageImageUrl(video.thumbnail_path);
    const [failed, setFailed] = useState<string | null>(null);
    const Icon = video.content_type === "animation" ? Film : Smartphone;
    return <div className={`studio-cover ${video.content_type === "reel" ? "studio-cover-short" : ""}`}>
        {url && failed !== url ? <img src={url} alt="" loading="lazy" onError={() => setFailed(url)} /> : <Icon size={25} strokeWidth={1.5} aria-hidden="true" />}
        {video.duration_seconds != null && video.duration_seconds > 0 && <span>{studioDuration(video.duration_seconds)}</span>}
    </div>;
}

export default function StudioPage() {
    const { user } = useAuth();
    return user ? <StudioWorkspace key={user.id} userId={user.id} /> : null;
}

function StudioWorkspace({ userId }: { userId: string }) {
    const { user, profile } = useAuth();
    const name: string = profile?.display_name || user?.user_metadata?.display_name || "Kreator";
    const { videos, loading, refreshing, loaded, loadError, pending, message, load, mutate } = useStudioWorks(userId);
    const [format, setFormat] = useState<Format>("all");
    const [status, setStatus] = useState<Status>("all");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<Sort>("newest");
    const [view, setView] = useState<"list" | "grid">("list");
    const [page, setPage] = useState(1);
    const [confirmation, setConfirmation] = useState<{ video: StudioVideo; action: StudioAction } | null>(null);
    const [actionError, setActionError] = useState("");
    const [preview, setPreview] = useState<StudioVideo | null>(null);
    const operation = useRef(false);
    const library = useRef<HTMLElement>(null);

    useEffect(() => { setPage(1); }, [format, status, search, sort]);
    const results = useMemo(() => {
        const query = search.trim().toLocaleLowerCase("id-ID");
        const filtered = videos.filter((video) => (format === "all" || video.content_type === format)
            && (status === "all" || video.status === status)
            && (!query || `${video.title} ${video.description || ""}`.toLocaleLowerCase("id-ID").includes(query)));
        const timestamp = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
        return filtered.sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "id")
            : sort === "oldest" ? timestamp(a.created_at) - timestamp(b.created_at) : timestamp(b.created_at) - timestamp(a.created_at));
    }, [videos, format, status, search, sort]);
    const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    const currentPage = Math.min(page, pages);
    const visible = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const published = videos.filter((video) => video.status === "published").length;
    const drafts = videos.filter((video) => video.status === "draft").length;
    const animations = videos.filter((video) => video.content_type === "animation").length;
    const filtered = format !== "all" || status !== "all" || search.trim() !== "";
    const count = (value: number) => loaded ? value.toLocaleString("id-ID") : "—";
    const reset = () => { setFormat("all"); setStatus("all"); setSearch(""); };
    const showLibrary = () => { library.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
    function ask(video: StudioVideo, action: StudioAction) { setActionError(""); setConfirmation({ video, action }); }
    async function confirm() {
        if (!confirmation || operation.current) return;
        operation.current = true;
        setActionError("");
        const error = await mutate(confirmation.video, confirmation.action);
        operation.current = false;
        if (error) setActionError(error);
        else setConfirmation(null);
    }

    return <div className="site-page studio-page">
        <AppNavbar />
        <main id="main-content" className="studio-main" tabIndex={-1}>
            <Reveal className="studio-heading">
                <div><span className="studio-eyebrow"><Clapperboard size={14} />RUANG KREATOR</span><h1>Studio ceritamu.</h1><p>Halo, {name}. Saatnya merawat cerita dan membagikan karya.</p></div>
                <Link to="/studio/upload" className="nusa-button"><Plus size={17} />Unggah karya baru</Link>
            </Reveal>

            <div className="studio-overview">
                <Reveal className="studio-summary studio-panel">
                    <div className="studio-section-title"><div><span className="studio-eyebrow">SETIAP CERITA BERARTI</span><h2>Ruang tumbuh karyamu</h2></div><span className="studio-live"><span />Studio kreator</span></div>
                    <div className="studio-stats" aria-label="Ringkasan karya">
                        <button type="button" onClick={() => { reset(); showLibrary(); }}><span><FolderOpen size={17} />Total karya</span><strong>{count(videos.length)}</strong><small>{loaded ? `${animations} animasi · ${videos.length - animations} Shorts` : "Memuat koleksi"}</small></button>
                        <button type="button" onClick={() => { setStatus("published"); setFormat("all"); setSearch(""); showLibrary(); }}><span><Globe2 size={17} />Dipublikasikan</span><strong>{count(published)}</strong><small>Sudah bisa dinikmati penonton</small></button>
                        <button type="button" onClick={() => { setStatus("draft"); setFormat("all"); setSearch(""); showLibrary(); }}><span><FilePenLine size={17} />Dalam draf</span><strong>{count(drafts)}</strong><small>Racik lagi, bagikan saat siap</small></button>
                    </div>
                    <div className="studio-summary-footer"><span><Sparkles size={15} />Satu karya lagi, satu kisah tetap hidup.</span><button type="button" onClick={showLibrary}>Kelola karya <ArrowUpRight size={15} /></button></div>
                </Reveal>
                <Reveal className="studio-upload-panel" direction="right" delay={0.08}>
                    <div className="studio-upload-symbol"><UploadCloud size={23} /></div><div><h2>Kisah berikutnya<br /> dimulai di sini.</h2><p>Film animasi atau cerita singkat, beri ruang untuk imajinasimu.</p></div>
                    <Link to="/studio/upload">Mulai unggah <Plus size={18} /></Link>
                </Reveal>
            </div>

            {!profile?.username && <div className="studio-onboarding"><div><Settings2 size={19} /><span><strong>Kenalkan studio kamu.</strong> Lengkapi username agar penonton mudah menemukan karyamu.</span></div><Link to="/settings/profile">Lengkapi profil <ArrowUpRight size={14} /></Link></div>}

            <section ref={library} id="karya" className="studio-library studio-panel" aria-labelledby="studio-library-title">
                <div className="studio-library-heading"><div><span className="studio-eyebrow">KOLEKSI PRIBADIMU</span><h2 id="studio-library-title" tabIndex={-1}>Karya kamu <span>{count(videos.length)}</span></h2><p>Kelola cerita, rapikan detail, dan tentukan kapan dunia melihatnya.</p></div>
                    <div className="studio-library-tools"><Button className="studio-refresh" variant="outline" busy={refreshing} disabled={loading || Boolean(pending)} onClick={() => { void load(); }} aria-label="Muat ulang karya"><RefreshCw size={15} className={refreshing ? "ui-spinner" : ""} /><span>Muat ulang</span></Button>
                        <div className="studio-view-switch" role="group" aria-label="Tampilan koleksi"><button type="button" aria-label="Tampilan daftar" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={17} /></button><button type="button" aria-label="Tampilan grid" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid size={16} /></button></div></div>
                </div>

                <div className="studio-toolbar">
                    <div className="studio-format-tabs" role="group" aria-label="Format karya">{([["all", "Semua karya"], ["animation", "Film animasi"], ["reel", "Shorts"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={format === value} onClick={() => setFormat(value)}>{value === "all" ? <FolderOpen size={15} /> : value === "animation" ? <Film size={15} /> : <Smartphone size={15} />}{label}</button>)}</div>
                    <label className="studio-search"><Search size={16} aria-hidden="true" /><Input aria-label="Cari karya" placeholder="Cari judul atau deskripsi..." value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" aria-label="Hapus pencarian" onClick={() => setSearch("")}><X size={14} /></button>}</label>
                </div>
                <div className="studio-filter-row"><div className="studio-selects"><label><span>Status</span><select aria-label="Status karya" value={status} onChange={(event) => setStatus(event.target.value as Status)}><option value="all">Semua status</option><option value="published">Dipublikasikan</option><option value="draft">Draf</option></select></label><label><span>Urutkan</span><select aria-label="Urutan karya" value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="title">Judul A–Z</option></select></label>{filtered && <button type="button" className="studio-clear" onClick={reset}>Reset filter <X size={12} /></button>}</div><span className="studio-result-count" role="status">{loading ? "Memuat karya..." : loaded ? `${results.length} karya${filtered ? " ditemukan" : " dalam koleksi"}` : "Koleksi belum dimuat"}</span></div>

                <Notice tone="success">{message}</Notice>
                {loadError && <div className="studio-load-error"><Notice>{loadError}</Notice><Button variant="outline" busy={refreshing} onClick={() => { void load(); }}>Coba lagi</Button>{loaded && <p>Daftar terakhir tetap ditampilkan sampai berhasil diperbarui.</p>}</div>}
                {loading ? <div className="studio-skeleton" role="status" aria-label="Memuat koleksi karya">{[0, 1, 2].map((key) => <div key={key}><span /><div><i /><i /></div></div>)}</div>
                    : !loaded ? null : !visible.length ? <div className="studio-empty"><div><Film size={30} strokeWidth={1.4} /></div><h3>{filtered ? "Belum menemukan ceritanya?" : "Koleksimu dimulai dari satu cerita."}</h3><p>{filtered ? "Coba judul lain atau ubah filter untuk melihat karya yang kamu cari." : "Unggah film animasi atau Shorts pertamamu. Simpan sebagai draf, lalu bagikan saat sudah siap."}</p>{filtered ? <Button variant="outline" onClick={reset}>Reset pencarian & filter</Button> : <Link to="/studio/upload" className="nusa-button"><Plus size={16} />Unggah karya pertama</Link>}</div>
                    : <>
                        {view === "list" && <div className="studio-list-labels" aria-hidden="true"><span>Karya</span><span>Status</span><span>Tanggal dibuat</span><span>Kelola</span></div>}
                        <div className={`studio-works studio-works-${view}`} aria-busy={refreshing || undefined}>
                            {visible.map((video) => <article key={video.id} className="studio-work" aria-label={`Karya ${video.title}`}>
                                <div className="studio-work-main"><button type="button" className="studio-cover-button" aria-label={`Preview ${video.title}`} onClick={() => setPreview(video)}><Cover video={video} /><span className="studio-cover-hover"><Eye size={18} /></span></button><div className="studio-work-copy"><span className="studio-work-format">{video.content_type === "animation" ? <Film size={12} /> : <Smartphone size={12} />}{video.content_type === "animation" ? "Film animasi" : "Shorts"}</span><h3>{video.title}</h3><p>{video.description || "Ceritakan sedikit tentang karya ini."}</p><span className="studio-mobile-date">{studioDate(video.created_at)}</span></div></div>
                                <span className={`studio-status ${video.status === "published" ? "is-published" : ""}`}>{video.status === "published" ? <Globe2 size={12} /> : <LockKeyhole size={12} />}{video.status === "published" ? "Dipublikasikan" : "Draf"}</span>
                                <time className="studio-work-date" dateTime={video.created_at || undefined}>{studioDate(video.created_at)}</time>
                                <div className="studio-work-actions"><Link to={`/studio/videos/${video.id}/edit`} className="ui-button ui-button-outline" aria-label="Edit"><Pencil size={14} /><span>Edit</span></Link>
                                    <DropdownMenu.Root modal={false}><DropdownMenu.Trigger type="button" className="studio-icon-button" disabled={Boolean(pending)} aria-label={`Aksi ${video.title}`}><MoreHorizontal size={20} /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="nusa-dropdown studio-work-menu" align="end" sideOffset={8}>
                                        <DropdownMenu.Label className="nusa-dropdown-label">Kelola karya</DropdownMenu.Label>
                                        <DropdownMenu.Item onSelect={() => setPreview(video)}><Eye size={15} />Preview karya</DropdownMenu.Item>
                                        {video.status === "published" && <DropdownMenu.Item asChild><Link to={video.content_type === "animation" ? `/watch/${video.id}` : `/reels/${video.id}`}><ArrowUpRight size={15} />Lihat halaman publik</Link></DropdownMenu.Item>}
                                        <DropdownMenu.Item disabled={video.status === "draft" && !video.storage_path} onSelect={() => ask(video, video.status === "published" ? "unpublish" : "publish")}>{video.status === "published" ? <ArrowDownToLine size={15} /> : <Globe2 size={15} />}{video.status === "published" ? "Tarik ke draf" : "Publikasikan"}</DropdownMenu.Item>
                                        <DropdownMenu.Separator className="nusa-dropdown-separator" /><DropdownMenu.Item className="studio-danger-item" onSelect={() => ask(video, "delete")}><Trash2 size={15} />Hapus karya</DropdownMenu.Item>
                                    </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
                                </div>
                            </article>)}
                        </div>
                        <div className="studio-pagination"><span>Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, results.length)} dari {results.length} karya</span><div><button type="button" aria-label="Halaman karya sebelumnya" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17} /></button><span>{currentPage} / {pages}</span><button type="button" aria-label="Halaman karya berikutnya" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17} /></button></div></div>
                    </>}
            </section>

            <div className="studio-bottom-note"><span><LockKeyhole size={14} />Draf hanya terlihat olehmu. Kamu yang menentukan kapan cerita dibagikan.</span><Link to="/settings/profile">Pengaturan profil <ArrowUpRight size={14} /></Link></div>
        </main>
        <Footer />
        {preview && <StudioPreview key={preview.id} video={preview} onClose={() => setPreview(null)} />}
        {confirmation && <StudioDialog title={confirmation.action === "delete" ? "Hapus karya?" : confirmation.action === "publish" ? "Siap membagikan cerita?" : "Kembalikan ke draf?"} description={confirmation.action === "delete" ? "Karya akan dihapus dari koleksi dan tidak bisa ditonton melalui halaman publik. Tindakan ini tidak dapat dibatalkan dari Studio." : confirmation.action === "publish" ? "Karyamu akan muncul di katalog atau Shorts dan bisa ditonton semua orang." : "Karya akan disembunyikan dari katalog dan Shorts. Kamu bisa memublikasikannya kembali nanti."} onClose={() => setConfirmation(null)} busy={Boolean(pending)}>
            <div className="studio-confirm-work"><Cover video={confirmation.video} /><div><strong>{confirmation.video.title}</strong><span>{confirmation.video.content_type === "animation" ? "Film animasi" : "Shorts"} · {studioDuration(confirmation.video.duration_seconds)}</span></div></div>
            <Notice>{actionError}</Notice><div className="studio-dialog-actions"><Button variant="outline" disabled={Boolean(pending)} data-dialog-initial onClick={() => setConfirmation(null)}>Batal</Button><Button variant={confirmation.action === "delete" ? "danger" : "primary"} busy={Boolean(pending)} onClick={() => { void confirm(); }}>{!pending && (confirmation.action === "delete" ? <Trash2 size={15} /> : <Check size={15} />)}{pending ? "Menyimpan..." : confirmation.action === "delete" ? "Hapus karya" : confirmation.action === "publish" ? "Ya, publikasikan" : "Tarik ke draf"}</Button></div>
        </StudioDialog>}
    </div>;
}
