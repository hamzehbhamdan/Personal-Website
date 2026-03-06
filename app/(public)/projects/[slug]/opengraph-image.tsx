
import { ImageResponse } from "next/og"
import { projects } from "@/lib/data"

export const runtime = "edge"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

interface Props {
    params: Promise<{ slug: string }>
}

async function loadPlayfair(): Promise<ArrayBuffer | null> {
    try {
        const css = await fetch(
            "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap",
            { headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } }
        ).then((r) => r.text())
        const url = css.match(/src: url\(([^)]+)\)/)?.[1]
        if (url) return fetch(url).then((r) => r.arrayBuffer())
    } catch {}
    return null
}

export default async function Image({ params }: Props) {
    const { slug } = await params
    const project = projects.find((p) => p.slug === slug)
    const fontData = await loadPlayfair()

    const title = project?.title ?? "Project"
    const subtitle = project ? `${project.type} · hamzehhamdan.com` : "hamzehhamdan.com"

    // Clamp title length so it doesn't overflow the card
    const displayTitle = title.length > 48 ? title.slice(0, 46) + "…" : title
    const fontSize = title.length > 36 ? 60 : 72

    return new ImageResponse(
        (
            <div
                style={{
                    background: "#f9f8f6",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "56px 72px",
                }}
            >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 15, color: "#a8a29e", letterSpacing: "0.18em" }}>
                        HH<span style={{ color: "#A51C30" }}>.</span>
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "#a8a29e", letterSpacing: "0.18em" }}>
                        PROJECTS · HAMZEHHAMDAN.COM
                    </span>
                </div>

                {/* Label */}
                <span
                    style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: "#A51C30",
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        marginTop: 80,
                    }}
                >
                    {project?.type?.toUpperCase() ?? "PROJECT"}
                </span>

                {/* Title */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20, marginBottom: "auto" }}>
                    <span
                        style={{
                            fontFamily: fontData ? "Playfair" : "Georgia, serif",
                            fontSize,
                            fontWeight: 700,
                            color: "#1c1917",
                            lineHeight: 1.1,
                        }}
                    >
                        {displayTitle}
                    </span>

                    {/* Tags */}
                    {project?.tags && project.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {project.tags.slice(0, 4).map((tag) => (
                                <span
                                    key={tag}
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        color: "#78716c",
                                        letterSpacing: "0.15em",
                                        textTransform: "uppercase",
                                        border: "1px solid #e7e5e4",
                                        padding: "4px 10px",
                                        background: "#ffffff",
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom crimson rule */}
                <div style={{ width: "100%", height: 2, background: "#A51C30", marginTop: "auto" }} />
            </div>
        ),
        {
            ...size,
            fonts: fontData
                ? [{ name: "Playfair", data: fontData, weight: 700, style: "normal" }]
                : [],
        }
    )
}
