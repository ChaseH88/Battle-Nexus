import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { ReplayEngine, ReplaySpeed } from "../../../battle/ReplayEngine";
import { GameLogEvent } from "../../../battle/GameLog";
import { GameState } from "../../../battle/GameState";

interface ReplayViewerProps {
  events: GameLogEvent[];
  onStateUpdate?: (state: GameState) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 8px;
`;

const Controls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 4px;
`;

const Button = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${(props) => (props.active ? "#4a9eff" : "#3a3a3a")};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: ${(props) => (props.active ? "#5aafff" : "#4a4a4a")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 8px;
  background: #3a3a3a;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
`;

const Progress = styled.div<{ percentage: number }>`
  width: ${(props) => props.percentage}%;
  height: 100%;
  background: linear-gradient(90deg, #4a9eff 0%, #6ab7ff 100%);
  transition: width 0.1s ease;
`;

const Info = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  font-size: 14px;
  color: #999;
`;

const EventDisplay = styled.div`
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 4px;
  min-height: 100px;
`;

const EventItem = styled.div<{ severity?: string }>`
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: #3a3a3a;
  border-left: 3px solid
    ${(props) => {
      switch (props.severity) {
        case "ERROR":
          return "#ff4444";
        case "WARN":
          return "#ffaa44";
        default:
          return "#4a9eff";
      }
    }};
  border-radius: 2px;
  font-size: 14px;
`;

const SpeedControl = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const SpeedButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  font-size: 12px;
`;

/**
 * ReplayViewer Component - Film mode for watching game replays
 *
 * Features:
 * - Play/Pause controls
 * - Speed control (0.5x to 3x)
 * - Step forward/backward
 * - Progress bar with seek
 * - Event timeline display
 * - Real-time state updates
 */
export const ReplayViewer: React.FC<ReplayViewerProps> = ({
  events,
  onStateUpdate,
}) => {
  const [replayEngine, setReplayEngine] = useState<ReplayEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const [progress, setProgress] = useState({
    currentEvent: 0,
    totalEvents: 0,
    percentage: 0,
  });
  const [currentEvent, setCurrentEvent] = useState<GameLogEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<GameLogEvent[]>([]);

  useEffect(() => {
    if (events.length === 0) return;

    const engine = new ReplayEngine(events, {
      speed,
      autoPlay: false,
      onEventReplay: (event, state) => {
        setCurrentEvent(event);
        setRecentEvents((prev) => [...prev.slice(-4), event]);
        setProgress(engine.getProgress());
        if (onStateUpdate) {
          onStateUpdate(state);
        }
      },
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    // Defer state updates to avoid cascading renders
    queueMicrotask(() => {
      setReplayEngine(engine);
      setProgress({
        currentEvent: 0,
        totalEvents: events.length,
        percentage: 0,
      });
    });

    return () => {
      engine.stop();
    };
  }, [events, onStateUpdate, speed]);

  useEffect(() => {
    if (replayEngine) {
      replayEngine.setSpeed(speed);
    }
  }, [speed, replayEngine]);

  const handlePlayPause = () => {
    if (!replayEngine) return;

    if (isPlaying) {
      replayEngine.pause();
      setIsPlaying(false);
    } else {
      replayEngine.play();
      setIsPlaying(true);
    }
  };

  const handleStepForward = () => {
    if (!replayEngine) return;
    replayEngine.stepForward();
    setProgress(replayEngine.getProgress());
  };

  const handleStepBackward = () => {
    if (!replayEngine) return;
    replayEngine.stepBackward();
    setProgress(replayEngine.getProgress());
  };

  const handleStop = () => {
    if (!replayEngine) return;
    replayEngine.stop();
    setIsPlaying(false);
    setCurrentEvent(null);
    setRecentEvents([]);
    setProgress({ currentEvent: 0, totalEvents: events.length, percentage: 0 });
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!replayEngine) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const targetEvent = Math.floor(percentage * events.length);

    replayEngine.jumpToEvent(targetEvent);
    setProgress(replayEngine.getProgress());
  };

  const changeSpeed = (newSpeed: ReplaySpeed) => {
    setSpeed(newSpeed);
  };

  if (events.length === 0) {
    return (
      <Container>
        <Info>No replay data available</Info>
      </Container>
    );
  }

  return (
    <Container>
      <Controls>
        <Button onClick={handleStop} disabled={!replayEngine}>
          ⏹ Stop
        </Button>
        <Button
          onClick={handleStepBackward}
          disabled={!replayEngine || progress.currentEvent === 0}
        >
          ⏮ Step Back
        </Button>
        <Button
          onClick={handlePlayPause}
          disabled={!replayEngine}
          active={isPlaying}
        >
          {isPlaying ? "⏸ Pause" : "▶️ Play"}
        </Button>
        <Button
          onClick={handleStepForward}
          disabled={
            !replayEngine || progress.currentEvent >= progress.totalEvents
          }
        >
          ⏭ Step Forward
        </Button>

        <ProgressBar onClick={handleProgressClick}>
          <Progress percentage={progress.percentage} />
        </ProgressBar>

        <SpeedControl>
          <SpeedButton active={speed === 0.5} onClick={() => changeSpeed(0.5)}>
            0.5x
          </SpeedButton>
          <SpeedButton active={speed === 1} onClick={() => changeSpeed(1)}>
            1x
          </SpeedButton>
          <SpeedButton active={speed === 1.5} onClick={() => changeSpeed(1.5)}>
            1.5x
          </SpeedButton>
          <SpeedButton active={speed === 2} onClick={() => changeSpeed(2)}>
            2x
          </SpeedButton>
          <SpeedButton active={speed === 3} onClick={() => changeSpeed(3)}>
            3x
          </SpeedButton>
        </SpeedControl>
      </Controls>

      <Info>
        <span>
          Event {progress.currentEvent} / {progress.totalEvents}
        </span>
        <span>
          Turn {currentEvent?.turn || 0} - {currentEvent?.phase || "N/A"}
        </span>
        <span>{Math.round(progress.percentage)}% Complete</span>
      </Info>

      <EventDisplay>
        <h3 style={{ margin: "0 0 1rem 0", color: "#fff" }}>Recent Events</h3>
        {recentEvents.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            No events yet - press play to start
          </p>
        ) : (
          recentEvents.map((event, _idx) => (
            <EventItem key={event.id} severity={event.severity}>
              <strong style={{ color: "#4a9eff" }}>{event.type}</strong> -{" "}
              {event.message}
              {event.entities?.cards && event.entities.cards.length > 0 && (
                <div
                  style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}
                >
                  Cards: {event.entities.cards.map((c) => c.name).join(", ")}
                </div>
              )}
            </EventItem>
          ))
        )}
      </EventDisplay>
    </Container>
  );
};
