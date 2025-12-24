import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import { darken, lighten } from "polished";

export const Container = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

export const BadgeContainer = styled(Box)<{ size: number }>(({ size }) => ({
  position: "relative",
  width: size,
  height: size,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: `'Arial Black','Arial Bold', sans-serif`,
  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
}));

export const OuterGoldRing = styled(Box)(() => ({
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  background: `conic-gradient(
    from 45deg,
    #d4af37,
    #f9f295,
    #e6be8a,
    #b8860b,
    #f9f295,
    #d4af37
  )`,
  padding: "8%", // border thickness
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: `
    inset 0 2px 4px rgba(255,255,255,0.5),
    inset 0 -2px 4px rgba(0,0,0,0.4),
    0 0 15px rgba(212, 175, 55, 0.3)
  `,
  position: "relative",

  "&::after": {
    content: '""',
    position: "absolute",
    top: "2%",
    left: "2%",
    right: "2%",
    bottom: "2%",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    pointerEvents: "none",
  },
}));

export const InnerCircle = styled(Box)<{ baseColor: string }>(
  ({ baseColor }) => {
    const center = lighten(0.08, baseColor);
    const edge = darken(0.35, baseColor);
    const border = darken(0.55, baseColor);

    return {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      background: `radial-gradient(circle at center, ${center} 0%, ${edge} 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      border: `1px solid ${border}`,
      boxShadow: "inset 0 0 15px rgba(0,0,0,0.6)",
    };
  }
);

export const TextureOverlay = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  opacity: 0.2,
  backgroundImage: `url("https://csspicker.dev/api/image/?q=stone+texture&image_type=photo")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  mixBlendMode: "overlay",
  pointerEvents: "none",
}));

export const CostText = styled(Typography)(() => ({
  color: "#fff",
  fontWeight: 900,
  zIndex: 2,
  userSelect: "none",
  lineHeight: 1,
  transform: "translateY(-2%)",
  fontSize: "1.35rem",
  margin: 0,
}));

export const Glow = styled(Box)(() => ({
  position: "absolute",
  top: "-5%",
  left: "-5%",
  width: "40%",
  height: "40%",
  background:
    "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,100,100,0.4) 40%, transparent 70%)",
  borderRadius: "50%",
  zIndex: 3,
  filter: "blur(2px)",
  pointerEvents: "none",
}));
