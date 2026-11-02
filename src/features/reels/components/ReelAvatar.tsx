import React, { useState } from "react";
import { useStorageImageUrl } from "../../../components/StorageImage";
import type { ReelCreator } from "../reelTypes";

export default function ReelAvatar({ creator }: { creator: ReelCreator }) {
    const url = useStorageImageUrl(creator.avatarPath);
    const [failed, setFailed] = useState<string | null>(null);
    return <span className="reel-avatar">{url && url !== failed ? <img src={url} alt="" onError={() => setFailed(url)} /> : <span>{creator.displayName.charAt(0).toUpperCase()}</span>}</span>;
}
