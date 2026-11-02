import React, { createContext, forwardRef, useContext } from "react";
import { Link } from "react-router-dom";
import type { LinkProps, Location, To } from "react-router-dom";
import { getModalRoute } from "./modalRoutes";

export type ModalNavigationState = { from?: Location; afterAuth?: string };
export type ModalControls = {
    open: (to: To, state?: ModalNavigationState) => void;
    close: () => void;
    isOpen: boolean;
};
export const ModalContext = createContext<ModalControls | null>(null);
export function useAppModal() {
    return useContext(ModalContext);
}

// Preserve a real href for new tabs, copy-link and direct navigation.
type AppLinkProps = Omit<LinkProps, "state"> & { state?: ModalNavigationState };
export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink({ to, onClick, target, state, ...props }, ref) {
    const modal = useAppModal();
    const pathname = typeof to === "string" ? to.split(/[?#]/)[0] : to?.pathname;
    return <Link {...props} ref={ref} to={to} target={target} state={state} onClick={(event) => {
        onClick?.(event);
        if (!modal || !pathname || !getModalRoute(pathname) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || (target && target !== "_self")) return;
        event.preventDefault();
        modal.open(to, state);
    }} />;
});
