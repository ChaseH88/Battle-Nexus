import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import App from "./app";
import DeckBuilder from "./DeckBuilder/DeckBuilder";
import Effects from "./Effects";
import { PageWrapper } from "./PageWrapper";

export const Routes = () => (
  <BrowserRouter>
    <RouterRoutes>
      <Route element={<PageWrapper />}>
        <Route path="/" element={<App />} />
        <Route path="/deck-builder" element={<DeckBuilder />} />
        <Route path="/effects" element={<Effects />} />
      </Route>
    </RouterRoutes>
  </BrowserRouter>
);
