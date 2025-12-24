import { createTheme } from "@mui/material/styles";

const textOutline =
  "rgb(0, 0, 0) 1px 0px 0px, rgb(0, 0, 0) 0.540302px 0.841471px 0px, rgb(0, 0, 0) -0.416147px 0.909297px 0px, rgb(0, 0, 0) -0.989992px 0.14112px 0px, rgb(0, 0, 0) -0.653644px -0.756802px 0px, rgb(0, 0, 0) 0.283662px -0.958924px 0px, rgb(0, 0, 0) 0.96017px -0.279415px 0px;";

/**
 * Battle Nexus Theme
 *
 * Typography:
 * - Font: Ubuntu (Google Fonts)
 * - Body: 300 weight
 * - Headers: 700 weight
 */
export const theme = createTheme({
  typography: {
    fontFamily: '"Ubuntu", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 300,
    fontWeightMedium: 700,
    fontWeightBold: 700,

    // Body text
    body1: {
      fontWeight: 300,
    },
    body2: {
      fontWeight: 300,
    },

    // Headers
    h1: {
      fontWeight: 700,
      color: "#ffffff",
      textShadow: textOutline,
    },
    h2: {
      fontWeight: 700,
      color: "#ffffff",
      textShadow: textOutline,
    },
    h3: {
      fontWeight: 700,
      color: "#ffffff",
      textShadow: textOutline,
    },
    h4: {
      fontWeight: 700,
      color: "#ffffff",
      textShadow: textOutline,
    },
    h5: {
      fontWeight: 700,
      color: "#ffffff",
      textShadow: textOutline,
    },
    h6: {
      fontWeight: 700,
      color: "#ffffff",
      textShadow: textOutline,
    },

    // Button text
    button: {
      fontWeight: 700,
    },
  },

  // Optional: Add custom palette colors here if needed
  palette: {
    mode: "light",
  },
});
