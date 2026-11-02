export type ModalKind = "login" | "register" | "forgot" | "upload" | "profile" | "edit";
export type ModalRoute = { kind: ModalKind; title: string; protected?: boolean; videoId?: string };

export function getModalRoute(pathname: string): ModalRoute | null {
    const path = pathname.replace(/\/+$/, "") || "/";
    const routes: Partial<Record<string, ModalRoute>> = {
        "/login": { kind: "login", title: "Masuk" },
        "/register": { kind: "register", title: "Daftar akun" },
        "/forgot-password": { kind: "forgot", title: "Lupa kata sandi" },
        "/studio/upload": { kind: "upload", title: "Unggah karya", protected: true },
        "/settings/profile": { kind: "profile", title: "Edit profil", protected: true },
    };
    const route = routes[path];
    if (route) return route;
    const edit = path.match(/^\/studio\/videos\/([^/]+)\/edit$/);
    const videoId = edit?.[1];
    return videoId ? { kind: "edit", title: "Edit karya", protected: true, videoId } : null;
}

export function safeReturnPath(value: unknown): string {
    return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/";
}
