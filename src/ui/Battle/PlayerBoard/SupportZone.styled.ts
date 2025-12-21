import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";

export const SupportZoneContainer = styled(Box)(({ theme }) => ({
  marginBottom: "15px",
}));

export const SupportZoneTitle = styled(Typography)(({ theme }) => ({
  marginBottom: "10px",
  fontSize: "1.2rem",
  textTransform: "uppercase",
  letterSpacing: "1px",
  color: "#fff",
  fontWeight: "bold",
}));

export const SupportSlots = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "15px",
  justifyContent: "center",
  flexWrap: "wrap",
}));

export const SupportSlot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
}));

export const SupportActions = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "5px",
}));

export const FaceDownButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(145deg, #718096, #4a5568)",
  color: "white",
  padding: "8px 15px",
  fontSize: "0.9rem",
  borderRadius: "8px",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "1px",
  transition: "all 0.3s ease",
  width: "100%",
  "&:hover": {
    background: "linear-gradient(145deg, #4a5568, #2d3748)",
    transform: "translateY(-2px)",
    boxShadow: "0 5px 15px rgba(74, 85, 104, 0.4)",
  },
}));

export const ActivateButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(145deg, #48bb78, #38a169)",
  color: "white",
  padding: "8px 15px",
  fontSize: "0.9rem",
  borderRadius: "8px",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "1px",
  transition: "all 0.3s ease",
  width: "100%",
  "&:hover": {
    background: "linear-gradient(145deg, #38a169, #2f855a)",
    transform: "translateY(-2px)",
    boxShadow: "0 5px 15px rgba(72, 187, 120, 0.4)",
  },
}));
