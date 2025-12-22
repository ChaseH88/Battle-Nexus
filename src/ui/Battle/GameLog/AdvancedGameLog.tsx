import { useState } from "react";
import {
  GameLogger,
  GameLogEvent,
  GameLogEventType,
} from "../../../battle/GameLog";

interface AdvancedGameLogProps {
  log: GameLogger;
}

const EVENT_TYPE_CATEGORIES = {
  "Game Flow": [
    "GAME_START",
    "TURN_START",
    "PHASE_CHANGE",
    "TURN_END",
    "GAME_END",
  ],
  Cards: [
    "CARD_DRAWN",
    "CARD_PLAYED",
    "CARD_ACTIVATED",
    "CARD_FLIPPED",
    "CARD_DESTROYED",
  ],
  Combat: ["ATTACK_DECLARED", "ATTACK_DIRECT", "DAMAGE_DEALT"],
  Effects: ["EFFECT_TRIGGERED", "EFFECT_APPLIED", "EFFECT_EXPIRED"],
  Other: ["MODE_CHANGED", "INFO", "WARNING", "ERROR"],
};

export const AdvancedGameLog = ({ log }: AdvancedGameLogProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [maxEvents, setMaxEvents] = useState(10);

  const events = log.getEvents();

  // Filter by category
  const filteredEvents = selectedCategory
    ? events.filter((e) =>
        EVENT_TYPE_CATEGORIES[
          selectedCategory as keyof typeof EVENT_TYPE_CATEGORIES
        ]?.includes(e.type)
      )
    : events;

  const recentEvents = filteredEvents.slice(-maxEvents).reverse();

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  const getTypeColor = (type: GameLogEventType) => {
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

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "ERROR":
        return "❌";
      case "WARN":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)",
        borderRadius: "16px",
        padding: "25px",
        border: "2px solid rgba(99, 102, 241, 0.3)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h4
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "2px",
            background: "linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Game Log ({events.length} events)
        </h4>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label
            style={{
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <input
              type="checkbox"
              checked={showTimestamps}
              onChange={(e) => setShowTimestamps(e.target.checked)}
            />
            Timestamps
          </label>

          <select
            value={maxEvents}
            onChange={(e) => setMaxEvents(Number(e.target.value))}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0",
              fontSize: "0.85rem",
            }}
          >
            <option value={10}>10 events</option>
            <option value={25}>25 events</option>
            <option value={50}>50 events</option>
            <option value={100}>All</option>
          </select>
        </div>
      </div>

      {/* Category Filters */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "15px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            background:
              selectedCategory === null ? "#6366f1" : "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          All
        </button>
        {Object.keys(EVENT_TYPE_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background:
                selectedCategory === category ? "#6366f1" : "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Event List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {recentEvents.map((event: GameLogEvent) => (
          <div
            key={event.id}
            style={{
              padding: "12px 16px",
              background: "rgba(0, 0, 0, 0.3)",
              borderLeft: `4px solid ${getTypeColor(event.type)}`,
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              transition: "all 0.2s",
            }}
          >
            {/* Event Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "1rem" }}>
                {getSeverityIcon(event.severity)}
              </span>

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
                {event.actor !== undefined && ` • P${event.actor + 1}`}
              </span>

              {showTimestamps && (
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "#64748b",
                    marginLeft: "auto",
                  }}
                >
                  {formatTimestamp(event.ts)}
                </span>
              )}
            </div>

            {/* Event Message */}
            <div
              style={{
                fontSize: "0.95rem",
                color: "#e2e8f0",
                lineHeight: "1.5",
              }}
            >
              {event.message}
            </div>

            {/* Entity References (if any) */}
            {event.entities && (
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {event.entities.cards && event.entities.cards.length > 0 && (
                  <span>
                    🃏 {event.entities.cards.map((c) => c.name).join(", ")}
                  </span>
                )}
                {event.entities.lanes && event.entities.lanes.length > 0 && (
                  <span>
                    🎯 Lane{" "}
                    {event.entities.lanes.map((l) => l.index + 1).join(", ")}
                  </span>
                )}
                {event.entities.effects &&
                  event.entities.effects.length > 0 && (
                    <span>
                      ✨ {event.entities.effects.map((e) => e.name).join(", ")}
                    </span>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
