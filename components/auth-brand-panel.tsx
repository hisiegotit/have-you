import { HaveYouLogo } from "@/components/have-you-logo";

const POSTERS = [
  { bg: "linear-gradient(160deg, oklch(0.28 0.08 250) 0%, oklch(0.12 0.02 272) 100%)", title: "NOIR",  year: "2021" },
  { bg: "linear-gradient(150deg, oklch(0.30 0.10 35)  0%, oklch(0.15 0.04 52)  100%)", title: "EMBER", year: "2019" },
  { bg: "linear-gradient(165deg, oklch(0.24 0.07 195) 0%, oklch(0.13 0.03 215) 100%)", title: "DRIFT", year: "2023" },
  { bg: "linear-gradient(155deg, oklch(0.26 0.09 315) 0%, oklch(0.14 0.04 335) 100%)", title: "HEIST", year: "2020" },
  { bg: "linear-gradient(145deg, oklch(0.22 0.05 155) 0%, oklch(0.13 0.02 175) 100%)", title: "ECHO",  year: "2022" },
  { bg: "linear-gradient(160deg, oklch(0.27 0.08 355) 0%, oklch(0.14 0.03 20)  100%)", title: "GHOST", year: "2018" },
  { bg: "linear-gradient(150deg, oklch(0.20 0.04 235) 0%, oklch(0.12 0.02 255) 100%)", title: "PRISM", year: "2022" },
  { bg: "linear-gradient(155deg, oklch(0.28 0.08 70)  0%, oklch(0.15 0.04 90)  100%)", title: "FERAL", year: "2021" },
  { bg: "linear-gradient(160deg, oklch(0.25 0.09 290) 0%, oklch(0.14 0.04 310) 100%)", title: "VOID",  year: "2023" },
  { bg: "linear-gradient(145deg, oklch(0.22 0.05 130) 0%, oklch(0.13 0.02 148) 100%)", title: "EDEN",  year: "2019" },
  { bg: "linear-gradient(158deg, oklch(0.29 0.07 180) 0%, oklch(0.14 0.03 200) 100%)", title: "SURGE", year: "2024" },
  { bg: "linear-gradient(152deg, oklch(0.26 0.09 40)  0%, oklch(0.15 0.05 60)  100%)", title: "STRAY", year: "2020" },
];

const doubled = [...POSTERS, ...POSTERS];
const PERFS = Array.from({ length: 20 });

function PosterColumn({ duration, delay }: { duration: number; delay: number }) {
  return (
    <div style={{ flex: "0 0 155px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          animation: `auth-scroll-up ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      >
        {doubled.map((p, i) => (
          <div
            key={i}
            style={{
              width: "155px",
              height: "232px",
              borderRadius: "10px",
              background: p.bg,
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                background: "linear-gradient(to top, oklch(0 0 0 / 0.78) 0%, transparent 65%)",
                padding: "28px 12px 12px",
              }}
            >
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "oklch(0.90 0 0)", letterSpacing: "0.1em" }}>
                {p.title}
              </div>
              <div style={{ fontSize: "0.6rem", color: "oklch(0.50 0 0)", marginTop: "3px" }}>
                {p.year}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <aside
      className="hidden md:flex flex-col"
      style={{
        width: "420px",
        flexShrink: 0,
        background: "oklch(0.095 0 0)",
        borderRight: "1px solid oklch(1 0 0 / 8%)",
      }}
    >
      {/* Top perf strip */}
      <div
        style={{
          height: "28px",
          borderBottom: "1px solid oklch(1 0 0 / 8%)",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: "10px",
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
          zIndex: 4,
        }}
      >
        {PERFS.map((_, i) => (
          <div key={i} style={{ width: "15px", height: "10px", borderRadius: "3px", background: "oklch(0.17 0 0)", flexShrink: 0 }} />
        ))}
      </div>

      {/* Poster scroll area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Columns */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "0 40px",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <PosterColumn duration={36} delay={0} />
          <PosterColumn duration={28} delay={-14} />
        </div>

        {/* Top fade */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "110px",
            background: "linear-gradient(to bottom, oklch(0.095 0 0) 0%, transparent 100%)",
            pointerEvents: "none", zIndex: 2,
          }}
        />
        {/* Bottom fade */}
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "110px",
            background: "linear-gradient(to top, oklch(0.095 0 0) 0%, transparent 100%)",
            pointerEvents: "none", zIndex: 2,
          }}
        />

        {/* Center scrim + branding */}
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "24px", zIndex: 3, textAlign: "center",
            padding: "0 40px",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "oklch(0 0 0 / 0.46)" }} />

          <div style={{ position: "relative", zIndex: 1, color: "oklch(0.985 0 0)" }}>
            <HaveYouLogo className="w-[72px] h-[72px]" />
          </div>

          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "1px" }}>
            <span style={{ fontSize: "1.875rem", fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.1, color: "oklch(0.985 0 0)" }}>
              have you
            </span>
            <span style={{ fontSize: "1.875rem", fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.1, color: "oklch(0.48 0 0)" }}>
              ...watched?
            </span>
          </div>

          <p style={{ position: "relative", zIndex: 1, fontSize: "0.875rem", color: "oklch(0.50 0 0)", lineHeight: 1.75, maxWidth: "200px" }}>
            track every film.<br />remember every moment.
          </p>
        </div>
      </div>

      {/* Bottom perf strip */}
      <div
        style={{
          height: "28px",
          borderTop: "1px solid oklch(1 0 0 / 8%)",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: "10px",
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
          zIndex: 4,
        }}
      >
        {PERFS.map((_, i) => (
          <div key={i} style={{ width: "15px", height: "10px", borderRadius: "3px", background: "oklch(0.17 0 0)", flexShrink: 0 }} />
        ))}
      </div>
    </aside>
  );
}
