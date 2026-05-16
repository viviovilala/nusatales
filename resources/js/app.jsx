import "./bootstrap";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import {
    ChannelPage,
    ExplorePage,
    FavoritPage,
    HomePage,
    LanglangPage,
    LoginPage,
    MapPage,
    PremiumPage,
    ProfilePage,
    RegisterPage,
    SayembaraPage,
    SearchPage,
    SeriesPage,
    ShortsPage,
    SimpleStudioPage,
    StorePage,
    StudioDashboardPage,
    StudioKaryaPage,
    StudioUploadPage,
    WatchPage,
} from "./pages/NusaTalesPages.jsx";

const studioRoles = ["admin", "user"];

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/shorts" element={<ShortsPage />} />
                    <Route path="/jelajah" element={<ExplorePage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/peta" element={<MapPage />} />
                    <Route path="/langlang" element={<LanglangPage />} />
                    <Route path="/favorit" element={<FavoritPage />} />
                    <Route path="/favorites" element={<FavoritPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/premium" element={<PremiumPage />} />
                    <Route path="/nusaadhi" element={<PremiumPage />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="/sayembara" element={<SayembaraPage />} />
                    <Route path="/watch/:slug" element={<WatchPage />} />
                    <Route path="/episodes/:slug" element={<WatchPage />} />
                    <Route path="/animations/:slug" element={<WatchPage />} />
                    <Route path="/series/:slug" element={<SeriesPage />} />
                    <Route path="/channel/:slug" element={<ChannelPage />} />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute allowedRoles={studioRoles}>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/search" element={<SearchPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={studioRoles}>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/studio"
                        element={
                            <ProtectedRoute allowedRoles={studioRoles}>
                                <StudioDashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/creator/studio"
                        element={
                            <ProtectedRoute allowedRoles={studioRoles}>
                                <StudioDashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/studio/upload"
                        element={
                            <ProtectedRoute allowedRoles={studioRoles}>
                                <StudioUploadPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/studio/karya"
                        element={
                            <ProtectedRoute allowedRoles={studioRoles}>
                                <StudioKaryaPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/account" element={<ProtectedRoute allowedRoles={studioRoles}><ProfilePage /></ProtectedRoute>} />
                    <Route path="/studio/profile" element={<ProtectedRoute allowedRoles={studioRoles}><SimpleStudioPage title="Profil Studio" active="Profil" /></ProtectedRoute>} />
                    <Route path="/studio/analytics" element={<ProtectedRoute allowedRoles={studioRoles}><StudioDashboardPage /></ProtectedRoute>} />
                    <Route path="/studio/settings" element={<ProtectedRoute allowedRoles={studioRoles}><SimpleStudioPage title="Settings Studio" active="Settings" /></ProtectedRoute>} />
                    <Route path="/studio/videos" element={<ProtectedRoute allowedRoles={studioRoles}><StudioKaryaPage /></ProtectedRoute>} />
                    <Route path="/studio/videos/:id/edit" element={<ProtectedRoute allowedRoles={studioRoles}><StudioUploadPage /></ProtectedRoute>} />
                    <Route path="/studio/monetization" element={<ProtectedRoute allowedRoles={studioRoles}><StudioDashboardPage /></ProtectedRoute>} />
                    <Route path="/studio/revenue" element={<ProtectedRoute allowedRoles={studioRoles}><SimpleStudioPage title="Pendapatan Kreator" active="Analisis" /></ProtectedRoute>} />
                    <Route path="/studio/assets" element={<ProtectedRoute allowedRoles={studioRoles}><SimpleStudioPage title="Aset Studio" active="Karya" /></ProtectedRoute>} />
                    <Route path="*" element={<HomePage />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
