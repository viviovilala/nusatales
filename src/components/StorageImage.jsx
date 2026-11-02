import React, { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { getStorageImageUrl, IMAGE_URL_TTL_SECONDS } from "../lib/storageImages";

/** Renew signed URLs and discard results belonging to an old path or session. */
export function useStorageImageUrl(path) {
    const { user } = useAuth();
    const requestKey = `${user?.id || "anonymous"}:${path || ""}`;
    const [resolved, setResolved] = useState({ key: "", url: null });
    useEffect(() => {
        let active = true;
        async function resolve() {
            const url = await getStorageImageUrl(path);
            if (active) setResolved({ key: requestKey, url });
        }
        resolve();
        const timer = path ? setInterval(resolve, (IMAGE_URL_TTL_SECONDS - 60) * 1000) : null;
        return () => { active = false; clearInterval(timer); };
    }, [path, requestKey]);
    return resolved.key === requestKey ? resolved.url : null;
}

export default function StorageImage({ path, fallbackSrc = "/poto/splash-senyum.webp", alt, ...props }) {
    const url = useStorageImageUrl(path);
    const [failedUrl, setFailedUrl] = useState(null);
    return <img {...props} alt={alt} src={url && url !== failedUrl ? url : fallbackSrc}
        onError={() => { if (url) setFailedUrl(url); }} />;
}
