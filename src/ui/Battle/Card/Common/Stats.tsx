import { useCallback, useId, useMemo } from "react";
import { darken, lighten, mix } from "polished";
import { Affinity } from "@cards";
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
  bgTop: lighten(0.02, "#0F171D"),
  bgMid: "#0B1116",
  bgBot: darken(0.01, "#070B0F"),

  rimDark: "#05080B",
  rimInner: "#1C2B35",

  glow: mix(0.55, base, "#19D3FF"),
  glowBright: mix(0.35, base, "#7AF1FF"),
  glowDim: mix(0.75, base, "#0AA7C6"),

  slotTop: lighten(0.02, "#0F1B22"),
  slotBot: "#071015",

  text: "#D8F7FF",
});

type StatBarProps = {
  width?: number; // px
  height?: number; // px
  affinity?: Affinity;
  atk?: number;
  baseAtk?: number;
  def?: number;
  baseDef?: number;
  hp?: number; // maxHp
  currentHp?: number; // if provided, displays "currentHp/maxHp"
  isAtkModified?: boolean;
  isDefModified?: boolean;
  className?: string;
  sx?: SxProps;
};

export const Stats = ({
  width = 500,
  height = 86,
  affinity = Affinity.Fire,
  atk = 20,
  // baseAtk,
  def: d = 10,
  // baseDef,
  hp = 60,
  currentHp,
  isAtkModified = false,
  isDefModified = false,
  className,
  sx,
}: StatBarProps) => {
  const id = useId();

  // This aspect ratio matches your reference much closer than the previous 520x70.
  const vbW = 620;
  const vbH = 86;

  const colors = useMemo(() => {
    const base = AFFINITY_BASE[affinity] ?? AFFINITY_BASE.WATER;
    return derive(base);
  }, [affinity]);

  // Geometry
  const chamfer = 18;
  const inset = 10;

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
    const c = Math.max(12, chamfer - 6);
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
  }, []);

  // Slots: 3 containers (ATK / DEF / HP)
  const slots = useMemo(() => {
    const pad = inset + 16;
    const slotH = 45;
    const y = vbH - inset - slotH - 10; // sit near bottom like the card
    const gap = 12;

    const totalW = vbW - pad * 2;
    const slotW = (totalW - gap * 2) / 3;

    const mk = (i: number) => {
      const x = pad + i * (slotW + gap);
      const c = 10; // chamfer-ish
      return {
        x,
        y,
        w: slotW,
        h: slotH,
        path: [
          `M ${x + c} ${y}`,
          `L ${x + slotW - c} ${y}`,
          `L ${x + slotW} ${y + c}`,
          `L ${x + slotW} ${y + slotH - c}`,
          `L ${x + slotW - c} ${y + slotH}`,
          `L ${x + c} ${y + slotH}`,
          `L ${x} ${y + slotH - c}`,
          `L ${x} ${y + c}`,
          "Z",
        ].join(" "),
      };
    };

    return [mk(0), mk(1), mk(2)];
  }, []);

  // Small top dots like the reference
  const dots = useMemo(
    () => [
      { x: vbW / 2 - 96.5, y: inset * 4.875 },
      { x: vbW / 2 + 96.5, y: inset * 4.875 },
    ],
    [],
  );

  const getHpColor = useCallback((hp: number) => {
    switch (true) {
      case hp >= 50:
        return "#00ff51ff"; // green
      case hp >= 30:
        return "#fff200ff"; // yellow
      case hp >= 0:
        return "#ff3c00ff"; // red
      default:
        return "#888888ff"; // gray (dead)
    }
  }, []);

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
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.bgTop} />
            <stop offset="0.55" stopColor={colors.bgMid} />
            <stop offset="1" stopColor={colors.bgBot} />
          </linearGradient>

          <linearGradient id={`${id}-glowStroke`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={colors.glowDim} />
            <stop offset="0.5" stopColor={colors.glowBright} />
            <stop offset="1" stopColor={colors.glowDim} />
          </linearGradient>

          <linearGradient id={`${id}-slot`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.slotTop} />
            <stop offset="1" stopColor={colors.slotBot} />
          </linearGradient>

          <filter
            id={`${id}-glow`}
            x="-30%"
            y="-80%"
            width="160%"
            height="260%"
          >
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id={`${id}-dotGlow`}
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
          >
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer shell */}
        <path d={outer} fill={colors.rimDark} />

        {/* Inner body */}
        <path d={inner} fill={`url(#${id}-bg)`} />

        {/* Inner lip */}
        <path
          d={inner}
          fill="none"
          stroke={colors.rimInner}
          strokeWidth="2"
          opacity="0.9"
        />

        {/* Cyan outline */}
        <path
          d={inner}
          fill="none"
          stroke={`url(#${id}-glowStroke)`}
          strokeWidth="2.4"
          opacity="0.95"
          filter={`url(#${id}-glow)`}
        />

        {/* Top dots */}
        {dots.map((p, i) => (
          <g key={i} filter={`url(#${id}-dotGlow)`}>
            <circle
              cx={p.x}
              cy={p.y}
              r="3.2"
              fill={colors.glowBright}
              opacity="0.95"
            />
            <circle cx={p.x} cy={p.y} r="7" fill={colors.glow} opacity="0.18" />
          </g>
        ))}

        {/* Bottom subtle cyan line (matches the “bar” feel) */}
        <path
          d={`M ${inset + 40} ${vbH - inset - 44} L ${vbW - inset - 40} ${
            vbH - inset - 44
          }`}
          stroke={colors.glowBright}
          strokeWidth="2"
          opacity="0.55"
          filter={`url(#${id}-glow)`}
        />

        {/* STAT SLOTS (containers) */}
        {slots.map((s, i) => (
          <g key={i}>
            <path d={s.path} fill={`url(#${id}-slot)`} opacity="0.98" />
            <path
              d={s.path}
              fill="none"
              stroke={colors.rimInner}
              strokeWidth="1.5"
              opacity="0.95"
            />
            <path
              d={s.path}
              fill="none"
              stroke={`url(#${id}-glowStroke)`}
              strokeWidth="1.6"
              opacity="0.8"
              filter={`url(#${id}-glow)`}
            />
          </g>
        ))}

        {/* Dividers between slots (crisper separation like the card) */}
        <g opacity="0.55">
          <path
            d={`M ${slots[0].x + slots[0].w + 6} ${slots[0].y + 6} L ${
              slots[0].x + slots[0].w + 6
            } ${slots[0].y + slots[0].h - 6}`}
            stroke={colors.glowDim}
            strokeWidth="2"
          />
          <path
            d={`M ${slots[1].x + slots[1].w + 6} ${slots[1].y + 6} L ${
              slots[1].x + slots[1].w + 6
            } ${slots[1].y + slots[1].h - 6}`}
            stroke={colors.glowDim}
            strokeWidth="2"
          />
        </g>

        {/* Text (numbers + labels) */}
        {[
          {
            label: "HP",
            value: currentHp !== undefined ? currentHp : hp,
            slot: slots[0],
            isModified: currentHp !== undefined && currentHp !== hp,
          },
          {
            label: "ATK",
            value: atk,
            slot: slots[1],
            isModified: isAtkModified,
          },
          {
            label: "DEF",
            value: d,
            slot: slots[2],
            isModified: isDefModified,
          },
        ].map((t, idx) => {
          const cx = t.slot.x + t.slot.w / 1.65;
          const cy = t.slot.y + t.slot.h / 1.5;
          const diamondCy = cy / 1.18;

          return (
            <g key={idx}>
              <text
                x={cx - 18}
                y={cy + 4}
                textAnchor="end"
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
                fontWeight="800"
                fontSize={
                  idx === 0 && typeof t.value === "string" ? "28" : "40"
                }
                fill={
                  t.isModified
                    ? t.label === "HP"
                      ? getHpColor(t.value as number)
                      : "#00ff51ff"
                    : colors.text
                }
              >
                {t.value}
              </text>
              <text
                x={cx - 8}
                y={cy + 4}
                textAnchor="start"
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
                fontWeight="800"
                fontSize="20"
                fill={colors.glowBright}
                opacity="0.95"
              >
                {t.label}
              </text>

              {/* tiny diamond marker like the UI */}
              <path
                d={`M ${
                  cx + (idx === 0 ? 32 : 43)
                } ${diamondCy} l 6 6 l -6 6 l -6 -6 Z`}
                fill={colors.glow}
                opacity="0.7"
                filter={`url(#${id}-glow)`}
              />
            </g>
          );
        })}
      </svg>
    </Box>
  );
};
