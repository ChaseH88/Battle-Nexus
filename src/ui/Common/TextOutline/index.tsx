import { Box, TypographyProps } from "@mui/material";
import { TextOutlineProps, TextOutlineStyled } from "./styled";

interface Props
  extends
    Omit<TypographyProps, "color" | "fontSize" | "fontWeight">,
    TextOutlineProps {
  text: string;
}

export const TextOutline = ({ text, ...props }: Props) => (
  <Box
    component="header"
    sx={{
      position: "relative",
      zIndex: 10,
    }}
  >
    <TextOutlineStyled {...props}>{text}</TextOutlineStyled>
  </Box>
);
