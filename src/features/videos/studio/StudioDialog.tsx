import { useId, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { usePageScrollLock } from "../../../lib/pageScrollLock";

export default function StudioDialog({ title, description, children, onClose, busy = false, wide = false }: {
    title: string; description: string; children: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean;
}) {
    const id = useId();
    const ref = useRef<HTMLDialogElement>(null);
    usePageScrollLock();
    useLayoutEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        const trigger = document.activeElement;
        dialog.showModal();
        dialog.querySelector<HTMLElement>("[data-dialog-initial]")?.focus({ preventScroll: true });
        return () => {
            dialog.close();
            const target = trigger instanceof HTMLElement && trigger.isConnected && trigger.getClientRects().length
                ? trigger : document.querySelector<HTMLElement>("#studio-library-title");
            target?.focus({ preventScroll: true });
        };
    }, []);
    return createPortal(<dialog ref={ref} className={`studio-dialog ${wide ? "studio-dialog-wide" : ""}`} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
        onCancel={(event) => { event.preventDefault(); event.stopPropagation(); if (!busy) onClose(); }}
        onClick={(event) => {
            if (busy || event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
        }} onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            event.stopPropagation();
            const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), video[controls], [tabindex="0"]')].filter((element) => !element.matches(":disabled") && element.getClientRects().length);
            const first = controls[0]; const last = controls.at(-1);
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}>
        <header><div><span className="studio-eyebrow">NUSATALES STUDIO</span><h2 id={`${id}-title`}>{title}</h2></div>
            <button className="studio-icon-button" type="button" aria-label="Tutup dialog" disabled={busy} onClick={onClose}><X size={19} /></button></header>
        <p id={`${id}-description`} className="studio-dialog-description">{description}</p>{children}
    </dialog>, document.body);
}
