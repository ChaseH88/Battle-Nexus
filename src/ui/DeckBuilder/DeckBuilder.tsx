import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card as MuiCard,
  CardContent,
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
import { CardType, Affinity } from "../../cards/types";

const DECK_STORAGE_KEY = "battle-nexus-deck";

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
}

const DeckBuilder: React.FC = () => {
  const [selectedCards, setSelectedCards] = useState<Map<string, number>>(
    new Map()
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

  // Load deck from localStorage on mount
  useEffect(() => {
    const savedDeck = localStorage.getItem(DECK_STORAGE_KEY);
    if (savedDeck) {
      try {
        const deckArray = JSON.parse(savedDeck) as Array<{
          cardId: string;
          count: number;
        }>;
        const deckMap = new Map(
          deckArray.map((item) => [item.cardId, item.count])
        );
        setSelectedCards(deckMap);
      } catch (error) {
        console.error("Failed to load deck from localStorage:", error);
      }
    }
  }, []);

  const saveDeckToLocalStorage = () => {
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
  }, [searchTerm, filterType, filterAffinity]);

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

  const getAffinityColor = (affinity: Affinity) => {
    switch (affinity) {
      case Affinity.Fire:
        return "#ef4444";
      case Affinity.Water:
        return "#3b82f6";
      case Affinity.Grass:
        return "#84cc16";
      case Affinity.Wind:
        return "#22d3ee";
      case Affinity.Light:
        return "#fbbf24";
      case Affinity.Shadow:
        return "#8b5cf6";
      case Affinity.Metal:
        return "#9ca3af";
      default:
        return "#6b7280";
    }
  };

  const getTypeColor = (type: CardType) => {
    switch (type) {
      case "CREATURE":
        return "#ed8936";
      case "SUPPORT":
        return "#4299e1";
      case "ACTION":
        return "#9f7aea";
      default:
        return "#718096";
    }
  };

  return (
    <Box sx={{ maxWidth: "1600px", margin: "0 auto", padding: "20px" }}>
      <Typography
        variant="h3"
        sx={{ mb: 3, textAlign: "center", color: "#fff" }}
      >
        Deck Builder
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Card Collection */}
        <Grid>
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

          <Grid container spacing={2}>
            {filteredCards.map((card) => {
              const countInDeck = selectedCards.get(card.id) || 0;
              return (
                <Grid key={card.id}>
                  <MuiCard
                    sx={{
                      background: "linear-gradient(145deg, #2d3748, #1a202c)",
                      border: `2px solid ${getTypeColor(card.type)}`,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
                      },
                    }}
                    onClick={() => addCardToDeck(card.id)}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ color: "#fff", fontWeight: "bold" }}
                        >
                          {card.name}
                        </Typography>
                        <Chip
                          label={`${countInDeck}/3`}
                          size="small"
                          sx={{
                            background:
                              countInDeck === 3
                                ? "#48bb78"
                                : "rgba(255,255,255,0.2)",
                            color: "#fff",
                            fontWeight: "bold",
                          }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                        <Chip
                          label={card.type}
                          size="small"
                          sx={{
                            background: getTypeColor(card.type),
                            color: "#fff",
                            fontSize: "0.7rem",
                          }}
                        />
                        <Chip
                          label={card.affinity}
                          size="small"
                          sx={{
                            background: getAffinityColor(card.affinity),
                            color: "#fff",
                            fontSize: "0.7rem",
                          }}
                        />
                        <Chip
                          label={`Cost: ${card.cost}`}
                          size="small"
                          sx={{
                            background: "rgba(255,255,255,0.2)",
                            color: "#fff",
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#cbd5e0",
                          fontSize: "0.85rem",
                          mb: 1,
                          fontStyle: "italic",
                        }}
                      >
                        {card.description}
                      </Typography>
                      {card.type === "CREATURE" && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "center",
                            mt: 1,
                          }}
                        >
                          <Typography
                            sx={{ color: "#fc8181", fontWeight: "bold" }}
                          >
                            ATK: {card.atk}
                          </Typography>
                          <Typography
                            sx={{ color: "#63b3ed", fontWeight: "bold" }}
                          >
                            DEF: {card.def}
                          </Typography>
                          <Typography
                            sx={{ color: "#68d391", fontWeight: "bold" }}
                          >
                            HP: {card.hp}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </MuiCard>
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        {/* Right Panel - Current Deck */}
        <Grid>
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
                        border: `1px solid ${getTypeColor(card.type)}`,
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
        </Grid>
      </Grid>

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
