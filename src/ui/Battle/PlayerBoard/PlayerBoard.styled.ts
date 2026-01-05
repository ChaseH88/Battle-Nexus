import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const PlayerBoardContainer = styled(Box)<{ isopponent?: string }>(
  ({ isopponent }) => ({
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "15px",
    padding: "20px",
    marginBottom: "20px",
    border: `2px solid ${
      isopponent === "true"
        ? "rgba(255, 100, 100, 0.5)"
        : "rgba(100, 255, 100, 0.5)"
    }`,
    position: "relative",
  })
);
