import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const PlayerActiveEffectsContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "15px",
  maxWidth: "250px",
}));

export const EffectBadge = styled(Box)(() => ({
  background:
    "linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.9))",
  borderRadius: "8px",
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.6)",
  },
}));

export const EffectName = styled(Box)(() => ({
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#fff",
  flex: 1,
  textTransform: "capitalize",
  letterSpacing: "0.3px",
}));

export const EffectValue = styled(Box)(() => ({
  fontSize: "0.9rem",
  fontWeight: 700,
  color: "#fbbf24",
  minWidth: "24px",
  textAlign: "right",
}));

export const EffectDuration = styled(Box)(() => ({
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "rgba(255, 255, 255, 0.7)",
  padding: "2px 6px",
  borderRadius: "4px",
  background: "rgba(0, 0, 0, 0.3)",
}));
