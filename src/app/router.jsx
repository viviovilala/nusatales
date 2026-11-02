import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "../features/auth/RequireAuth";

// Pages
import LandingPage from "../pages/LandingPage";
import NotFoundPage from "../pages/NotFoundPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import AuthCallbackPage from "../features/auth/pages/AuthCallbackPage";
import ReelsPage from "../features/reels/pages/ReelsPage";
import StudioPage from "../features/videos/pages/StudioPage";
import UploadPage from "../features/videos/pages/UploadPage";
import EditVideoPage from "../features/videos/pages/EditVideoPage";
import ProfileSettingsPage from "../features/profile/pages/ProfileSettingsPage";
import PublicProfilePage from "../features/profile/pages/PublicProfilePage";

export function AppRouter() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/reels" element={<ReelsPage />} />
            <Route path="/reels/:videoId" element={<ReelsPage />} />
            <Route path="/u/:username" element={<PublicProfilePage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
            <Route
                path="/studio/upload"
                element={
                    <RequireAuth>
                        <UploadPage />
                    </RequireAuth>
                }
            />
            <Route
                path="/studio/videos/:id/edit"
                element={
                    <RequireAuth>
                        <EditVideoPage />
                    </RequireAuth>
                }
            />
            <Route
                path="/settings/profile"
                element={
                    <RequireAuth>
                        <ProfileSettingsPage />
                    </RequireAuth>
                }
            />

            {/* Legacy route redirects */}
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
    );
}
