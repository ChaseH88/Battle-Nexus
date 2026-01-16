import { memo, useId, useMemo } from "react";
import { darken, lighten, mix } from "polished";
import { Affinity } from "@/cards";
import { Box, SxProps } from "@mui/material";

const AFFINITY_BASE: Record<Affinity, string> = {
  FIRE: "#FF7A00",
  WATER: "#1C7ED6",
  GRASS: "#8A6B2D",
  LIGHTNING: "#F2B705",
  ICE: "#4CC3E6",
  WIND: "#22A07A",
  METAL: "#4A5D73",
  LIGHT: "#FFD166",
  SHADOW: "#3B2A8C",
  PSYCHIC: "#B2367A",
};

const derive = (base: string) => ({
  // panel body
  top: lighten(0.01, "#121B22"),
  mid: "#0B1116",
  bot: darken(0.02, "#070B0F"),

  // frame/lip
  rimOuter: "#05080B",
  rimInner: "#1B2A34",

  // cyan accents
  cyan: mix(0.55, base, "#19D3FF"),
  cyanBright: mix(0.35, base, "#7AF1FF"),
  cyanDim: mix(0.75, base, "#0AA7C6"),
});

type DescriptionStatsBackgroundProps = {
  width?: number; // px
  height?: number; // px
  affinity?: Affinity;
  /** If you want extra padding inside the panel */
  inset?: number;
  className?: string;
  sx?: SxProps;
};

/**
 * Bottom “description + stats” background area ONLY.
 * You overlay your actual text + StatBar component on top.
 */
export const DescriptionStatsBackground = memo(
  ({
    width = 560,
    height = 260,
    affinity = Affinity.Ice,
    inset = 10,
    className,
    sx,
  }: DescriptionStatsBackgroundProps) => {
    const uid = useId();

    // Local panel space (this is NOT the full card; just the bottom section)
    const vbW = 560;
    const vbH = 260;

    const colors = useMemo(() => {
      const base = AFFINITY_BASE[affinity] ?? AFFINITY_BASE.WATER;
      return derive(base);
    }, [affinity]);

    const chamfer = 16;

    const outer = useMemo(() => {
      const w = vbW;
      const h = vbH;
      const c = chamfer;
      return [
        `M ${c} 0`,
        `L ${w - c} 0`,
        `L ${w} ${c}`,
        `L ${w} ${h - c}`,
        `L ${w - c} ${h}`,
        `L ${c} ${h}`,
        `L 0 ${h - c}`,
        `L 0 ${c}`,
        "Z",
      ].join(" ");
    }, []);

    const inner = useMemo(() => {
      const x0 = inset;
      const y0 = inset;
      const w = vbW - inset * 2;
      const h = vbH - inset * 2;
      const c = Math.max(10, chamfer - 6);
      return [
        `M ${x0 + c} ${y0}`,
        `L ${x0 + w - c} ${y0}`,
        `L ${x0 + w} ${y0 + c}`,
        `L ${x0 + w} ${y0 + h - c}`,
        `L ${x0 + w - c} ${y0 + h}`,
        `L ${x0 + c} ${y0 + h}`,
        `L ${x0} ${y0 + h - c}`,
        `L ${x0} ${y0 + c}`,
        "Z",
      ].join(" ");
    }, [inset]);

    // Top separator line where the art-box ends (like your card)
    const separatorY = 34; // tweak if you want

    // Suggested area for statbar overlay (just a visual “base” glow line)
    const bottomGuideY = vbH - inset - 68;

    return (
      <Box sx={sx}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${vbW} ${vbH}`}
          className={className}
          style={{ display: "block" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.top} />
              <stop offset="0.55" stopColor={colors.mid} />
              <stop offset="1" stopColor={colors.bot} />
            </linearGradient>

            <linearGradient id={`${uid}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={colors.cyanDim} />
              <stop offset="0.5" stopColor={colors.cyanBright} />
              <stop offset="1" stopColor={colors.cyanDim} />
            </linearGradient>

            {/* subtle texture (keeps it from looking flat) */}
            <filter
              id={`${uid}-tex`}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                seed="7"
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="matrix"
                values="
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0.22 0"
                result="alphaNoise"
              />
              <feComposite in="alphaNoise" in2="SourceGraphic" operator="in" />
            </filter>

            <filter
              id={`${uid}-glow`}
              x="-30%"
              y="-80%"
              width="160%"
              height="260%"
            >
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer shell */}
          <path d={outer} fill={colors.rimOuter} />

          {/* Inner body */}
          <path d={inner} fill={`url(#${uid}-bg)`} />

          {/* Texture overlay */}
          <path
            d={inner}
            fill="#FFFFFF"
            opacity="0.08"
            filter={`url(#${uid}-tex)`}
          />

          {/* Inner lip */}
          <path
            d={inner}
            fill="none"
            stroke={colors.rimInner}
            strokeWidth="2"
            opacity="0.9"
          />

          {/* Cyan outline (thin) */}
          <path
            d={inner}
            fill="none"
            stroke={`url(#${uid}-stroke)`}
            strokeWidth="2.1"
            opacity="0.9"
            filter={`url(#${uid}-glow)`}
          />

          {/* TOP separator line (this is the “art box ends here” line on the card) */}
          <path
            d={`M ${inset + 24} ${separatorY} L ${
              vbW - inset - 24
            } ${separatorY}`}
            stroke={colors.cyanBright}
            strokeWidth="2"
            opacity="0.7"
            filter={`url(#${uid}-glow)`}
          />

          {/* faint left/right inner rails (gives that frame feel) */}
          <path
            d={`M ${inset + 6} ${separatorY + 10} L ${inset + 6} ${
              vbH - inset - 10
            }`}
            stroke={colors.cyanDim}
            strokeWidth="2"
            opacity="0.25"
          />
          <path
            d={`M ${vbW - inset - 6} ${separatorY + 10} L ${vbW - inset - 6} ${
              vbH - inset - 10
            }`}
            stroke={colors.cyanDim}
            strokeWidth="2"
            opacity="0.25"
          />

          {/* Bottom guide glow where stat bar typically sits (optional but matches card vibe) */}
          <path
            d={`M ${inset + 40} ${bottomGuideY} L ${
              vbW - inset - 40
            } ${bottomGuideY}`}
            stroke={colors.cyanBright}
            strokeWidth="2"
            opacity="0.35"
            filter={`url(#${uid}-glow)`}
          />
        </svg>
      </Box>
    );
  }
);
