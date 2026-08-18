"use client";

const T = {
  surfaceRaised: "#212C4B",
  hairline: "#2E3A57",
  text: "#EDEFF5",
  muted: "#8D97B0",
  amber: "#F2A93B",
  teal: "#3FB8AF",
  coral: "#E5573F",
};

export function scoreColor(score: number) {
  if (score >= 70) return T.teal;
  if (score >= 40) return T.amber;
  return T.coral;
}

export default function MatchGauge({ score }: { score: number }) {
  const size = 168;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  const color = scoreColor(pct);
  const ticks = Array.from({ length: 21 }, (_, i) => i);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ticks.map((i) => {
          const angle = (i / 20) * 270 - 225;
          const rad = (angle * Math.PI) / 180;
          const inner = r - stroke / 2 - 4;
          const outer = r - stroke / 2 + 2;
          const cx = size / 2,
            cy = size / 2;
          const x1 = cx + inner * Math.cos(rad);
          const y1 = cy + inner * Math.sin(rad);
          const x2 = cx + outer * Math.cos(rad);
          const y2 = cy + outer * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={T.hairline}
              strokeWidth={1}
            />
          );
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={T.surfaceRaised}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 900ms ease-out" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 40,
            fontWeight: 600,
            color: T.text,
            lineHeight: 1,
          }}
        >
          {Math.round(pct)}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.12em",
            color: T.muted,
            marginTop: 6,
          }}
        >
          MATCH SCORE
        </span>
      </div>
    </div>
  );
}
