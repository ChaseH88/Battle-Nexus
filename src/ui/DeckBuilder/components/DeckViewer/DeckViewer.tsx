import { UseDeckBuilderReturn } from "@/hooks/useDeckBuilder";
import { Box, Button, Chip, Typography } from "@mui/material";

export interface DeckViewerProps extends Pick<
  UseDeckBuilderReturn,
  "saveDeckToLocalStorage" | "clearDeck" | "removeCardFromDeck"
> {
  deckList: Array<{ card: any; count: number }>;
  totalCards: number;
}

export const DeckViewer = ({
  deckList,
  totalCards,
  saveDeckToLocalStorage,
  clearDeck,
  removeCardFromDeck,
}: DeckViewerProps) => (
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
    <Typography variant="h5" sx={{ mb: 2, color: "#fff", textAlign: "center" }}>
      Current Deck ({totalCards}/40)
    </Typography>

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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {deckList.map(({ card, count }) => {
          if (!card) return null;
          return (
            <Box
              key={card.id}
              sx={{
                background: "rgba(255,255,255,0.1)",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                "&:hover": {
                  background: "rgba(255,255,255,0.15)",
                },
              }}
              onClick={() => removeCardFromDeck(card.id)}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  {card.name}
                </Typography>
                <Typography sx={{ color: "#a0aec0", fontSize: "0.75rem" }}>
                  {card.type} • {card.affinity}
                </Typography>
              </Box>
              <Chip
                label={`x${count}`}
                size="small"
                sx={{
                  background: "#4299e1",
                  color: "#fff",
                  fontWeight: "bold",
                }}
              />
            </Box>
          );
        })}
      </Box>
    )}
  </Box>
);
