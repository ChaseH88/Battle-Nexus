import { Box, Typography, Grid, Snackbar, Alert } from "@mui/material";
import cardData from "../../static/card-data/bn-core.json";
import { CardType, Affinity, CardInterface } from "../../cards/types";
import { CreatureCard } from "../../cards/CreatureCard";
import { SupportCard } from "../../cards/SupportCard";
import { ActionCard } from "../../cards/ActionCard";
import { TrapCard } from "../../cards/TrapCard";
import { Card } from "../Battle/Card/Card";
import { useDeckBuilder } from "@/hooks/useDeckBuilder";
import { DeckViewer } from "./components/DeckViewer";
import { useCardFilters } from "@/hooks/useCardFilters";
import { CardFilters } from "./components/CardFilters";

function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Support:
      return new SupportCard(raw);
    case CardType.Trap:
      return new TrapCard(raw);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

export interface CardData {
  id: string;
  type: CardType;
  name: string;
  description: string;
  cost: number;
  atk?: number;
  def?: number;
  hp?: number;
  affinity: Affinity;
  rarity: string;
  set: string;
  effectId?: string;
}

const DeckBuilder = () => {
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterAffinity,
    setFilterAffinity,
    filterCost,
    setFilterCost,
    filteredCards,
    handleClearFilters,
    hasFilterApplied,
  } = useCardFilters({ availableCards: cardData as CardData[] });
  const {
    selectedCards,
    addCardToDeck,
    removeCardFromDeck,
    saveDeckToLocalStorage,
    clearDeck,
    snackbarMessage,
    snackbarSeverity,
    snackbarOpen,
    setSnackbarOpen,
  } = useDeckBuilder();
  const availableCards = cardData as CardData[];

  const totalCards = Array.from(selectedCards.values()).reduce(
    (sum, count) => sum + count,
    0,
  );
  const deckList = Array.from(selectedCards.entries()).map(
    ([cardId, count]) => {
      const card = availableCards.find((c) => c.id === cardId);
      return { card, count };
    },
  );

  return (
    <Box sx={{ maxWidth: "1600px", margin: "0 auto", padding: "20px" }}>
      <Typography
        variant="h3"
        sx={{ mb: 3, textAlign: "center", color: "#fff" }}
      >
        Deck Builder
      </Typography>

      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "nowrap" }}>
        {/* Left Panel - Card Collection */}
        <Box className="left-container" flex="0 0 73%">
          <CardFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            filterAffinity={filterAffinity}
            setFilterAffinity={setFilterAffinity}
            filterCost={filterCost}
            setFilterCost={setFilterCost}
            handleClearFilters={handleClearFilters}
            hasFilterApplied={hasFilterApplied}
          />
          <Box display="flex" flexWrap="wrap" gap={5}>
            {filteredCards.map((card) => {
              const countInDeck = selectedCards.get(card.id) || 0;
              const cardInstance = cardFactory(card);

              return (
                <Grid key={card.id}>
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      addCardToDeck(card.id);
                    }}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      position: "relative",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        filter: "brightness(1.2)",
                      },
                    }}
                  >
                    {/* Count badge */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        zIndex: 10,
                        background:
                          countInDeck === 3
                            ? "#48bb78"
                            : countInDeck > 0
                              ? "#4299e1"
                              : "rgba(255,255,255,0.2)",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #1a202c",
                        fontWeight: "bold",
                        color: "#fff",
                        fontSize: "0.875rem",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCardFromDeck(card.id);
                      }}
                    >
                      {countInDeck}/3
                    </Box>
                    <Card card={cardInstance} disableHover={false} readonly />
                  </Box>
                </Grid>
              );
            })}
          </Box>
        </Box>

        {/* Right Panel - Current Deck */}
        <Box className="right-container" flex="0 0 27%">
          <DeckViewer
            deckList={deckList}
            totalCards={totalCards}
            saveDeckToLocalStorage={saveDeckToLocalStorage}
            clearDeck={clearDeck}
            removeCardFromDeck={removeCardFromDeck}
          />
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeckBuilder;
