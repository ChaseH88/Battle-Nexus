import { Outlet } from "react-router-dom";
import { CardDetailModal } from "./Battle/Modal/CardDetailModal";
import { BottomNavigation } from "./Navigation/BottomNavigation";
import { Box } from "@mui/material";

export const PageWrapper = () => (
  <Box id="page-wrapper">
    <Outlet />
    <CardDetailModal />
    <BottomNavigation />
  </Box>
);
