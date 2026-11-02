import { useEffect, useState } from "react";
import { Button, Input, Notice } from "../../../components/ui/form";
import { normalizeSupabaseError } from "../../../lib/errors";
import { animationRepository } from "../animationRepository";
import type { AnimationTitle } from "../animationTypes";
import AnimationEditor from "./AnimationEditor";

export default function AnimationPicker({ userId, value, season, episode, disabled, onChange }: {
    userId: string; value: string; season: number; episode: number; disabled: boolean;
    onChange: (id: string, season: number, episode: number) => void;
}) {
    const [titles, setTitles] = useState<AnimationTitle[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const [creating, setCreating] = useState(false), [revision, setRevision] = useState(0);
    useEffect(() => { const refresh = () => setRevision((number) => number + 1); window.addEventListener("nusatales:videos-changed", refresh); return () => window.removeEventListener("nusatales:videos-changed", refresh); }, []);
    useEffect(() => { let active = true; setLoading(true); setError("");
        animationRepository.mine(userId).then((data) => { if (active) setTitles(data); }).catch((cause: unknown) => { if (active) setError(normalizeSupabaseError(cause, "Animasi belum bisa dimuat.")); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [userId, revision]);
    const selected = titles.find((title) => title.id === value);
    return <div className="animation-picker"><label htmlFor="upload-animation-parent">Animasi</label><select id="upload-animation-parent" className="ui-input" value={value} disabled={disabled || loading || Boolean(error)} required onChange={(event) => { const title = titles.find((item) => item.id === event.target.value); onChange(event.target.value, 1, title?.format === "film" ? 1 : episode); }}>
        <option value="">{loading ? "Memuat animasi..." : "Pilih animasi milikmu"}</option>{titles.map((title) => <option key={title.id} value={title.id}>{title.title} · {title.format === "series" ? "Serial" : "Film"}</option>)}</select>
        <Notice>{error}</Notice>{error && <Button variant="outline" onClick={() => setRevision((number) => number + 1)}>Muat ulang animasi</Button>}
        {selected?.format === "series" && <div className="animation-form-grid"><label>Musim<Input type="number" aria-label="Musim episode" value={season} min={1} max={999} required disabled={disabled} onChange={(event) => onChange(value, Number(event.target.value), episode)} /></label><label>Nomor episode<Input type="number" aria-label="Nomor episode" value={episode} min={1} max={99999} required disabled={disabled} onChange={(event) => onChange(value, season, Number(event.target.value))} /></label></div>}
        <p className="ui-hint">{selected?.status === "draft" ? "Animasi masih draf. Tayangan baru terlihat publik setelah animasinya diterbitkan melalui Studio." : "Judul dan deskripsi di bawah ini milik tayangan, bukan detail animasi."}</p>
        <Button variant="outline" disabled={disabled} onClick={() => setCreating(true)}>Buat animasi baru</Button>
        {creating && <AnimationEditor userId={userId} onClose={() => setCreating(false)} onSaved={(id) => { onChange(id, 1, 1); setCreating(false); setRevision((number) => number + 1); }} />}
    </div>;
}
