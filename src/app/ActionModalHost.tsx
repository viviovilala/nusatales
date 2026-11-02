import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import UploadPage from "../features/videos/pages/UploadPage";
import EditVideoPage from "../features/videos/pages/EditVideoPage";
import ProfileSettingsPage from "../features/profile/pages/ProfileSettingsPage";
import type { ModalKind, ModalRoute } from "./modalRoutes";
import { usePageScrollLock } from "../lib/pageScrollLock";

type UploadStatus = { active: boolean; percent: number; phase: string };
type FormProps = { embedded: boolean; videoId: string | undefined; onAuthenticated: () => void; onStatusChange: (status: UploadStatus) => void };
type HostProps = { route: ModalRoute | null; close: () => void; authenticated: () => void };
const pages: Record<ModalKind, React.ComponentType<FormProps>> = { login: LoginPage, register: RegisterPage, forgot: ForgotPasswordPage, upload: UploadPage, edit: EditVideoPage, profile: ProfileSettingsPage };

export default function ActionModalHost({ route, close, authenticated }: HostProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const previousFocus = useRef<Element | null>(null);
    const [visited, setVisited] = useState<Array<ModalRoute & { key: string }>>([]);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
    usePageScrollLock(Boolean(route));
    const key = route ? `${route.kind}:${route.videoId || ""}` : null;
    useEffect(() => {
        if (route && key) setVisited((items) => items.some((item) => item.key === key) ? items : [...items, { ...route, key }]);
    }, [key]);
    useEffect(() => {
        if (route?.kind === "upload" && uploadStatus && ["PUBLISHED", "DRAFT_SAVED"].includes(uploadStatus.phase) && dialogRef.current) dialogRef.current.scrollTop = 0;
    }, [route?.kind, uploadStatus?.phase]);
    useLayoutEffect(() => {
        if (route) dialogRef.current?.querySelector<HTMLButtonElement>(".action-dialog-close")?.focus({ preventScroll: true });
    }, [key]);

    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (!route || !dialog) return;
        previousFocus.current = document.activeElement;
        dialog.showModal();
        return () => {
            dialog.close();
            const parentDialog = document.querySelector<HTMLDialogElement>("dialog:modal");
            const target = previousFocus.current instanceof HTMLElement && previousFocus.current.isConnected && previousFocus.current.getClientRects().length
                ? previousFocus.current
                : parentDialog?.querySelector<HTMLElement>("button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]") || [...document.querySelectorAll<HTMLElement>(".nusa-account-trigger, .nusa-login-link, .nusa-mobile-trigger, .reels-side-nav a[href='/settings/profile'], .reels-mobile-header > button")].find((element) => element.getClientRects().length);
            target?.focus({ preventScroll: true });
        };
    }, [Boolean(route)]);

    // Native dialog hides its children without unmounting them. In particular,
    // closing or switching a popup must never abort an upload or drop its File.
    return <>
        <dialog ref={dialogRef} className={`action-dialog ${route?.kind === "upload" || route?.kind === "edit" ? "action-dialog-wide" : route && ["login", "register", "forgot"].includes(route.kind) ? "action-dialog-auth" : ""}`} aria-labelledby="action-modal-title"
            onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')]
                    .filter((element) => !element.closest("[hidden]") && element.getClientRects().length);
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }}
            onCancel={(event) => { event.preventDefault(); close(); }}
            onClick={(event) => { if (event.target === dialogRef.current) {
                const rect = event.currentTarget.getBoundingClientRect();
                if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
            } }}>
            <div className="action-dialog-header">
                <div><span className="action-dialog-eyebrow">NUSATALES</span><h2 id="action-modal-title">{route?.title}</h2></div>
                <button type="button" className="action-dialog-close" aria-label="Tutup popup" onClick={close}><X size={20} /></button>
            </div>
            {route?.kind === "upload" && <p className="action-dialog-note">Boleh ditutup, unggahan tetap berjalan. Hindari reload sampai selesai.</p>}
            <div className="action-dialog-body">
                {visited.map((item) => {
                    const Page = pages[item.kind];
                    return <div key={item.key} hidden={key !== item.key}>
                        <Page embedded videoId={item.videoId} onAuthenticated={authenticated} onStatusChange={setUploadStatus} />
                    </div>;
                })}
            </div>
        </dialog>
    </>;
}
