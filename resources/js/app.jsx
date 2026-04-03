import "./bootstrap";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import AccountHub from "./pages/AccountHub.jsx";
import AdminStudio from "./pages/AdminStudio.jsx";
import AnimationViewer from "./pages/AnimationViewer.jsx";
import CreatorStudio from "./pages/CreatorStudio.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LandingPage from "./pages/Landingpage.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/login.jsx";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
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
            </BrowserRouter>
        </AuthProvider>
    );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
