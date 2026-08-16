import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MdcatXpert — Master Your MDCAT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(5,150,105,0.35), transparent 55%), radial-gradient(circle at 85% 85%, rgba(59,130,246,0.3), transparent 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 84,
            fontWeight: 900,
            letterSpacing: -2,
            color: "white",
          }}
        >
          Mdcat
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Xpert
          </span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            fontWeight: 600,
            color: "#cbd5e1",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Ace your MDCAT with Scientific Precision.
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 44,
          }}
        >
          {["UHS", "SZABMU", "DUHS", "ETEA"].map((board) => (
            <div
              key={board}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#94a3b8",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {board}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
