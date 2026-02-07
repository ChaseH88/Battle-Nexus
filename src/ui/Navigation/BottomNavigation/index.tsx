import {
  Paper,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction as MuiBottomNavigationAction,
} from "@mui/material";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useMemo } from "react";

const ROUTES = [
  { label: "Battle", path: "/", icon: <SportsEsportsIcon /> },
  { label: "Deck Builder", path: "/deck-builder", icon: <ViewModuleIcon /> },
  { label: "Effects", path: "/effects", icon: <AutoFixHighIcon /> },
] as const;

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const getIndexFromPath = useCallback(
    (pathname: string) =>
      Math.max(
        0,
        ROUTES.findIndex((r) => r.path === pathname),
      ),
    [],
  );

  const value = useMemo(
    () => getIndexFromPath(pathname),
    [pathname, getIndexFromPath],
  );

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        background: "#000536af",
      }}
      elevation={3}
    >
      <MuiBottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue) => navigate(ROUTES[newValue]?.path ?? "/")}
        sx={{ backgroundColor: "transparent !important", height: 64 }}
      >
        {ROUTES.map(({ label, icon }) => (
          <MuiBottomNavigationAction
            key={label}
            label={label}
            icon={icon}
            sx={{
              color: "#fff !important",
              "&.Mui-selected": { color: "#4fe7ffff !important" },
              svg: { fontSize: "1.8rem" },
            }}
          />
        ))}
      </MuiBottomNavigation>
    </Paper>
  );
};
