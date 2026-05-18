import "./bootstrap";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import AccountHub from "./pages/AccountHub.jsx";
import AdminStudio from "./pages/AdminStudio.jsx";
import AnimationViewer from "./pages/AnimationViewer.jsx";
import CreatorStudio from "./pages/CreatorStudio.jsx";

// Bulletproof DOM safety patch to prevent browser translation & extensions from crashing React
(() => {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function (child) {
        if (child && child.parentNode !== this) {
            return child;
        }
        return originalRemoveChild.call(this, child);
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (newNode, referenceNode) {
        if (referenceNode && referenceNode.parentNode !== this) {
            return this.appendChild(newNode);
        }
        return originalInsertBefore.call(this, newNode, referenceNode);
    };
})();

// Global error diagnostic boundary to instantly catch any hidden runtime crashes
window.addEventListener("error", (event) => {
    const errorContainer = document.createElement("div");
    errorContainer.style.position = "fixed";
    errorContainer.style.inset = "0";
    errorContainer.style.backgroundColor = "rgba(0,0,0,0.9)";
    errorContainer.style.color = "#ff6b6b";
    errorContainer.style.padding = "24px";
    errorContainer.style.fontFamily = "monospace";
    errorContainer.style.zIndex = "999999";
    errorContainer.style.overflowY = "auto";
    errorContainer.innerHTML = `
        <h1 style="color: #fff; margin-bottom: 16px;">🚨 NusaTales Runtime Error Diagnostic</h1>
        <p><strong>Message:</strong> ${event.message}</p>
        <p><strong>Source:</strong> ${event.filename}</p>
        <p><strong>Line:</strong> ${event.lineno}:${event.colno}</p>
        <pre style="background: #222; padding: 16px; border-radius: 8px; color: #aaa; margin-top: 16px; font-size: 13px;">${event.error?.stack || 'No stack trace available'}</pre>
    `;
    document.body.appendChild(errorContainer);
});

window.addEventListener("unhandledrejection", (event) => {
    const errorContainer = document.createElement("div");
    errorContainer.style.position = "fixed";
    errorContainer.style.inset = "0";
    errorContainer.style.backgroundColor = "rgba(0,0,0,0.9)";
    errorContainer.style.color = "#ff6b6b";
    errorContainer.style.padding = "24px";
    errorContainer.style.fontFamily = "monospace";
    errorContainer.style.zIndex = "999999";
    errorContainer.style.overflowY = "auto";
    errorContainer.innerHTML = `
        <h1 style="color: #fff; margin-bottom: 16px;">🚨 NusaTales Unhandled Promise Rejection</h1>
        <p><strong>Reason:</strong> ${event.reason}</p>
    `;
    document.body.appendChild(errorContainer);
});
import Dashboard from "./pages/Dashboard.jsx";
import LandingPage from "./pages/Landingpage.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/login.jsx";
import Shorts from "./pages/Shorts.jsx";
import Jelajah from "./pages/Jelajah.jsx";
import Peta from "./pages/Peta.jsx";
import Favorit from "./pages/Favorit.jsx";

function SplashScreen({ onComplete }) {
    const [phase, setPhase] = useState("enter");

    useEffect(() => {
        const leaveTimer = window.setTimeout(() => setPhase("leave"), 1300);
        const hideTimer = window.setTimeout(() => {
            setPhase("hidden");
            if (onComplete) onComplete();
        }, 1850);

        return () => {
            window.clearTimeout(leaveTimer);
            window.clearTimeout(hideTimer);
        };
    }, [onComplete]);

    if (phase === "hidden") {
        return null;
    }

    return (
        <div
            className={`splash-screen ${phase === "leave" ? "splash-screen--leave" : ""}`}
            onTransitionEnd={() => {
                if (phase === "leave") {
                    setPhase("hidden");
                    if (onComplete) onComplete();
                }
            }}
        >
            <div className="splash-screen__glow splash-screen__glow--left" />
            <div className="splash-screen__glow splash-screen__glow--right" />

            <div className="splash-screen__content">
                <img
                    src="/poto/splash-nusatales.webp"
                    className="splash-screen__logo"
                    alt="NusaTales"
                />
                <img
                    src="/poto/splash-senyum.webp"
                    className="splash-screen__mascot"
                    alt="Maskot NusaTales"
                />
                <div className="splash-screen__bar" aria-hidden="true">
                    <span />
                </div>
            </div>
        </div>
    );
}

function AppRoutes() {
    const location = useLocation();

    return (
        <div key={location.pathname} className="page-shell">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/shorts" element={<Shorts />} />
                    <Route path="/jelajah" element={<Jelajah />} />
                    <Route path="/peta" element={<Peta />} />
                    <Route path="/favorit" element={<Favorit />} />
                    <Route path="/animations/:id" element={<AnimationViewer />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["admin", "kreator", "user"]}>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/creator/studio"
                        element={
                            <ProtectedRoute allowedRoles={["admin", "kreator"]}>
                                <CreatorStudio />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/account"
                        element={
                            <ProtectedRoute allowedRoles={["admin", "kreator", "user"]}>
                                <AccountHub />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/studio"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminStudio />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <SplashScreen />
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
