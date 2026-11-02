import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../reels.css";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Film, Loader2, RotateCcw, X } from "lucide-react";
import { AppLink, useAppModal } from "../../../app/ModalContext";
import { useReelsFeed } from "../useReelsFeed";
import type { ReelCreator, ReelPanel } from "../reelTypes";
import ReelItem from "../components/ReelItem";
import ReelAvatar from "../components/ReelAvatar";
import ReelActions from "../components/ReelActions";
import CreatorQuickView from "../components/CreatorQuickView";
import ReelsDialog from "../components/ReelsDialog";
import CommentDrawer from "../../interactions/components/CommentDrawer";
import ReelsSidebar from "../components/ReelsSidebar";

export default function ReelsPage() {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const modal = useAppModal();
    const feed = useReelsFeed(videoId);
    const active = feed.videos[feed.activeIndex];
    const [muted, setMuted] = useState(true);
    const [autoAdvance, setAutoAdvance] = useState(false);
    const [rate, setRate] = useState(1);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [panel, setPanel] = useState<ReelPanel>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [visible, setVisible] = useState(!document.hidden);
    const [commentCount, setCommentCount] = useState<{ videoId: string; count: number } | null>(null);
    const area = useRef<HTMLDivElement>(null);
    const touch = useRef<{ x: number; y: number } | null>(null);
    const wheelState = useRef({ lastNavigation: -Infinity, accumulated: 0 });
    const blocked = Boolean(modal?.isOpen || panel || detailsOpen || mobileMenuOpen || !visible);
    const suspended = useRef(blocked);
    suspended.current = blocked;

    useEffect(() => {
        if (feed.animationId) navigate(`/watch/${feed.animationId}`, { replace: true });
    }, [feed.animationId, navigate]);
    useEffect(() => {
        const visibility = () => setVisible(!document.hidden);
        document.addEventListener("visibilitychange", visibility);
        return () => document.removeEventListener("visibilitychange", visibility);
    }, []);
    const openCreator = useCallback((creator: ReelCreator) => setPanel({ kind: "creator", creator }), []);
    const updateComments = useCallback((id: string, count: number) => setCommentCount({ videoId: id, count }), []);
    const previous = useCallback(() => { if (!suspended.current) feed.previous(); }, [feed.previous]);
    const next = useCallback(() => { if (!suspended.current) feed.next(); }, [feed.next]);

    useEffect(() => {
        function key(event: KeyboardEvent) {
            if (suspended.current) return;
            const target = event.target;
            if (target instanceof HTMLElement && target.closest('input, textarea, select, button, a, [data-feed-ignore], [role="menu"], [contenteditable="true"]')) return;
            if (event.key === "ArrowDown" || event.key === "PageDown") { event.preventDefault(); next(); }
            if (event.key === "ArrowUp" || event.key === "PageUp") { event.preventDefault(); previous(); }
            if (event.key.toLowerCase() === "m") setMuted((value) => !value);
        }
        window.addEventListener("keydown", key);
        return () => window.removeEventListener("keydown", key);
    }, [next, previous]);

    useEffect(() => {
        const element = area.current;
        if (!element) return;
        function wheel(event: WheelEvent) {
            const target = event.target;
            if (suspended.current || target instanceof HTMLElement && target.closest("[data-feed-ignore]")) return;
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.preventDefault();
            const now = performance.now();
            const state = wheelState.current;
            if (now - state.lastNavigation < 550) return;
            if (Math.sign(state.accumulated) !== Math.sign(event.deltaY)) state.accumulated = 0;
            state.accumulated += event.deltaY * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? element!.clientHeight : 1);
            if (Math.abs(state.accumulated) < 45) return;
            state.lastNavigation = now;
            if (state.accumulated > 0) next(); else previous();
            state.accumulated = 0;
        }
        element.addEventListener("wheel", wheel, { passive: false });
        return () => element.removeEventListener("wheel", wheel);
    }, [active?.id, next, previous]);

    const creators = useMemo(() => {
        const seen = new Set<string>();
        return feed.videos.flatMap((video) => {
            const id = video.creator.id || video.creator.username;
            if (!id || id === active?.creator.id || id === active?.creator.username || seen.has(id)) return [];
            seen.add(id);
            return [video.creator];
        }).slice(0, 5);
    }, [feed.videos, active?.creator.id, active?.creator.username]);

    function watchCreatorReel(id: string) {
        setPanel(null);
        if (active?.id !== id) navigate(`/reels/${id}`);
    }

    return <div className="site-page reels-page">
        <ReelsSidebar creators={creators} onCreator={openCreator} onMenuOpenChange={setMobileMenuOpen} />
        <main id="main-content" className="reels-main" tabIndex={-1}>
            {feed.notice && <div className="reels-notice" role="status"><p>{feed.notice}</p><button type="button" aria-label="Tutup pemberitahuan" onClick={feed.dismissNotice}><X size={16} /></button></div>}
            {feed.isLoading ? <div className="reels-loading" role="status"><Loader2 size={30} className="ui-spinner" /><span>Menyiapkan cerita...</span></div> : feed.error ? <section className="reels-empty" role="alert"><Film size={37} /><h1>Cerita belum berhasil dimuat</h1><p>{feed.error}</p><button className="nusa-button" onClick={feed.retry}><RotateCcw size={16} />Coba lagi</button></section> : active ? <>
                    <section className="reels-viewer" aria-label="Pemutar Shorts">
                        <div ref={area} className="reels-video-area" onTouchStart={(event) => {
                            const target = event.target;
                            if (blocked || target instanceof HTMLElement && target.closest("[data-feed-ignore]")) { touch.current = null; return; }
                            const point = event.touches[0];
                            if (point) touch.current = { x: point.clientX, y: point.clientY };
                        }} onTouchEnd={(event) => {
                            const start = touch.current;
                            touch.current = null;
                            const end = event.changedTouches[0];
                            if (blocked || !start || !end) return;
                            const delta = start.y - end.clientY;
                            if (Math.abs(delta) > 60 && Math.abs(delta) > Math.abs(start.x - end.clientX) * 1.3) { if (delta > 0) next(); else previous(); }
                        }}>
                            <ReelItem key={active.id} video={active} suspended={blocked} isMuted={muted} onToggleMute={() => setMuted((value) => !value)} onAutoplayMuted={() => setMuted(true)} onCreator={() => openCreator(active.creator)} onDetails={() => setDetailsOpen(true)}
                                autoAdvance={autoAdvance} onToggleAutoAdvance={() => setAutoAdvance((value) => !value)} onAdvance={next} playbackRate={rate} onRateChange={() => { const rates = [.75, 1, 1.25, 1.5, 2]; setRate((value) => rates[(rates.indexOf(value) + 1) % rates.length] || 1); }} />
                        </div>
                        <ReelActions key={active.id} video={active} onCreator={() => openCreator(active.creator)} onComments={() => setPanel({ kind: "comments" })} commentCount={commentCount}
                            onPrevious={previous} onNext={next} first={feed.activeIndex === 0} last={feed.activeIndex === feed.videos.length - 1 && !feed.hasMore} loadingMore={feed.isLoadingMore} />
                    </section>
                {feed.moreError && <div className="reels-more-error" role="alert">{feed.moreError}<button onClick={() => feed.loadMore()}>Coba lagi</button></div>}
                <CommentDrawer videoId={active.id} isOpen={panel?.kind === "comments"} onClose={() => setPanel(null)} onCountChange={updateComments} onCreator={openCreator} />
                <CreatorQuickView creator={panel?.kind === "creator" ? panel.creator : null} open={panel?.kind === "creator"} onClose={() => setPanel(null)} onReel={watchCreatorReel} />
                <ReelsDialog open={detailsOpen} title="Tentang cerita" onClose={() => setDetailsOpen(false)}><div className="reels-story-details"><h3>{active.title}</h3><p>{active.description || "Belum ada deskripsi untuk cerita ini."}</p><button type="button" onClick={() => { setDetailsOpen(false); openCreator(active.creator); }}><ReelAvatar creator={active.creator} /><span>{active.creator.displayName}</span><ArrowRight size={16} /></button></div></ReelsDialog>
            </> : <section className="reels-empty"><img src="/poto/splash-senyum.webp" alt="Maskot NusaTales" /><h1>Cerita pendek, makna panjang.</h1><p>Belum ada Shorts yang dipublikasikan. Jadilah bagian dari cerita berikutnya.</p><AppLink to="/studio/upload" className="nusa-button">Bagikan karyamu <ArrowRight size={16} /></AppLink><AppLink to="/animations" className="reels-empty-link">Jelajahi film animasi</AppLink></section>}
        </main>
    </div>;
}
