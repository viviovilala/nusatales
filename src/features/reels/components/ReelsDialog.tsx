import React, { useId, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { usePageScrollLock } from "../../../lib/pageScrollLock";

export default function ReelsDialog({ open, title, onClose, children }: {
    open: boolean; title: string; onClose: () => void; children: ReactNode;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const id = useId();
    usePageScrollLock(open);
    useLayoutEffect(() => {
        const dialog = ref.current;
        if (!open || !dialog) return;
        const trigger = document.activeElement;
        dialog.showModal();
        return () => {
            dialog.close();
            const target = trigger instanceof HTMLElement && trigger.isConnected && trigger.getClientRects().length
                ? trigger : document.querySelector<HTMLElement>(".reels-creator-action");
            target?.focus({ preventScroll: true });
        };
    }, [open]);
    return <dialog ref={ref} className="reels-dialog" aria-labelledby={id}
        onCancel={(event) => { event.preventDefault(); onClose(); }}
        onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
        }}
        onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
                .filter((element) => !element.closest("[hidden]") && element.getClientRects().length);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
        <header className="reels-dialog-header"><h2 id={id}>{title}</h2><button type="button" aria-label={`Tutup ${title.toLowerCase()}`} onClick={onClose}><X size={19} /></button></header>
        {children}
    </dialog>;
}
