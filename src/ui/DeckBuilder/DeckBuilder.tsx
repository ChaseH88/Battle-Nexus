import {
  Box,
  Typography,
  Grid,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import cardData from "../../static/card-data/bn-core.json";
import { CardType, Affinity, CardInterface, Rarity } from "../../cards/types";
import { CreatureCard } from "../../cards/CreatureCard";
import { MagicCard } from "../../cards/MagicCard";
import { TrapCard } from "../../cards/TrapCard";
import { Card } from "../Battle/Card/Card";
import { useDeckBuilder } from "@/hooks/useDeckBuilder";
import { DeckViewer } from "./components/DeckViewer";
import { useCardFilters } from "@/hooks/useCardFilters";
import { CardFilters } from "./components/CardFilters";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import { closeCardDetailModal } from "@/store/uiSlice";

function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Magic:
      return new MagicCard(raw);
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
  rarity: Rarity;
  set: string;
  effectId?: string;
}

const DeckBuilder = () => {
  const dispatch = useAppDispatch();
  const [isDeckFullScreen, setIsDeckFullScreen] = useState(false);
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
    setSnackbarMessage,
    setSnackbarSeverity,
  } = useDeckBuilder();
  const availableCards = useMemo(() => cardData as CardData[], []);

  const totalCards = useMemo(
    () =>
      Array.from(selectedCards.values()).reduce((sum, count) => sum + count, 0),
    [selectedCards],
  );
  const deckList = useMemo(
    () =>
      Array.from(selectedCards.entries()).map(([cardId, count]) => {
        const card = availableCards.find((c) => c.id === cardId);
        return { card, count };
      }),
    [selectedCards, availableCards],
  );

  const toggleDeckFullScreen = useCallback(() => {
    setIsDeckFullScreen((prev) => !prev);
  }, []);

  // Close card detail modal when component unmounts (e.g., navigating away)
  useEffect(() => {
    return () => {
      dispatch(closeCardDetailModal());
    };
  }, [dispatch]);

  const handleMaxDeckSizeLimit = useCallback(() => {
    setSnackbarMessage("Deck is full! Maximum 20 cards allowed.");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }, [setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen]);

  const handleMaxCardCopies = useCallback(
    (copies: number = 3) => {
      setSnackbarMessage(
        `Cannot add more than ${copies} ${copies === 1 ? "copy" : "copies"} of the same card.`,
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    },
    [setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen],
  );

  const handleAddToDeck = useCallback(
    (cardId: string) => {
      const currentCount = selectedCards.get(cardId) || 0;
      if (totalCards >= 20) {
        handleMaxDeckSizeLimit();
        return;
      }
      if (currentCount >= 3) {
        handleMaxCardCopies(3);
        return;
      }
      addCardToDeck(cardId);
    },
    [
      selectedCards,
      totalCards,
      handleMaxDeckSizeLimit,
      handleMaxCardCopies,
      addCardToDeck,
    ],
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
        <Box
          className="left-container"
          flex="0 0 73%"
          display={isDeckFullScreen ? "none" : "block"}
        >
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
            {filteredCards
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((card) => {
                const countInDeck = selectedCards.get(card.id) || 0;
                const cardInstance = cardFactory(card);

                return (
                  <Grid key={card.id}>
                    <Box
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
                      <Card
                        card={cardInstance}
                        disableHover={false}
                        readonly
                        onClick={() => {
                          handleAddToDeck(card.id);
                        }}
                      />
                    </Box>
                  </Grid>
                );
              })}
          </Box>
        </Box>

        {/* Right Panel - Current Deck */}
        <Box className="right-container" flex="1 1 27%" position="relative">
          <DeckViewer
            deckList={deckList}
            totalCards={totalCards}
            saveDeckToLocalStorage={saveDeckToLocalStorage}
            clearDeck={clearDeck}
            removeCardFromDeck={removeCardFromDeck}
            isFullScreen={isDeckFullScreen}
            HeaderComponent={
              <IconButton
                size="small"
                onClick={toggleDeckFullScreen}
                sx={{
                  backgroundColor: "rgba(26,32,44,0.8)",
                  width: 25,
                  height: 25,
                  lineHeight: 0,
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "rgba(26,32,44,1)",
                  },
                  position: "relative",
                  top: "-20px",
                  left: 50,
                }}
              >
                {isDeckFullScreen ? "X" : "+"}
              </IconButton>
            }
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
