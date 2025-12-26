import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { store } from "../store/store";
import { theme } from "./theme";
import App from "./app";
import DeckBuilder from "./DeckBuilder/DeckBuilder";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <nav
            style={{
              padding: "20px",
              background: "rgba(0,0,0,0.3)",
              marginBottom: "20px",
            }}
          >
            <Link
              to="/"
              style={{
                color: "#fff",
                marginRight: "20px",
                textDecoration: "none",
                fontSize: "1.1rem",
              }}
            >
              Battle
            </Link>
            <Link
              to="/deck-builder"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontSize: "1.1rem",
              }}
            >
              Deck Builder
            </Link>
          </nav>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/deck-builder" element={<DeckBuilder />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
