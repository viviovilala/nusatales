import React from "react";
import { AuthProvider } from "./features/auth/AuthProvider";
import { AppRouter } from "./app/router";

export default function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}
