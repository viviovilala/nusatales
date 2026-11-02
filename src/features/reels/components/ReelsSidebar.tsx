import React, { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Clapperboard, Compass, Home, LogOut, Menu, MoreHorizontal, Plus, Search, Settings, UserRound, Video } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import { useAuth } from "../../auth/AuthProvider";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";
import ReelAvatar from "./ReelAvatar";
import type { ReelCreator } from "../reelTypes";

type Props = { creators: ReelCreator[]; onCreator: (creator: ReelCreator) => void; onMenuOpenChange?: (open: boolean) => void };
function Navigation({ creators, onCreator, onNavigate = () => {} }: Props & { onNavigate?: () => void }) {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const id = useId();
    const [query, setQuery] = useState("");
    const metadataName = user?.user_metadata?.display_name;
    const name = profile?.display_name || (typeof metadataName === "string" ? metadataName : "Profil saya");
    return <>
        <form className="reels-nav-search" role="search" onSubmit={(event) => { event.preventDefault(); onNavigate(); navigate(`/animations${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`); }}>
            <label className="sr-only" htmlFor={id}>Cari cerita</label><Search size={20} /><input id={id} type="search" placeholder="Cari cerita" value={query} maxLength={120} onChange={(event) => setQuery(event.target.value)} /><button type="submit" className="sr-only">Cari</button>
        </form>
        <nav className="reels-nav-links" aria-label="Navigasi Reels">
            <AppLink to="/reels" className="is-active" aria-current="page" onClick={onNavigate}><Video size={24} /><span>Shorts</span></AppLink>
            <AppLink to="/" onClick={onNavigate}><Home size={24} /><span>Beranda</span></AppLink>
            <AppLink to="/animations" onClick={onNavigate}><Compass size={24} /><span>Jelajah</span></AppLink>
            {user && <AppLink to="/studio" onClick={onNavigate}><Clapperboard size={24} /><span>Studio</span></AppLink>}
            <AppLink to="/studio/upload" onClick={onNavigate}><Plus size={24} /><span>Unggah</span></AppLink>
            <AppLink to="/settings/profile" onClick={onNavigate}>{user ? <ReelAvatar creator={{ id: user.id, displayName: name, avatarPath: profile?.avatar_path }} /> : <UserRound size={24} />}<span>Profil</span></AppLink>
            <DropdownMenu.Root modal={false}><DropdownMenu.Trigger className="reels-nav-more"><MoreHorizontal size={24} /><span>Lainnya</span></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="nusa-dropdown" side="right" align="end" sideOffset={12}>
                <DropdownMenu.Item asChild><AppLink to="/#tentang-kami" onClick={onNavigate}>Tentang NusaTales</AppLink></DropdownMenu.Item>
                <DropdownMenu.Item asChild><AppLink to="/settings/profile" onClick={onNavigate}><Settings size={16} />Pengaturan profil</AppLink></DropdownMenu.Item>
                {user ? <DropdownMenu.Item onSelect={async () => { await signOut(); onNavigate(); }}><LogOut size={16} />Keluar</DropdownMenu.Item> : <DropdownMenu.Item asChild><AppLink to="/register" onClick={onNavigate}>Daftar akun</AppLink></DropdownMenu.Item>}
            </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
        </nav>
        {!user && <AppLink to="/login" className="reels-nav-login" onClick={onNavigate}>Masuk / Daftar</AppLink>}
        {creators.length > 0 && <section className="reels-nav-creators"><h2>Kreator di Shorts</h2>{creators.map((creator) => <button type="button" key={creator.id || creator.username || creator.displayName} onClick={() => { onNavigate(); onCreator(creator); }}><ReelAvatar creator={creator} /><span><strong>{creator.displayName}</strong><small>{creator.username ? `@${creator.username}` : "Kreator Nusantara"}</small></span></button>)}</section>}
    </>;
}

export default function ReelsSidebar(props: Props) {
    const [open, setOpen] = useState(false);
    const changeOpen = (value: boolean) => { setOpen(value); props.onMenuOpenChange?.(value); };
    return <>
        <aside className="reels-side-nav" aria-label="Menu utama Shorts" data-feed-ignore>
            <AppLink to="/" className="reels-side-brand" aria-label="NusaTales — beranda"><img className="nusa-original-logo" src="/poto/logo.png" width={170} height={48} alt="NusaTales" /></AppLink>
            <Navigation {...props} />
        </aside>
        <header className="reels-mobile-header" data-feed-ignore>
            <Sheet open={open} onOpenChange={changeOpen}><SheetTrigger asChild><button type="button" aria-label="Buka menu Reels"><Menu size={24} /></button></SheetTrigger><SheetContent className="reels-nav-sheet"><SheetTitle className="sr-only">Navigasi Reels</SheetTitle><SheetDescription className="sr-only">Jelajahi cerita, unggah karya, dan kelola profil NusaTales.</SheetDescription><AppLink to="/" className="reels-side-brand" onClick={() => changeOpen(false)}><img src="/poto/logo.png" width={160} height={45} alt="NusaTales" /></AppLink><Navigation {...props} onNavigate={() => changeOpen(false)} /></SheetContent></Sheet>
            <AppLink to="/" aria-label="NusaTales — beranda"><img className="nusa-original-logo" src="/poto/logo.png" width={120} height={34} alt="NusaTales" /></AppLink>
            <AppLink to="/studio/upload" className="reels-mobile-upload" aria-label="Unggah"><Plus size={23} /></AppLink>
        </header>
    </>;
}
