import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { store } from "../store/store";
import { theme } from "./theme";
import { Routes } from "./Routes";
import { WelcomeScreen } from "./WelcomeScreen";
import { useAssetPreloader } from "../hooks/useAssetPreloader";

const App = () => {
  const { isLoading, progress, error } = useAssetPreloader();
  const [showWelcome, setShowWelcome] = useState(true);

  const handleStart = useCallback(() => {
    setShowWelcome(false);
  }, []);

  return showWelcome && (isLoading || progress === 100) ? (
    <WelcomeScreen progress={progress} error={error} onStart={handleStart} />
  ) : (
    <Routes />
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
