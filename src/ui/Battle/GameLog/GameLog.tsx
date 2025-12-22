import { useState } from "react";
import { GameLogger, GameLogEvent } from "../../../battle/GameLog";
import { GameLogContainer, GameLogTitle, LogEntries, LogEntry } from "./styled";
import { Box } from "@mui/material";

interface GameLogProps {
  log: GameLogger;
}

// Helper to get severity color
const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case "ERROR":
      return "#ef4444";
    case "WARN":
      return "#f59e0b";
    default:
      return "#6366f1";
  }
};

// Helper to get type badge color
const getTypeColor = (type: string) => {
  switch (type) {
    case "CARD_DRAWN":
      return "#fbbf24";
    case "CARD_PLAYED":
      return "#22c55e";
    case "ATTACK_DECLARED":
    case "ATTACK_DIRECT":
      return "#ef4444";
    case "CARD_DESTROYED":
      return "#dc2626";
    case "EFFECT_TRIGGERED":
    case "EFFECT_APPLIED":
      return "#a855f7";
    case "TURN_START":
    case "TURN_END":
      return "#3b82f6";
    default:
      return "#6366f1";
  }
};

export const GameLog = ({ log }: GameLogProps) => {
  const [eventsToShow, setEventsToShow] = useState(10);

  const events = log.getEvents();
  const recentEvents = events.slice(-eventsToShow).reverse();

  const handleOpponentMessage = (message: string) => {
    // LOG EVENTS WILL COME IN A STRING LIKE THIS:
    // AI Opponent set support card face-down to support slot 0
    return message.replace("AI Opponent", "Opponent");
  };

  return (
    <GameLogContainer>
      <GameLogTitle>Game Log</GameLogTitle>
      <Box
        position="sticky"
        top="0"
        right="12px"
        width="100%"
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        gap="8px"
        mb="8px"
      >
        <Box
          component="input"
          type="number"
          min={1}
          max={100}
          value={eventsToShow}
          onChange={(e) => setEventsToShow(Number(e.target.value))}
          padding="4px 8px"
          width="50px"
        />
      </Box>
      <LogEntries>
        {recentEvents.map((event: GameLogEvent) => (
          <LogEntry
            key={event.id}
            style={{
              borderLeftColor: getSeverityColor(event.severity),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: getTypeColor(event.type),
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {event.type.replace(/_/g, " ")}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#94a3b8",
                  fontWeight: "normal",
                }}
              >
                Turn {event.turn}
                {event.phase && ` • ${event.phase}`}
              </span>
            </div>
            <div>
              {event?.actor && event.actor === 1
                ? handleOpponentMessage(event.message)
                : event.message}
            </div>
          </LogEntry>
        ))}
      </LogEntries>
    </GameLogContainer>
  );
};
