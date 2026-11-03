import { useEffect, useRef, useState } from "react";
import { Film, Layers3, Plus, Pencil, ArrowUpRight, RefreshCw } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import { Button, Input, Notice } from "../../../components/ui/form";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { normalizeSupabaseError } from "../../../lib/errors";
import { videoRepository } from "../../videos/videoRepository";
import StudioDialog from "../../videos/studio/StudioDialog";
import { animationRepository } from "../animationRepository";
import { animationChanged, episodeLabel } from "../animationTypes";
import type { AnimationEpisode, AnimationTitle } from "../animationTypes";
import AnimationEditor from "./AnimationEditor";
import "./animationStudio.css";

function TitleCard({ animation, onManage }: { animation: AnimationTitle; onManage: () => void }) {
    const url = useStorageImageUrl(animation.poster_path);
    return <article className="animation-title-card" aria-label={`Animasi ${animation.title}`}><div className="animation-card-art">
        {url ? <img src={url} alt="" /> : <span className="animation-card-fallback"><Film size={23} /></span>}
        <div><small>{animation.format === "series" ? "SERIAL" : "FILM"} · {animation.status === "published" ? "Terbit" : "Draf"}</small><h3>{animation.title}</h3><p>{animation.genres.join(" · ") || "Genre belum diisi"}</p></div></div>
        <Button variant="outline" onClick={onManage}><Layers3 size={15} />Kelola {animation.format === "series" ? "episode" : "film"}</Button></article>;
}

