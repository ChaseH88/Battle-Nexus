import { styled } from "@mui/material/styles";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";

export const StyledDialog = styled(Dialog)(() => ({
  "& .MuiDialog-paper": {
    backgroundColor: "rgba(10, 10, 20, 0.95)",
    backgroundImage:
      "linear-gradient(135deg, rgba(20, 20, 40, 0.9), rgba(10, 10, 25, 0.9))",
    border: "2px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "16px",
    maxWidth: "900px",
    width: "90vw",
    maxHeight: "80vh",
  },
}));

export const StyledDialogTitle = styled(DialogTitle)(() => ({
  color: "#fff",
  fontSize: "1.5rem",
  fontWeight: 700,
  textAlign: "center",
  padding: "20px 24px",
  borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
  textTransform: "uppercase",
  letterSpacing: "1px",
}));

export const StyledDialogContent = styled(DialogContent)(() => ({
  padding: "24px",
  overflowY: "auto",
}));

export const CardsGrid = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: "16px",
  padding: "8px",
}));

export const CardWrapper = styled("div")(() => ({
  cursor: "pointer",
  transition: "transform 0.2s ease",
  filter: "grayscale(100%)",
  "&:hover": {
    transform: "scale(1.05) translateY(-4px)",
  },
}));

export const EmptyState = styled("div")(() => ({
  textAlign: "center",
  padding: "60px 20px",
  color: "rgba(139, 92, 246, 0.5)",
  fontSize: "1.1rem",
  fontWeight: 600,
}));
