import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { Button, Field, Input, Notice, Textarea } from "../../../components/ui/form";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { supabase } from "../../../lib/supabaseClient";
import { normalizeSupabaseError } from "../../../lib/errors";
import StudioDialog from "../../videos/studio/StudioDialog";
import { animationRepository } from "../animationRepository";
import { animationChanged } from "../animationTypes";
import type { AnimationInput, AnimationTitle, Taxonomy } from "../animationTypes";
import "./animationStudio.css";

function Artwork({ label, path, file, onChange, disabled }: { label: string; path: string | null; file: File | null; onChange: (file: File | null) => void; disabled: boolean }) {
    const signed = useStorageImageUrl(path), [preview, setPreview] = useState("");
    useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
    return <label className="animation-art-picker"><span>{label}</span><div>{preview || signed ? <img src={preview || signed || ""} alt={`Pratinjau ${label.toLowerCase()}`} /> : <ImagePlus size={26} />}</div>
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event) => onChange(event.target.files?.[0] || null)} aria-label={label} /><small>JPG, PNG, WebP · Maks. 5 MB</small></label>;
}
const empty: AnimationInput = { title: "", synopsis: "", format: "series", poster_path: null, banner_path: null, release_year: null,
    language: "Bahasa Indonesia", origin_region: "", age_guidance: "all", story_status: "ongoing" };

