import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Tooltip,
} from "@mui/material";
import effectsData from "../../effects/data.json";
import { EffectDefinition } from "../../effects/types";
import { effectHandlers } from "../../effects/handler";

const effects = effectsData as EffectDefinition[];

// Check which effects have handlers implemented
const implementedEffects = new Set(Object.keys(effectHandlers));
const effectsWithStatus = effects.map((effect) => ({
  ...effect,
  hasHandler: implementedEffects.has(effect.id),
}));

export default function Effects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTiming, setFilterTiming] = useState<string>("all");
  const [filterTrigger, setFilterTrigger] = useState<string>("all");
  const [filterImplementation, setFilterImplementation] =
    useState<string>("all");

  // Get unique timings and triggers for filters
  const timings = Array.from(new Set(effectsWithStatus.map((e) => e.timing)));
  const triggers = Array.from(new Set(effectsWithStatus.map((e) => e.trigger)));

  // Count implementation status
  const implementedCount = effectsWithStatus.filter((e) => e.hasHandler).length;
  const missingCount = effectsWithStatus.length - implementedCount;

  // Filter effects based on search and filters
  const filteredEffects = effectsWithStatus.filter((effect) => {
    const matchesSearch =
      effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      effect.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      effect.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTiming =
      filterTiming === "all" || effect.timing === filterTiming;
    const matchesTrigger =
      filterTrigger === "all" || effect.trigger === filterTrigger;
    const matchesImplementation =
      filterImplementation === "all" ||
      (filterImplementation === "implemented" && effect.hasHandler) ||
      (filterImplementation === "missing" && !effect.hasHandler);

    return (
      matchesSearch && matchesTiming && matchesTrigger && matchesImplementation
    );
  });

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case "PERSIST":
        return "primary";
      case "NORMAL":
        return "success";
      case "QUICK":
        return "warning";
      case "IMMEDIATE":
        return "error";
      default:
        return "default";
    }
  };

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case "CONTINUOUS":
        return "primary";
      case "ON_PLAY":
        return "success";
      case "ON_ATTACK":
        return "warning";
      case "ON_DEFEND":
        return "error";
      case "ON_DESTROY":
        return "secondary";
      case "ON_DRAW":
        return "info";
      default:
        return "default";
    }
  };

  const formatActionType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  const renderActions = (actions: any[]) => {
    return actions.map((action, index) => (
      <Box
        key={index}
        sx={{
          ml: 2,
          p: 1,
          mb: 1,
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: 1,
          borderLeft: "3px solid",
          borderLeftColor: "primary.main",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
          {formatActionType(action.type)}
        </Typography>
        {action.target && (
          <Typography variant="caption" display="block">
            Target: {action.target}
          </Typography>
        )}
        {action.mode && (
          <Typography variant="caption" display="block">
            Mode: {action.mode}
          </Typography>
        )}
        {action.atk && (
          <Typography variant="caption" display="block">
            ATK: +{action.atk}
          </Typography>
        )}
        {action.def && (
          <Typography variant="caption" display="block">
            DEF: +{action.def}
          </Typography>
        )}
        {action.amount && (
          <Typography variant="caption" display="block">
            Amount: {action.amount}
          </Typography>
        )}
        {action.filter && (
          <Typography variant="caption" display="block">
            Filter: {JSON.stringify(action.filter)}
          </Typography>
        )}
        {action.duration && (
          <Typography variant="caption" display="block">
            Duration: {action.duration.kind}
            {action.duration.turns && ` (${action.duration.turns} turns)`}
          </Typography>
        )}
        {action.type === "IF" && (
          <Box sx={{ ml: 1, mt: 1 }}>
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              Condition: {action.condition.check}
            </Typography>
            {action.then && (
              <Box sx={{ ml: 1 }}>
                <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                  Then:
                </Typography>
                {renderActions(action.then)}
              </Box>
            )}
            {action.else && (
              <Box sx={{ ml: 1 }}>
                <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                  Else:
                </Typography>
                {renderActions(action.else)}
              </Box>
            )}
          </Box>
        )}
      </Box>
    ));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 1400, margin: "0 auto" }}>
        <Typography
          variant="h3"
          sx={{
            color: "#fff",
            mb: 4,
            textAlign: "center",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          Card Effects Registry
        </Typography>

        {/* Filters */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Search Effects"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or description..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.5)",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ minWidth: 200, flex: 1 }}>
                <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Timing
                </InputLabel>
                <Select
                  value={filterTiming}
                  onChange={(e) => setFilterTiming(e.target.value)}
                  label="Timing"
                  sx={{
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  {timings.map((timing) => (
                    <MenuItem key={timing} value={timing}>
                      {timing}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200, flex: 1 }}>
                <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Trigger
                </InputLabel>
                <Select
                  value={filterTrigger}
                  onChange={(e) => setFilterTrigger(e.target.value)}
                  label="Trigger"
                  sx={{
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  {triggers.map((trigger) => (
                    <MenuItem key={trigger} value={trigger}>
                      {trigger}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200, flex: 1 }}>
                <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Implementation
                </InputLabel>
                <Select
                  value={filterImplementation}
                  onChange={(e) => setFilterImplementation(e.target.value)}
                  label="Implementation"
                  sx={{
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="implemented">
                    ✓ Implemented ({implementedCount})
                  </MenuItem>
                  <MenuItem value="missing">
                    ⚠ Missing ({missingCount})
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Found: {filteredEffects.length} effects
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Chip
                label={`✓ ${implementedCount} Implemented`}
                size="small"
                color="success"
                variant="outlined"
              />
              <Chip
                label={`⚠ ${missingCount} Missing Handler`}
                size="small"
                color="warning"
                variant="outlined"
              />
            </Box>
          </Box>
        </Paper>

        {/* Effects Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {filteredEffects.map((effect) => (
            <Card
              key={effect.id}
              sx={{
                backgroundColor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  borderColor: "rgba(255,255,255,0.3)",
                },
              }}
            >
              <CardContent>
                {/* Header */}
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#fff",
                        fontWeight: "bold",
                        mb: 0.5,
                      }}
                    >
                      {effect.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        fontFamily: "monospace",
                      }}
                    >
                      ID: {effect.id}
                    </Typography>
                  </Box>
                  <Tooltip
                    title={
                      effect.hasHandler
                        ? "Handler implemented in code"
                        : "⚠️ Handler missing - needs implementation in src/effects/effect/"
                    }
                  >
                    <Box
                      sx={{
                        fontSize: 28,
                        lineHeight: 1,
                        color: effect.hasHandler ? "#4caf50" : "#ff9800",
                      }}
                    >
                      {effect.hasHandler ? "✓" : "⚠"}
                    </Box>
                  </Tooltip>
                </Box>

                {/* Badges */}
                <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={effect.timing}
                    size="small"
                    color={getTimingColor(effect.timing) as any}
                    sx={{ fontWeight: "bold" }}
                  />
                  <Chip
                    label={effect.trigger}
                    size="small"
                    color={getTriggerColor(effect.trigger) as any}
                    variant="outlined"
                  />
                  {effect.stackable && (
                    <Chip
                      label="Stackable"
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                  {effect.chainable && (
                    <Chip
                      label="Chainable"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  {effect.requiresTarget && (
                    <Chip
                      label="Requires Target"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Description */}
                {effect.description && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      mb: 2,
                      fontStyle: "italic",
                    }}
                  >
                    {effect.description}
                  </Typography>
                )}

                {/* Target Type */}
                {effect.targetType && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      display: "block",
                      mb: 1,
                    }}
                  >
                    Target Type: {effect.targetType}
                  </Typography>
                )}

                {/* Missing Handler Warning */}
                {!effect.hasHandler && (
                  <Paper
                    sx={{
                      p: 1.5,
                      mb: 2,
                      backgroundColor: "rgba(255, 152, 0, 0.1)",
                      border: "1px solid rgba(255, 152, 0, 0.3)",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
                    >
                      <Box
                        sx={{
                          fontSize: 20,
                          color: "#ff9800",
                          lineHeight: 1,
                          mt: 0.2,
                        }}
                      >
                        ⚠
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#ff9800",
                            fontWeight: "bold",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Handler Not Implemented
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255,255,255,0.7)",
                            display: "block",
                            fontFamily: "monospace",
                            fontSize: "0.7rem",
                          }}
                        >
                          Create: src/effects/effect/{effect.id}.ts
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255,255,255,0.7)",
                            display: "block",
                            fontFamily: "monospace",
                            fontSize: "0.7rem",
                          }}
                        >
                          Add to: src/effects/handler.ts
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )}

                {/* Actions */}
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#fff",
                      fontWeight: "bold",
                      mb: 1,
                    }}
                  >
                    Actions:
                  </Typography>
                  {renderActions(effect.actions)}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {filteredEffects.length === 0 && (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          >
            <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.6)" }}>
              No effects found matching your criteria
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
