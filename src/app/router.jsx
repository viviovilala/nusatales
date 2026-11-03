import React, { useCallback, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { ModalContext } from "./ModalContext";
import { getModalRoute, safeReturnPath } from "./modalRoutes";
import ActionModalHost from "./ActionModalHost";
import { RequireAuth } from "../features/auth/RequireAuth";
import { useContentSync } from "../lib/contentSync";

// Pages
import LandingPage from "../pages/LandingPage";
import NotFoundPage from "../pages/NotFoundPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import AuthCallbackPage from "../features/auth/pages/AuthCallbackPage";
import ReelsPage from "../features/reels/pages/ReelsPage";
import AnimationCatalogPage from "../features/animations/pages/AnimationCatalogPage";
import WatchAnimationPage from "../features/animations/pages/WatchAnimationPage";
import StudioPage from "../features/videos/pages/StudioPage";
import PublicProfilePage from "../features/profile/pages/PublicProfilePage";

export function AppRouter() {
    const location = useLocation();
    const navigate = useNavigate();
    const currentLocation = useRef(location);
    currentLocation.current = location;
    const { user, isLoading } = useAuth();
    useContentSync(user?.id || null);
    const requested = getModalRoute(location.pathname);
    // Keep the same Routes location while the address bar displays an action.
    const background = requested ? location.state?.modalBackground || { pathname: "/", search: "", hash: "", key: "modal-home" } : location;
    const close = useCallback(() => {
        if (location.state?.modalEntry) navigate(-1);
        else navigate(safeReturnPath(background.pathname + (background.search || "") + (background.hash || "")), { replace: true });
    }, [navigate, location.state, background]);
    const open = useCallback((to, state) => {
        navigate(to, { replace: Boolean(requested), state: {
            ...state,
            modalBackground: background,
            modalEntry: requested ? Boolean(location.state?.modalEntry) : true,
            afterAuth: location.state?.afterAuth,
        } });
    }, [navigate, background, requested, location.state]);
    const authenticated = useCallback(() => {
        // A slow sign-in must not reopen an action the user already dismissed.
        if (!["/login", "/register"].includes(currentLocation.current.pathname.replace(/\/+$/, ""))) return;
        const destination = location.state?.afterAuth || location.state?.from?.pathname;
        if (destination && getModalRoute(destination)) {
            navigate(safeReturnPath(destination), { replace: true, state: {
                modalBackground: background, modalEntry: Boolean(location.state?.modalEntry),
            } });
        } else if (destination && destination !== background.pathname) navigate(safeReturnPath(destination), { replace: true });
        else close();
    }, [navigate, location.state, background, close]);
    useEffect(() => {
        if (requested?.protected && !isLoading && !user) navigate("/login", { replace: true, state: {
            modalBackground: background, modalEntry: Boolean(location.state?.modalEntry), afterAuth: location.pathname,
        } });
    }, [requested?.protected, isLoading, user, navigate, location.pathname, location.state, background]);
    const modalRoute = requested?.protected && (!user || isLoading) ? null : requested;
    return (
        <ModalContext.Provider value={{ open, close, isOpen: Boolean(requested) }}>
        <Routes location={background}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/animations" element={<AnimationCatalogPage />} />
            <Route path="/watch/:videoId" element={<WatchAnimationPage />} />
            <Route path="/reels" element={<ReelsPage />} />
            <Route path="/reels/:videoId" element={<ReelsPage />} />
            <Route path="/u/:username" element={<PublicProfilePage />} />

            {/* Auth Routes */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected Routes (Member/Creator) */}
            <Route
                path="/studio"
                element={
                    <RequireAuth>
                        <StudioPage />
                    </RequireAuth>
                }
            />

            {/* Legacy route redirects */}
            <Route path="/katalog" element={<Navigate to="/animations" replace />} />
            <Route path="/shorts" element={<Navigate to="/reels" replace />} />
            <Route path="/dashboard" element={<Navigate to="/studio" replace />} />
            <Route path="/creator/studio" element={<Navigate to="/studio" replace />} />
            <Route path="/account" element={<Navigate to="/settings/profile" replace />} />
            <Route path="/admin/studio" element={<Navigate to="/studio" replace />} />
            <Route path="/jelajah" element={<Navigate to="/reels" replace />} />
            <Route path="/peta" element={<Navigate to="/" replace />} />
            <Route path="/favorit" element={<Navigate to="/reels" replace />} />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ActionModalHost key={user?.id || "anonymous"} route={modalRoute} close={close} authenticated={authenticated} />
        </ModalContext.Provider>
    );
}
