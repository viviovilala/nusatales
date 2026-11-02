/** Public destinations always match the content format stored in the database. */
export function videoHref(video) {
    return (video.content_type || video.contentType) === "animation"
        ? `/watch/${video.id}` : `/reels/${video.id}`;
}
