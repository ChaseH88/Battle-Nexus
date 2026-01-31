import { UseDeckBuilderReturn } from "@/hooks/useDeckBuilder";
import { Card } from "@/ui/Battle/Card";
import { Box, Button, Chip, Typography } from "@mui/material";
import { isValidElement } from "react";

export interface DeckViewerProps extends Pick<
  UseDeckBuilderReturn,
  "saveDeckToLocalStorage" | "clearDeck" | "removeCardFromDeck"
> {
  deckList: Array<{ card: any; count: number }>;
  totalCards: number;
  HeaderComponent?: React.ReactNode;
  isFullScreen?: boolean;
}

export const DeckViewer = ({
  deckList,
  totalCards,
  saveDeckToLocalStorage,
  clearDeck,
  removeCardFromDeck,
  HeaderComponent,
  isFullScreen = false,
}: DeckViewerProps) => {
  const fullScreenStyles = {
    ...(!isFullScreen && {
      flex: "0 0 81px",
      height: "113px",
      cursor: "pointer",
      overflow: "hidden",
      ".card-slot": {
        transform: "scale(0.4)",
        transformOrigin: "top left",
      },
    }),
  };

  return (
    <Box
      sx={{
        background: "rgba(0,0,0,0.4)",
        border: "2px solid #4a5568",
        borderRadius: "10px",
        padding: "20px",
        position: "sticky",
        top: "20px",
      }}
    >
      <Box display="flex" justifyContent="center" alignItems="center">
        <Typography
          variant="h5"
          sx={{ mb: 2, color: "#fff", textAlign: "center" }}
        >
          Current Deck ({totalCards}/20)
        </Typography>
        {isValidElement(HeaderComponent) && <Box ml={2}>{HeaderComponent}</Box>}
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={saveDeckToLocalStorage}
          disabled={totalCards === 0}
          sx={{
            background: "linear-gradient(145deg, #48bb78, #38a169)",
            "&:hover": {
              background: "linear-gradient(145deg, #38a169, #2f855a)",
            },
            "&:disabled": {
              background: "rgba(255,255,255,0.2)",
            },
          }}
        >
          Save Deck
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={clearDeck}
          disabled={totalCards === 0}
          sx={{
            background: "linear-gradient(145deg, #ef4444, #dc2626)",
            "&:hover": {
              background: "linear-gradient(145deg, #dc2626, #b91c1c)",
            },
            "&:disabled": {
              background: "rgba(255,255,255,0.2)",
            },
          }}
        >
          Clear
        </Button>
      </Box>

      {deckList.length === 0 ? (
        <Typography
          sx={{
            color: "#a0aec0",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Click cards to add them to your deck
        </Typography>
      ) : (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {deckList.map(({ card, count }) => {
            if (!card) return null;
            return (
              <Box key={card.id} position="relative" sx={fullScreenStyles}>
                <Card
                  card={card}
                  readonly
                  onClick={() => {
                    removeCardFromDeck(card.id);
                  }}
                />
                <Chip
                  label={`x${count}`}
                  size="small"
                  sx={{
                    background: "#4299e1",
                    color: "#fff",
                    fontWeight: "bold",
                    position: "absolute",
                    top: 5,
                    right: 5,
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
