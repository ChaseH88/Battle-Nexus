import {
  Box,
  Typography,
  Grid,
  Snackbar,
  Alert,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import cardData from "../../static/card-data/bn-core.json";
import { CardType, Affinity, Rarity } from "../../cards/types";
import { Card } from "../Battle/Card/Card";
import { useDeckBuilder } from "@/hooks/useDeckBuilder";
import { DeckViewer } from "./components/DeckViewer";
import { useCardFilters } from "@/hooks/useCardFilters";
import { CardFilters } from "./components/CardFilters";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import { closeCardDetailModal } from "@/store/uiSlice";
import { cardFactory } from "@/utils/cardFactory";
import backgroundImage from "../../assets/layout/deckbuilder-background.png";

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
  set: "Base";
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
      Array.from(selectedCards.entries()).reduce((sum, [cardId, count]) => {
        // Only count cards that exist in availableCards
        const cardExists = availableCards.some((c) => c.id === cardId);
        return sum + (cardExists ? count : 0);
      }, 0),
    [selectedCards, availableCards],
  );
  const deckList = useMemo(
    () =>
      Array.from(selectedCards.entries()).map(([cardId, count]) => {
        const card = availableCards.find((c) => c.id === cardId);
        return { card, count };
      }),
    [selectedCards, availableCards],
  );

  const totalCost = useMemo(() => {
    return deckList.reduce((sum, { card, count }) => {
      return sum + (card?.cost || 0) * count;
    }, 0);
  }, [deckList]);

  const typeComposition = useMemo(() => {
    const composition: Record<string, number> = {};
    deckList.forEach(({ card, count }) => {
      if (card) {
        composition[card.type] = (composition[card.type] || 0) + count;
      }
    });
    return composition;
  }, [deckList]);

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

  const mediaQuery = useMediaQuery("(max-width:1300px)");

  return (
    <Box
      sx={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "20px 0 64px",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h3"
        sx={{ mb: 3, textAlign: "center", color: "#fff" }}
      >
        Deck Builder
      </Typography>

      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          flexWrap: !mediaQuery ? "nowrap" : "wrap",
        }}
      >
        {/* Left Panel - Card Collection */}
        <Box
          className="left-container"
          flex={!mediaQuery ? "0 0 73%" : "1 1 100%"}
          display={isDeckFullScreen ? "none" : "block"}
          px={2}
          {...(mediaQuery && { order: 2, mt: 5 })}
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
                  <Grid key={card.id} flex="1 1 auto">
                    <Box
                      data-testid={`deck-card-${card.id}`}
                      display={"inline-block"}
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        position: "relative",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          filter: "brightness(1.2)",
                        },
                      }}
                      onClick={() => {
                        handleAddToDeck(card.id);
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
        <Box
          className="right-container"
          position="relative"
          flex={!mediaQuery ? "0 0 27%" : "1 1 100%"}
          {...(mediaQuery && { order: 1 })}
        >
          <DeckViewer
            deckList={deckList}
            totalCards={totalCards}
            totalCost={totalCost}
            typeComposition={typeComposition}
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
