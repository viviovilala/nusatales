import React from "react";
import { AuthProvider } from "./features/auth/AuthProvider";
import { AppRouter } from "./app/router";

export default function App() {
    return (
        <div className="app-surface batik-surface"><div className="app-content"><AuthProvider>
            <AppRouter />
        </AuthProvider></div></div>
    );
}
