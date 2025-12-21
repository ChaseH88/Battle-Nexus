import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const PlayerBoardContainer = styled(Box)<{ isopponent?: string }>(
  ({ theme, isopponent }) => ({
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "15px",
    padding: "20px",
    marginBottom: "20px",
    border: `2px solid ${
      isopponent === "true"
        ? "rgba(255, 100, 100, 0.5)"
        : "rgba(100, 255, 100, 0.5)"
    }`,
  })
);

export const PlayerInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  background: "rgba(0, 0, 0, 0.3)",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "15px",
  flexWrap: "wrap",
  gap: "10px",
}));

export const PlayerName = styled(Typography)(({ theme }) => ({
  fontSize: "1.5rem",
  color: "#fff",
  fontWeight: "bold",
}));

export const PlayerStat = styled(Box)(({ theme }) => ({
  fontSize: "1.1rem",
  padding: "5px 15px",
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "5px",
  color: "#fff",
  "&.kos": {
    color: "#ffd700",
    fontWeight: "bold",
  },
  "&.hp": {
    color: "#ff6b6b",
    fontWeight: "bold",
  },
}));
