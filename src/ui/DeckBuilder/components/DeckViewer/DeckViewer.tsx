import { UseDeckBuilderReturn } from "@/hooks/useDeckBuilder";
import { Card } from "@/ui/Battle/Card";
import { Box, Chip, Typography, IconButton } from "@mui/material";
import { isValidElement } from "react";
import { GameButton } from "@/ui/Common/Button";
import CloseIcon from "@mui/icons-material/Close";

export interface DeckViewerProps extends Pick<
  UseDeckBuilderReturn,
  "saveDeckToLocalStorage" | "clearDeck" | "removeCardFromDeck"
> {
  deckList: Array<{ card: any; count: number }>;
  totalCards: number;
  totalCost?: number;
  typeComposition?: Record<string, number>;
  HeaderComponent?: React.ReactNode;
  isFullScreen?: boolean;
}

export const DeckViewer = ({
  deckList,
  totalCards,
  totalCost,
  typeComposition,
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
        <GameButton
          variant="success"
          fullWidth
          onClick={saveDeckToLocalStorage}
          disabled={totalCards === 0}
        >
          Save Deck
        </GameButton>
        <GameButton
          variant="danger"
          fullWidth
          onClick={clearDeck}
          disabled={totalCards === 0}
        >
          Clear Deck
        </GameButton>
      </Box>

      {/* Deck Statistics */}
      {totalCards > 0 && (
        <Box sx={{ mb: 2, color: "#a0aec0", fontSize: "0.875rem" }}>
          {totalCost !== undefined && (
            <Typography variant="body2" sx={{ color: "#a0aec0" }}>
              Total Cost: {totalCost}
            </Typography>
          )}
          {typeComposition && Object.keys(typeComposition).length > 0 && (
            <Box sx={{ mt: 1 }}>
              {Object.entries(typeComposition).map(([type, count]) => (
                <Typography
                  key={type}
                  variant="body2"
                  sx={{ color: "#a0aec0" }}
                >
                  {type}: {count}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}

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
                <Card card={card} readonly />
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
                <IconButton
                  aria-label="Remove card from deck"
                  size="small"
                  onClick={() => removeCardFromDeck(card.id)}
                  sx={{
                    position: "absolute",
                    bottom: 5,
                    right: 5,
                    background: "rgba(239, 68, 68, 0.9)",
                    color: "#fff",
                    "&:hover": {
                      background: "rgba(220, 38, 38, 1)",
                    },
                    width: 24,
                    height: 24,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
