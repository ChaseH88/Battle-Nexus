import { CreatureCard } from "@cards/CreatureCard";
import { useMemo, memo, useId } from "react";
import { darken, lighten, mix, readableColor } from "polished";
import { Affinity } from "@/cards";

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

const deriveColors = (base: string) => ({
  halo: mix(0.75, "#FFFFFF", lighten(0.05, base)),
  outerRing: lighten(0.08, base),
  whiteRing: "#FFFFFF",
  top: lighten(0.16, base),
  bottom: darken(0.12, base),
  text: readableColor(base, "#111111", "#FFFFFF", false),
});

interface CostProps extends Pick<CreatureCard, "cost" | "affinity"> {
  size?: number;
  textColor?: string;
}

export const Cost = memo(
  ({ size = 35, cost = 1, affinity = Affinity.Fire, textColor }: CostProps) => {
    const gradId = useId();

    // Memoize dimensions to prevent recalculation
    const dimensions = useMemo(() => {
      const w = size;
      const h = Math.round(size * 0.8660254); // flat-top hex height
      const cx = w / 2;
      const cy = h / 2;
      return { w, h, cx, cy };
    }, [size]);

    // Memoize colors to prevent polished recalculations
    const colors = useMemo(() => {
      const base = AFFINITY_BASE[affinity] ?? AFFINITY_BASE.FIRE;
      return deriveColors(base);
    }, [affinity]);

    // Memoize polygon points
    const points = useMemo(() => {
      const { w, h } = dimensions;
      return [
        [w * 0.25, 0],
        [w * 0.75, 0],
        [w, h * 0.5],
        [w * 0.75, h],
        [w * 0.25, h],
        [0, h * 0.5],
      ]
        .map(([x, y]) => `${x},${y}`)
        .join(" ");
    }, [dimensions]);

    // Memoize transform function
    const getTransform = useMemo(() => {
      const { cx, cy } = dimensions;
      return (s: number) =>
        `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;
    }, [dimensions]);

    // Scale constants
    const S_HALO = 1.0;
    const S_OUTER = 0.92;
    const S_WHITE = 0.84;
    const S_FILL = 0.74;

    const { w, h } = dimensions;

    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.top} />
            <stop offset="1" stopColor={colors.bottom} />
          </linearGradient>
        </defs>

        {/* Soft halo */}
        <polygon
          points={points}
          fill={colors.halo}
          opacity={0.9}
          transform={getTransform(S_HALO)}
        />

        {/* Thin colored ring */}
        <polygon
          points={points}
          fill={colors.outerRing}
          transform={getTransform(S_OUTER)}
        />

        {/* Thick white ring */}
        <polygon
          points={points}
          fill={colors.whiteRing}
          transform={getTransform(S_WHITE)}
        />

        {/* Inner fill */}
        <polygon
          points={points}
          fill={`url(#${gradId})`}
          transform={getTransform(S_FILL)}
        />

        {/* Number */}
        <text
          x="50%"
          y="54%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
          fontWeight="900"
          fontSize={Math.round(size * 0.5)}
          fill={textColor || colors.text || "#FFFFFF"}
        >
          {String(cost)}
        </text>
      </svg>
    );
  }
);