export default function AnimationLibrary({ userId }: { userId: string }) {
    const [titles, setTitles] = useState<AnimationTitle[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [revision, setRevision] = useState(0);
    const [view, setView] = useState<{ kind: "create" | "edit" | "manage"; id?: string } | null>(null);
    const [editing, setEditing] = useState<AnimationTitle | undefined>();
    useEffect(() => { const refresh = () => setRevision((value) => value + 1); window.addEventListener("nusatales:videos-changed", refresh); return () => window.removeEventListener("nusatales:videos-changed", refresh); }, []);
    useEffect(() => {
        let active = true; setLoading(true); setError("");
        animationRepository.mine(userId).then((data) => { if (active) setTitles(data); }).catch((cause: unknown) => { if (active) setError(normalizeSupabaseError(cause, "Animasi belum berhasil dimuat. Coba lagi sebentar.")); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [userId, revision]);
    return <section className="animation-library studio-panel" aria-labelledby="animation-library-title">
        <div className="animation-library-heading"><div><span className="studio-eyebrow">JUDUL & EPISODE</span><h2 id="animation-library-title">Animasi milikmu</h2><p>Atur judul ceritamu, lalu kelola film atau episodenya.</p></div><Button onClick={() => { setEditing(undefined); setView({ kind: "create" }); }}><Plus size={16} />Buat animasi</Button></div>
        {loading ? <p role="status" className="ui-hint">Memuat animasi...</p> : error ? <><Notice>{error}</Notice><Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Muat ulang animasi</Button></>
            : !titles.length ? <p className="animation-status-note">Belum ada animasi. Buat judul pertama, lengkapi metadata, lalu unggah tayangannya. Reels tetap dikelola terpisah.</p>
                : <div className="animation-title-grid">{titles.map((animation) => <TitleCard key={animation.id} animation={animation} onManage={() => setView({ kind: "manage", id: animation.id })} />)}</div>}
        {view && view.kind !== "manage" && <AnimationEditor key={`${view.kind}:${view.id || "new"}`} userId={userId} animation={editing} onClose={() => setView(view.id ? { kind: "manage", id: view.id } : null)} onSaved={(id) => setView({ kind: "manage", id })} />}
        {view?.kind === "manage" && view.id && <ManageAnimation key={view.id} id={view.id} titles={titles} onClose={() => setView(null)} onEdit={(animation) => { setEditing(animation); setView({ kind: "edit", id: animation.id }); }} />}
    </section>;
}

function ManageAnimation({ id, titles, onClose, onEdit }: { id: string; titles: AnimationTitle[]; onClose: () => void; onEdit: (animation: AnimationTitle) => void }) {
    const [animation, setAnimation] = useState<AnimationTitle | null>(null), [episodes, setEpisodes] = useState<AnimationEpisode[]>([]);
    const [loading, setLoading] = useState(true), [error, setError] = useState(""), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
    const [loadError, setLoadError] = useState("");
    const [confirmation, setConfirmation] = useState<{ action: "publish" | "unpublish" | "delete"; episode?: AnimationEpisode } | null>(null);
    const [moving, setMoving] = useState<AnimationEpisode | null>(null), [target, setTarget] = useState(id), [season, setSeason] = useState(1), [number, setNumber] = useState(1);
    const lock = useRef(false);
    useEffect(() => { const refresh = () => setRevision((value) => value + 1); window.addEventListener("nusatales:videos-changed", refresh); return () => window.removeEventListener("nusatales:videos-changed", refresh); }, []);
    useEffect(() => {
        let active = true; if (lock.current) return;
        setLoading(true); setLoadError("");
        Promise.all([animationRepository.get(id), animationRepository.episodes(id)]).then(([title, items]) => { if (active) { setAnimation(title); setEpisodes(items); } }).catch((cause: unknown) => { if (active) setLoadError(normalizeSupabaseError(cause, "Episode belum berhasil dimuat.")); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, revision]);
    async function mutate() {
        if (!confirmation || lock.current) return;
        lock.current = true; setBusy(true); setError("");
        try {
            const { action, episode } = confirmation;
            if (episode) {
                const result = action === "publish" ? await videoRepository.publishVideo(episode.video_id) : action === "unpublish" ? await videoRepository.unpublishVideo(episode.video_id) : await videoRepository.softDeleteVideo(episode.video_id);
                if (result.error) throw result.error;
                window.dispatchEvent(new CustomEvent("nusatales:videos-changed", { detail: action === "delete" ? { id: episode.video_id, deleted: true } : { id: episode.video_id, status: action === "publish" ? "published" : "draft" } }));
            } else { await animationRepository.status(id, action); if (action === "delete") onClose(); }
            setConfirmation(null);
        } catch (cause) { setError(normalizeSupabaseError(cause, "Perubahan belum berhasil disimpan.")); }
        finally { lock.current = false; setBusy(false); animationChanged(); }
    }
    async function move() {
        if (!moving || lock.current) return;
        lock.current = true; setBusy(true); setError("");
        try { await animationRepository.move(moving.video_id, target, season, number); setMoving(null); }
        catch (cause) { setError(normalizeSupabaseError(cause, "Episode belum berhasil dipindahkan.")); }
        finally { lock.current = false; setBusy(false); animationChanged(); }
    }
    const nextEpisode = Math.max(0, ...episodes.filter((episode) => episode.season_number === 1).map((episode) => episode.episode_number)) + 1;
    return <StudioDialog wide title={animation?.title || "Kelola animasi"} description="Terbitkan tayangan untuk membagikannya bersama animasi. Sinopsis, poster, dan genre animasi harus lengkap; simpan draf selama belum siap." onClose={onClose} busy={busy}>
        <Notice>{error || loadError}</Notice>
        {loading ? <p role="status">Memuat detail animasi...</p> : !animation ? <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Coba lagi</Button> : <>
            <p className="animation-status-note">{animation.format === "series" ? "Serial" : "Film"} · Animasi {animation.status === "published" ? "terbit" : "draf"} · {episodes.length} tayangan · {animation.genres.join(", ") || "Genre belum diisi"}</p>
            <div className="animation-manage-actions"><Button variant="outline" disabled={busy} onClick={() => onEdit(animation)}><Pencil size={14} />Edit animasi</Button>
                {(animation.format === "series" || !episodes.length) && <AppLink className="ui-button ui-button-primary" to={`/studio/upload?animation=${id}&episode=${nextEpisode}`} onClick={onClose}><Plus size={14} />Tambah {animation.format === "series" ? "episode" : "film"}</AppLink>}
                <Button variant="outline" disabled={busy} onClick={() => setConfirmation({ action: animation.status === "published" ? "unpublish" : "publish" })}>{animation.status === "published" ? "Tarik animasi ke draf" : "Terbitkan animasi"}</Button>
                <Button variant="ghost" disabled={busy} onClick={() => setConfirmation({ action: "delete" })}>Hapus animasi</Button><Button variant="ghost" aria-label="Muat ulang episode" disabled={busy} onClick={() => setRevision((value) => value + 1)}><RefreshCw size={15} /></Button></div>
            <h3>Daftar tayangan</h3>
            {!episodes.length && <p className="ui-hint">Belum ada tayangan. Unggah episode pertama atau film utamanya.</p>}
            <div className="animation-episode-rows">{episodes.map((episode) => <article key={episode.video_id} className="animation-episode-row"><div><strong>{episode.video.title}</strong><small>{episodeLabel(episode, animation.format)} · {episode.video.status === "published" ? "Terbit" : "Draf"}</small></div>
                <div className="animation-episode-actions"><AppLink to={`/studio/videos/${episode.video_id}/edit`} className="ui-button ui-button-outline">Edit tayangan</AppLink>
                    {episode.video.status === "published" && animation.status === "published" && <AppLink to={`/watch/${episode.video_id}`} className="ui-button ui-button-ghost"><ArrowUpRight size={13} />Tonton</AppLink>}
                    <Button variant="outline" disabled={busy || !episode.video.storage_path} onClick={() => setConfirmation({ action: episode.video.status === "published" ? "unpublish" : "publish", episode })}>{episode.video.status === "published" ? "Tarik tayangan" : "Terbitkan tayangan"}</Button>
                    {episode.video.status === "draft" && <Button variant="ghost" disabled={busy} onClick={() => { setMoving(episode); setTarget(id); setSeason(episode.season_number); setNumber(episode.episode_number); }}>Atur animasi / nomor</Button>}
                    <Button variant="ghost" disabled={busy} onClick={() => setConfirmation({ action: "delete", episode })}>Hapus tayangan</Button></div></article>)}</div>
            {moving && <form className="animation-transfer" onSubmit={(event) => { event.preventDefault(); void move(); }}><strong>Atur: {moving.video.title}</strong><label>Animasi tujuan<select className="ui-input" aria-label="Animasi tujuan" value={target} disabled={busy} onChange={(event) => setTarget(event.target.value)}>{titles.map((title) => <option key={title.id} value={title.id}>{title.title} ({title.format})</option>)}</select></label>
                <div className="animation-form-grid"><label>Musim<Input type="number" aria-label="Musim tujuan" required min={1} max={999} disabled={busy} value={season} onChange={(event) => setSeason(Number(event.target.value))} /></label><label>Episode<Input type="number" aria-label="Nomor episode tujuan" required min={1} max={99999} disabled={busy} value={number} onChange={(event) => setNumber(Number(event.target.value))} /></label></div>
                <p className="ui-hint">Film hanya menerima musim 1, tayangan 1. Nomor yang sudah dipakai akan ditolak.</p><div className="ui-button-row"><Button variant="ghost" disabled={busy} onClick={() => setMoving(null)}>Batal mengatur</Button><Button type="submit" busy={busy}>Simpan relasi episode</Button></div></form>}
            {confirmation && <div className="animation-transfer" role="group" aria-label="Konfirmasi perubahan"><strong>{confirmation.action === "delete" ? "Hapus" : confirmation.action === "publish" ? "Terbitkan" : "Tarik ke draf"} {confirmation.episode?.video.title || animation.title}?</strong>
                <p className="ui-hint">{confirmation.action === "delete" && !confirmation.episode ? "Animasi dan seluruh tayangannya akan disembunyikan dari publik. Media tidak dihapus permanen." : !confirmation.episode ? "Publikasi animasi menentukan akses penonton ke semua tayangannya." : "Perubahan ini berlaku pada tayangan yang dipilih."}</p><div className="ui-button-row"><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>Batal</Button><Button variant={confirmation.action === "delete" ? "danger" : "primary"} busy={busy} onClick={() => { void mutate(); }}>Ya, lanjutkan</Button></div></div>}
        </>}
    </StudioDialog>;
}
