import { styled } from "@mui/material/styles";
import { Box, Slider, Typography } from "@mui/material";

export const AIControlsContainer = styled(Box)(({ theme }) => ({
  background: "rgba(0, 0, 0, 0.3)",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  display: "flex",
  alignItems: "center",
  gap: "30px",
  flexWrap: "wrap",
}));

export const SkillSelector = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  flex: 1,
  minWidth: "300px",
}));

export const SkillLabel = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  fontSize: "1rem",
  color: "#fff",
}));

export const StyledSlider = styled(Slider)(({ theme }) => ({
  color: "#4CAF50",
  height: 8,
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    height: 20,
    width: 20,
    backgroundColor: "#4CAF50",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "inherit",
    },
    "&:before": {
      display: "none",
    },
  },
  "& .MuiSlider-rail": {
    opacity: 0.28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
}));

export const SkillLabels = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.85rem",
  color: "rgba(255, 255, 255, 0.7)",
}));
