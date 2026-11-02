// Small, project-owned Sheet primitive using the same Radix foundation as shadcn/ui.
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
export function SheetContent({ children }) {
    return <Dialog.Portal>
        <Dialog.Overlay className="nusa-sheet-overlay" />
        <Dialog.Content className="nusa-sheet-content">
            {children}
            <Dialog.Close className="nusa-icon-button nusa-sheet-close" aria-label="Tutup menu">
                <X size={20} aria-hidden="true" />
            </Dialog.Close>
        </Dialog.Content>
    </Dialog.Portal>;
}
