import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import { opacify } from "polished";

export const PlayerBoardContainer = styled(Box)<{ isTurn?: boolean }>(
  ({ isTurn }) => ({
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "15px",
    padding: "20px",
    marginBottom: "20px",
    border: `2px solid ${isTurn ? "#5efffcff" : opacify(-0.35, "#5efffcff")}`,
    boxShadow: `inset 0 0 ${isTurn ? 5 : 0}px #5efffcff`,
    transition: "box-shadow 0.25s ease, border 0.25s ease",
    position: "relative",
  }),
);
