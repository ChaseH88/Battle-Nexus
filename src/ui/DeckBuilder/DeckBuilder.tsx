import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import cardData from "../../static/card-data/bn-core.json";
import { CardType, Affinity, CardInterface } from "../../cards/types";
import { CreatureCard } from "../../cards/CreatureCard";
import { SupportCard } from "../../cards/SupportCard";
import { ActionCard } from "../../cards/ActionCard";
import { TrapCard } from "../../cards/TrapCard";
import { Card } from "../Battle/Card/Card";

const DECK_STORAGE_KEY = "battle-nexus-deck";

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

interface CardData {
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
  // Load deck from localStorage on initialization using lazy initializer
  const [selectedCards, setSelectedCards] = useState<Map<string, number>>(
    () => {
      const savedDeck = localStorage.getItem(DECK_STORAGE_KEY);
      if (savedDeck) {
        try {
          const deckArray = JSON.parse(savedDeck) as Array<{
            cardId: string;
            count: number;
          }>;
          return new Map(deckArray.map((item) => [item.cardId, item.count]));
        } catch (error) {
          console.error("Failed to load deck from localStorage:", error);
          return new Map();
        }
      }
      return new Map();
    }
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<CardType | "ALL">("ALL");
  const [filterAffinity, setFilterAffinity] = useState<Affinity | "ALL">("ALL");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const availableCards = cardData as CardData[];

  const saveDeckToLocalStorage = () => {
    const totalCards = Array.from(selectedCards.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    if (totalCards !== 20) {
      setSnackbarMessage(
        `Cannot save deck! You have ${totalCards} cards. You need exactly 20 cards to save.`
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const deckArray = Array.from(selectedCards.entries()).map(
      ([cardId, count]) => ({
        cardId,
        count,
      })
    );
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deckArray));
    setSnackbarMessage("Deck saved successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const clearDeck = () => {
    setSelectedCards(new Map());
    localStorage.removeItem(DECK_STORAGE_KEY);
    setSnackbarMessage("Deck cleared!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const filteredCards = useMemo(() => {
    return availableCards.filter((card) => {
      const matchesSearch =
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "ALL" || card.type === filterType;
      const matchesAffinity =
        filterAffinity === "ALL" || card.affinity === filterAffinity;
      return matchesSearch && matchesType && matchesAffinity;
    });
  }, [searchTerm, filterType, filterAffinity, availableCards]);

  const addCardToDeck = (cardId: string) => {
    const currentCount = selectedCards.get(cardId) || 0;
    if (currentCount < 3) {
      const newMap = new Map(selectedCards);
      newMap.set(cardId, currentCount + 1);
      setSelectedCards(newMap);
    }
  };

  const removeCardFromDeck = (cardId: string) => {
    const currentCount = selectedCards.get(cardId) || 0;
    if (currentCount > 0) {
      const newMap = new Map(selectedCards);
      if (currentCount === 1) {
        newMap.delete(cardId);
      } else {
        newMap.set(cardId, currentCount - 1);
      }
      setSelectedCards(newMap);
    }
  };

  const totalCards = Array.from(selectedCards.values()).reduce(
    (sum, count) => sum + count,
    0
  );
  const deckList = Array.from(selectedCards.entries()).map(
    ([cardId, count]) => {
      const card = availableCards.find((c) => c.id === cardId);
      return { card, count };
    }
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
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Search Cards"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                flex: 1,
                minWidth: "200px",
                "& .MuiOutlinedInput-root": { color: "#fff" },
                "& .MuiInputLabel-root": { color: "#cbd5e0" },
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: "#cbd5e0" }}>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as CardType | "ALL")
                }
                sx={{ color: "#fff" }}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="CREATURE">Creature</MenuItem>
                <MenuItem value="SUPPORT">Support</MenuItem>
                <MenuItem value="ACTION">Action</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: "#cbd5e0" }}>Affinity</InputLabel>
              <Select
                value={filterAffinity}
                onChange={(e) =>
                  setFilterAffinity(e.target.value as Affinity | "ALL")
                }
                sx={{ color: "#fff" }}
              >
                <MenuItem value="ALL">All Affinities</MenuItem>
                <MenuItem value="FIRE">Fire</MenuItem>
                <MenuItem value="WATER">Water</MenuItem>
                <MenuItem value="EARTH">Earth</MenuItem>
                <MenuItem value="WIND">Wind</MenuItem>
                <MenuItem value="LIGHT">Light</MenuItem>
                <MenuItem value="DARK">Dark</MenuItem>
                <MenuItem value="NEUTRAL">Neutral</MenuItem>
              </Select>
            </FormControl>
          </Box>

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
            <Typography
              variant="h5"
              sx={{ mb: 2, color: "#fff", textAlign: "center" }}
            >
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
                        <Typography
                          sx={{ color: "#a0aec0", fontSize: "0.75rem" }}
                        >
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
