import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import { Home } from "./Home";
import DeckBuilder from "./DeckBuilder";
import Effects from "./Effects";
import { PageWrapper } from "./PageWrapper";

import { Battle } from "./Battle";

export const Routes = () => (
  <BrowserRouter>
    <RouterRoutes>
      <Route element={<PageWrapper />}>
        <Route index path="/" element={<Home />} />
        <Route path="/deck-builder" element={<DeckBuilder />} />
        <Route path="/effects" element={<Effects />} />
      </Route>
      <Route element={<PageWrapper showBottomNav={false} />}>
        <Route path="/battle" element={<Battle />} />
      </Route>
    </RouterRoutes>
  </BrowserRouter>
);