export default function AnimationEditor({ animation, userId, onClose, onSaved }: {
    animation?: AnimationTitle; userId: string; onClose: () => void; onSaved: (id: string) => void;
}) {
    const id = useId(), savedId = useRef(animation?.id || null), lock = useRef(false);
    const [input, setInput] = useState<AnimationInput>(animation || empty);
    const [genres, setGenres] = useState(animation?.genreIds || []), [cultures, setCultures] = useState(animation?.cultureIds || []);
    const [options, setOptions] = useState<{ genres: Taxonomy[]; cultures: Taxonomy[] } | null>(null);
    const [loading, setLoading] = useState(true), [error, setError] = useState(""), [revision, setRevision] = useState(0), [busy, setBusy] = useState(false);
    const [poster, setPoster] = useState<File | null>(null), [banner, setBanner] = useState<File | null>(null);
    const uploaded = useRef<{ poster_path?: { file: File; path: string }; banner_path?: { file: File; path: string } }>({});
    useEffect(() => { let active = true; setLoading(true); setError("");
        animationRepository.taxonomies().then((data) => { if (active) setOptions(data); }).catch((cause: unknown) => { if (active) setError(normalizeSupabaseError(cause, "Pilihan genre belum berhasil dimuat.")); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [revision]);
    function field<K extends keyof AnimationInput>(key: K, value: AnimationInput[K]) { setInput((current) => ({ ...current, [key]: value })); }
    function toggle(value: string, values: string[], set: (next: string[]) => void, maximum: number) {
        setError(""); if (values.includes(value)) set(values.filter((item) => item !== value));
        else if (values.length < maximum) set([...values, value]); else setError(`Pilih maksimal ${maximum} pilihan.`);
    }
    function selectArtwork(file: File | null, set: (next: File | null) => void) {
        setError(""); if (file && (!/^(image\/jpeg|image\/png|image\/webp)$/.test(file.type) || file.size > 5_000_000)) { setError("Sampul harus JPG, PNG, atau WebP, maksimal 5 MB."); return; } set(file);
    }
    async function save() {
        if (lock.current || !options) return;
        lock.current = true; setBusy(true); setError("");
        try {
            const existing = savedId.current;
            const targetId = existing || (await animationRepository.save(null, input, genres, cultures)).id;
            savedId.current = targetId;
            const next = { ...input };
            for (const [key, file] of [["poster_path", poster], ["banner_path", banner]] as const) {
                if (!file) continue;
                const cached = uploaded.current[key];
                if (cached?.file === file) { next[key] = cached.path; continue; }
                const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type] || "webp";
                const path = `${userId}/animations/${targetId}/${key}-${crypto.randomUUID()}.${extension}`;
                const result = await supabase.storage.from("thumbnails").upload(path, file, { contentType: file.type, upsert: false });
                if (result.error) throw result.error;
                uploaded.current[key] = { file, path }; next[key] = path;
            }
            // Editing an existing title commits metadata only after its new
            // artwork succeeds. A failed transfer must not partially edit it.
            if (existing || poster || banner) await animationRepository.save(targetId, next, genres, cultures);
            onSaved(targetId);
        } catch (cause) { setError(normalizeSupabaseError(cause, "Animasi belum berhasil disimpan. Draf yang sudah dibuat tetap ada di Studio.")); }
        finally { animationChanged(); lock.current = false; setBusy(false); }
    }
    return <StudioDialog wide title={animation ? "Edit animasi" : "Buat animasi"} description="Satu judul, satu ruang untuk seluruh ceritamu. Tambahkan film atau episode setelah animasi tersimpan." onClose={onClose} busy={busy}>
        <form className="animation-editor" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void save(); }}>
            <Notice>{error}</Notice>{!options && !loading && <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Muat ulang pilihan</Button>}
            <fieldset disabled={busy || loading || !options}>
                <div className="animation-form-grid"><Field id={`${id}-title`} label="Judul animasi" required><Input id={`${id}-title`} data-dialog-initial value={input.title} maxLength={120} required onChange={(event) => field("title", event.target.value)} /></Field>
                    <Field id={`${id}-format`} label="Format" hint={animation ? "Format hanya dapat diubah sebelum tayangan pertama dibuat." : undefined}><select id={`${id}-format`} className="ui-input" value={input.format} onChange={(event) => field("format", event.target.value as AnimationInput["format"])}><option value="series">Serial / beberapa episode</option><option value="film">Film / satu tayangan</option></select></Field></div>
                <Field id={`${id}-synopsis`} label="Sinopsis animasi" hint="Ringkasan keseluruhan cerita; deskripsi setiap episode diisi terpisah."><Textarea id={`${id}-synopsis`} rows={4} maxLength={2200} value={input.synopsis || ""} onChange={(event) => field("synopsis", event.target.value)} /></Field>
                <div className="animation-art-grid"><Artwork label="Poster animasi" path={input.poster_path} file={poster} onChange={(file) => selectArtwork(file, setPoster)} disabled={busy} /><Artwork label="Banner animasi (opsional)" path={input.banner_path} file={banner} onChange={(file) => selectArtwork(file, setBanner)} disabled={busy} /></div>
                <fieldset className="animation-taxonomy"><legend>Genre <small>Maksimal 3</small></legend>{options?.genres.map((genre) => <label key={genre.id}><input type="checkbox" checked={genres.includes(genre.id)} onChange={() => toggle(genre.id, genres, setGenres, 3)} />{genre.name}</label>)}</fieldset>
                <fieldset className="animation-taxonomy"><legend>Tema budaya <small>Opsional · maksimal 5</small></legend>{options?.cultures.map((culture) => <label key={culture.id}><input type="checkbox" checked={cultures.includes(culture.id)} onChange={() => toggle(culture.id, cultures, setCultures, 5)} />{culture.name}</label>)}</fieldset>
                <div className="animation-form-grid"><Field id={`${id}-year`} label="Tahun rilis"><Input id={`${id}-year`} type="number" min={1900} max={2100} value={input.release_year || ""} onChange={(event) => field("release_year", event.target.value ? Number(event.target.value) : null)} /></Field>
                    <Field id={`${id}-language`} label="Bahasa utama"><Input id={`${id}-language`} required maxLength={80} value={input.language} onChange={(event) => field("language", event.target.value)} /></Field>
                    <Field id={`${id}-region`} label="Asal daerah (opsional)"><Input id={`${id}-region`} maxLength={120} value={input.origin_region || ""} onChange={(event) => field("origin_region", event.target.value)} placeholder="Misalnya: Sumatera Utara" /></Field>
                    <Field id={`${id}-age`} label="Panduan usia" hint="Panduan dari kreator, bukan sertifikasi resmi."><select id={`${id}-age`} className="ui-input" value={input.age_guidance} onChange={(event) => field("age_guidance", event.target.value as AnimationInput["age_guidance"])}><option value="all">Semua umur</option><option value="13+">13+</option><option value="17+">17+</option></select></Field>
                    <Field id={`${id}-story`} label="Status cerita"><select id={`${id}-story`} className="ui-input" value={input.story_status} onChange={(event) => field("story_status", event.target.value as AnimationInput["story_status"])}><option value="ongoing">Masih berlanjut</option><option value="completed">Tamat</option></select></Field></div>
            </fieldset>
            <p className="ui-hint">Sinopsis, poster, genre, dan minimal satu tayangan terbit diperlukan saat menerbitkan animasi. Draf boleh dilengkapi bertahap.</p>
            <div className="studio-dialog-actions"><Button variant="outline" disabled={busy} onClick={onClose}>Batal</Button><Button type="submit" busy={busy} disabled={loading || !options}><Save size={15} />Simpan animasi</Button></div>
        </form>
    </StudioDialog>;
}
