/** Magic-byte content sniff. Returns a canonical MIME or null. Callers apply
 *  their own allow-list on top (e.g. vector stores exclude images). */
export function sniffMime(head: Buffer): string | null {
    if (head.slice(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
    if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
    if (head.every((b) => b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b < 0x7f) || b >= 0x80)) return "text/plain";
    return null;
}
