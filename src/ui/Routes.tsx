import {
  BrowserRouter,
  Routes as RouterRoutes,
  Route,
  Outlet,
} from "react-router-dom";
import App from "./app";
import DeckBuilder from "./DeckBuilder/DeckBuilder";
import Effects from "./Effects";
import { PageWrapper } from "./PageWrapper";
import { Box } from "@mui/material";
import backgroundImage from "../assets/layout/deckbuilder-background.png";

export const Routes = () => (
  <BrowserRouter>
    <RouterRoutes>
      <Route element={<PageWrapper />}>
        <Route path="/" element={<App />} />
        <Route
          element={
            <Box
              sx={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                minHeight: "100vh",
              }}
            >
              <Outlet />
            </Box>
          }
        >
          <Route path="/deck-builder" element={<DeckBuilder />} />
        </Route>
        <Route path="/effects" element={<Effects />} />
      </Route>
    </RouterRoutes>
  </BrowserRouter>
);
