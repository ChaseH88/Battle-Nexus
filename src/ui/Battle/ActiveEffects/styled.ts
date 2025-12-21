import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const ActiveEffectsPanel = styled(Box)(({ theme }) => ({
  background:
    "linear-gradient(135deg, rgba(138, 43, 226, 0.3) 0%, rgba(75, 0, 130, 0.3) 100%)",
  border: "2px solid rgba(138, 43, 226, 0.6)",
  borderRadius: "12px",
  padding: "15px",
  marginBottom: "15px",
  boxShadow: "0 4px 15px rgba(138, 43, 226, 0.4)",
}));

export const EffectsTitle = styled(Typography)(({ theme }) => ({
  marginBottom: "12px",
  fontSize: "1.1rem",
  color: "#e0c3fc",
  textShadow: "0 0 10px rgba(138, 43, 226, 0.8)",
  fontWeight: "bold",
}));

export const EffectsList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
}));

export const EffectItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  background: "rgba(0, 0, 0, 0.4)",
  borderLeft: "4px solid #9d4edd",
  borderRadius: "6px",
  fontSize: "0.85rem",
  animation: "effectPulse 2s ease-in-out infinite",
  flexWrap: "wrap",
  "@keyframes effectPulse": {
    "0%, 100%": {
      borderLeftColor: "#9d4edd",
      background: "rgba(0, 0, 0, 0.4)",
    },
    "50%": {
      borderLeftColor: "#c77dff",
      background: "rgba(138, 43, 226, 0.15)",
    },
  },
}));

export const EffectName = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  color: "#e0c3fc",
  fontSize: "0.85rem",
}));

export const EffectSource = styled(Typography)(({ theme }) => ({
  color: "#b19cd9",
  fontStyle: "italic",
  fontSize: "0.8rem",
}));

export const EffectDuration = styled(Typography)(({ theme }) => ({
  color: "#ffd700",
  fontWeight: "bold",
  fontSize: "0.75rem",
  padding: "2px 6px",
  background: "rgba(255, 215, 0, 0.2)",
  borderRadius: "4px",
  marginLeft: "auto",
}));

export const EffectOwner = styled(Typography)<{ playerindex: number }>(
  ({ theme, playerindex }) => ({
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "4px",
    fontWeight: "bold",
    ...(playerindex === 0 && {
      background: "rgba(0, 150, 255, 0.3)",
      color: "#87ceeb",
    }),
    ...(playerindex === 1 && {
      background: "rgba(255, 50, 50, 0.3)",
      color: "#ff9999",
    }),
  })
);

export const EffectStats = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "6px",
  alignItems: "center",
}));

export const StatMod = styled(Typography)<{ stattype: "atk" | "def" }>(
  ({ theme, stattype }) => ({
    fontSize: "0.8rem",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
    ...(stattype === "atk" && {
      background: "rgba(252, 129, 129, 0.3)",
      color: "#fc8181",
    }),
    ...(stattype === "def" && {
      background: "rgba(99, 179, 237, 0.3)",
      color: "#63b3ed",
    }),
  })
);

export const AffectedCount = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: "#cbd5e0",
  fontStyle: "italic",
}));
