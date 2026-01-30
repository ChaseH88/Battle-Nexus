import { CreatureCard } from "@cards/CreatureCard";
import { useMemo, memo, useId, ReactNode, isValidElement } from "react";
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

const deriveColors = (base: string) => ({
  halo: mix(0.75, "#FFFFFF", lighten(0.05, base)),
  outerRing: lighten(0.08, base),
  whiteRing: "#FFFFFF",
  top: lighten(0.16, base),
  bottom: darken(0.12, base),
  text: undefined, // can override if needed
});

interface CostProps extends Pick<CreatureCard, "affinity"> {
  cost: number | string | ReactNode;
  size?: number;
  textColor?: string;
  sx?: SxProps;
  showInnerRing?: boolean;
}

export const Cost = memo(
  ({
    size = 25,
    cost = 1,
    affinity = Affinity.Fire,
    textColor,
    sx,
    showInnerRing = true,
  }: CostProps) => {
    const gradId = useId();

    // Pointy-top hex: flat sides LEFT/RIGHT, points TOP/BOTTOM
    const dimensions = useMemo(() => {
      const h = size; // full height
      const w = Math.round(size * 0.8660254); // pointy-top hex width
      const cx = w / 2;
      const cy = h / 2;
      return { w, h, cx, cy };
    }, [size]);

    const points = useMemo(() => {
      const { w, h } = dimensions;
      return [
        [w * 0.5, 0], // top point
        [w, h * 0.25], // upper-right
        [w, h * 0.75], // lower-right
        [w * 0.5, h], // bottom point
        [0, h * 0.75], // lower-left
        [0, h * 0.25], // upper-left
      ]
        .map(([x, y]) => `${x},${y}`)
        .join(" ");
    }, [dimensions]);

    // Memoize colors to prevent polished recalculations
    const colors = useMemo(() => {
      const base = AFFINITY_BASE[affinity] ?? AFFINITY_BASE.FIRE;
      return deriveColors(base);
    }, [affinity]);

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
      <Box sx={sx}>
        <Box position="relative">
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
            {showInnerRing && (
              <polygon
                points={points}
                fill={colors.whiteRing}
                transform={getTransform(S_WHITE)}
              />
            )}

            {/* Inner fill */}
            <polygon
              points={points}
              fill={`url(#${gradId})`}
              transform={getTransform(S_FILL)}
            />
            {!isValidElement(cost) && (
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
            )}
          </svg>
        </Box>
        {isValidElement(cost) && (
          <Box
            position="absolute"
            style={{
              width: size * 0.2,
              height: size * 0.2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              right: "5.5px",
              top: "5.5px",
            }}
          >
            {cost}
          </Box>
        )}
      </Box>
    );
  },
);
