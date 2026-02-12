import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const DiscardContainer = styled(Box)<{ $clickable?: boolean }>(
  ({ $clickable }) => ({
    position: "relative",
    width: "120px",
    height: "168px",
    display: "flex",
    margin: "10px 0",
    alignItems: "center",
    justifyContent: "center",
    cursor: $clickable ? "pointer" : "default",
    transition: "transform 0.2s ease",
    "&:hover": $clickable
      ? {
          transform: "scale(1.05)",
        }
      : {},
  }),
);

export const DiscardCard = styled(Box)(() => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.6)",
  transition: "all 0.3s ease",
  background: "rgba(20, 20, 30, 0.8)",
  border: "2px solid rgba(139, 92, 246, 0.3)",

  "& .card-placeholder": {
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))",
    borderRadius: "12px",
  },
}));

export const EmptyDiscard = styled(Box)(() => ({
  margin: "10px 0",
  width: "120px",
  height: "168px",
  border: "3px dashed rgba(139, 92, 246, 0.3)",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.3)",

  "& .empty-text": {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "rgba(139, 92, 246, 0.5)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textAlign: "center",
    lineHeight: 1.3,
  },
}));
