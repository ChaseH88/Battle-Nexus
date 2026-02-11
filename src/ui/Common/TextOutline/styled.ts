import { styled } from "@mui/material/styles";
import { Typography } from "@mui/material";

export interface TextOutlineProps {
  fontSize?: string;
  fontWeight?: number;
  color?: string;
}

export const TextOutlineStyled = styled(Typography)<TextOutlineProps>(
  ({ fontSize, fontWeight, color }) => ({
    fontSize: fontSize || "3.5rem",
    fontWeight: fontWeight || 900,
    color: color || "#fff",
    "-webkit-text-stroke": "1px black",
    "text-stroke": "1px black",
    pointerEvents: "none",
    background: "linear-gradient(135deg, #fff 0%, #fff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))",
    userSelect: "none",
  }),
);
