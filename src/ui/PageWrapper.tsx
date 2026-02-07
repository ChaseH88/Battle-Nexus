import { Outlet } from "react-router-dom";
import { CardDetailModal } from "./Battle/Modal/CardDetailModal";
import { BottomNavigation } from "./Navigation/BottomNavigation";
import { Box } from "@mui/material";

interface PageWrapperProps {
  showBottomNav?: boolean;
}

export const PageWrapper = ({ showBottomNav = true }: PageWrapperProps) => (
  <Box id="page-wrapper">
    <Outlet />
    <CardDetailModal />
    {showBottomNav && <BottomNavigation />}
  </Box>
);
