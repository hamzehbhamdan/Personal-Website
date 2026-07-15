
import { ImageResponse } from "next/og"
import { loadPlayfair } from "@/lib/og-font"

export const dynamic = "force-static"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
    const fontData = await loadPlayfair()

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
                        HARVARD SENIOR THESIS · 2025
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
                    HARVARD COLLEGE · COMPUTER SCIENCE &amp; STATISTICS
                </span>

                {/* Center content */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20, marginBottom: "auto" }}>
                    <span
                        style={{
                            fontFamily: fontData ? "Playfair" : "Georgia, serif",
                            fontSize: 72,
                            fontWeight: 700,
                            color: "#1c1917",
                            lineHeight: 1.05,
                        }}
                    >
                        Cross-Market Signals
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: 18, color: "#78716c", letterSpacing: "0.04em" }}>
                        U.S.–China equity market interdependence · Hamzeh Hamdan
                    </span>
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
