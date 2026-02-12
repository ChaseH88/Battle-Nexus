import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import {
  ModalOverlayStyled,
  ModalContentStyled,
  ModalTitleStyled,
  ModalMessageStyled,
} from "../Modal/styled";

export const PlayCreatureModalContentStyled = styled(ModalContentStyled)(
  () => ({
    background: "#010015eb",
    maxWidth: "800px",
    minHeight: "500px",
  }),
);

export const PlayOptionsStyled = styled(Box)(() => ({
  display: "flex",
  gap: "30px",
  marginBottom: "25px",
  justifyContent: "center",
  alignItems: "stretch",
}));

export const PlayOptionGroupStyled = styled(Box)(() => ({
  flex: 1,
  borderRadius: "12px",
  boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
  transition: "all 0.3s ease",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    transform: "translateY(-5px) scale(1.02)",
  },
}));

export { ModalOverlayStyled, ModalTitleStyled, ModalMessageStyled };
