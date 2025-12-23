import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const HandZone = styled(Box)(({ theme }) => ({
  background: "rgba(0, 0, 0, 0.3)",
  borderRadius: "15px",
  padding: "20px",
  marginBottom: "20px",
  position: "fixed",
  bottom: "20px",
  left: "50%",
  width: "100vw",
  transform: "translateX(-50%)",
  zIndex: 900,
}));

export const HandTitle = styled(Typography)(({ theme }) => ({
  marginBottom: "15px",
  fontSize: "1.2rem",
  color: "#fff",
  fontWeight: "bold",
}));

export const HandCards = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  gap: "15px",
  overflowX: "auto",
  padding: "10px",
  "&::-webkit-scrollbar": {
    height: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "10px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(255, 255, 255, 0.3)",
    borderRadius: "10px",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.5)",
    },
  },
}));
