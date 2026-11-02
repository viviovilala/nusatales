import { inflateSync } from "node:zlib";

/** Read an opaque browser screenshot of exactly one pixel (8-bit RGB/RGBA PNG).
 * Its first pixel has no left/previous-row neighbours, so all PNG filters have
 * the same RGB bytes. This checks the painted gutter, not just CSS declarations.
 */
export async function screenshotPixel(page, x, y) {
    const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
    if (png.readUInt32BE(16) !== 1 || png.readUInt32BE(20) !== 1 || png[24] !== 8 || ![2, 6].includes(png[25])) throw new Error("Expected a one-pixel RGB/RGBA PNG.");
    const chunks = [];
    for (let offset = 8; offset < png.length;) {
        const size = png.readUInt32BE(offset);
        if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + size));
        offset += size + 12;
    }
    const decoded = inflateSync(Buffer.concat(chunks));
    return [...decoded.subarray(1, 4)];
}
