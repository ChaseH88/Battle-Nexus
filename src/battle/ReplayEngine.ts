import { GameState, createGameState } from "./GameState";
import { GameLogEvent, GameStateSnapshot } from "./GameLog";
import { BattleEngine } from "./BattleEngine";

export type ReplaySpeed = 0.5 | 1 | 1.5 | 2 | 3;

export interface ReplayOptions {
  speed?: ReplaySpeed;
  autoPlay?: boolean;
  startFromEvent?: number;
  onEventReplay?: (event: GameLogEvent, state: GameState) => void;
  onComplete?: () => void;
}

/**
 * ReplayEngine - Reconstructs and replays a battle from event log
 *
 * Use cases:
 * - Film mode: Watch a battle play out step-by-step
 * - Network sync: Replay opponent's actions in real-time
 * - Debugging: Step through game events to find issues
 * - Analytics: Analyze game patterns and strategies
 */
export class ReplayEngine {
  private events: GameLogEvent[];
  private currentEventIndex: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private speed: ReplaySpeed = 1;
  private replayState: GameState | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private onEventReplay?: (event: GameLogEvent, state: GameState) => void;
  private onComplete?: () => void;

  constructor(events: GameLogEvent[], options: ReplayOptions = {}) {
    this.events = [...events]; // Clone to prevent external mutations
    this.speed = options.speed || 1;
    this.currentEventIndex = options.startFromEvent || 0;
    this.onEventReplay = options.onEventReplay;
    this.onComplete = options.onComplete;

    if (options.autoPlay) {
      this.play();
    }
  }

  /**
   * Initialize replay state from first snapshot or initial game state
   */
  private initializeState(): GameState {
    // Find the first snapshot or use initial state
    const firstSnapshot = this.events.find((e) => e.stateSnapshot);

    if (firstSnapshot?.stateSnapshot) {
      return this.reconstructStateFromSnapshot(firstSnapshot.stateSnapshot);
    }

    // If no snapshots, we need initial player data from events
    const gameStartEvent = this.events.find((e) => e.type === "GAME_START");
    if (!gameStartEvent) {
      throw new Error(
        "Cannot replay: No initial game state or GAME_START event"
      );
    }

    // Create a basic initial state - this would need to be enhanced
    // based on your actual initialization logic
    throw new Error(
      "Replay from scratch not yet implemented - need initial deck data"
    );
  }

  /**
   * Reconstruct GameState from a snapshot
   */
  private reconstructStateFromSnapshot(snapshot: GameStateSnapshot): GameState {
    // This is a simplified reconstruction - you may need to enhance this
    // based on your full GameState structure
    const players: any[] = snapshot.players.map((p) => ({
      id: p.id,
      deck: [], // Deck contents not in snapshot for security
      hand: [], // Hand contents not in snapshot
      creatures: p.creatures.map((c) =>
        c
          ? {
              id: c.id,
              name: c.name,
              hp: c.hp,
              atk: c.atk,
              def: c.def,
              mode: c.mode,
              isFaceDown: c.isFaceDown,
              // Note: Full card data would need to be looked up from card registry
            }
          : null
      ),
      support: p.support.map((s) =>
        s
          ? {
              id: s.id,
              name: s.name,
              isActive: s.isActive,
            }
          : null
      ),
      discardPile: [], // Discard pile not in snapshot
      hp: p.hp,
    }));

    // Create base state structure
    const state = createGameState(players[0], players[1]);
    state.turn = snapshot.turn;
    state.phase = snapshot.phase;
    state.hasDrawnThisTurn = snapshot.hasDrawnThisTurn;
    state.koCount = [...snapshot.koCount] as [number, number];
    state.winnerIndex = snapshot.winnerIndex as 0 | 1 | null;

    return state;
  }

  /**
   * Start playing the replay
   */
  play(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.isPaused = false;

    // Initialize state if first play
    if (!this.replayState && this.currentEventIndex === 0) {
      try {
        this.replayState = this.initializeState();
      } catch (e) {
        console.error("Failed to initialize replay state:", e);
        return;
      }
    }

    this.scheduleNextEvent();
  }

  /**
   * Pause the replay
   */
  pause(): void {
    this.isPaused = true;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Resume the replay
   */
  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.scheduleNextEvent();
  }

  /**
   * Stop the replay and reset
   */
  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentEventIndex = 0;
    this.replayState = null;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Step forward one event
   */
  stepForward(): boolean {
    if (this.currentEventIndex >= this.events.length) {
      return false;
    }

    const event = this.events[this.currentEventIndex];
    this.applyEvent(event);
    this.currentEventIndex++;

    return this.currentEventIndex < this.events.length;
  }

  /**
   * Step backward one event (requires snapshots)
   */
  stepBackward(): boolean {
    if (this.currentEventIndex <= 0) {
      return false;
    }

    // Find the last snapshot before current position
    let snapshotIndex = -1;
    for (let i = this.currentEventIndex - 1; i >= 0; i--) {
      if (this.events[i].stateSnapshot) {
        snapshotIndex = i;
        break;
      }
    }

    if (snapshotIndex === -1) {
      console.warn("Cannot step backward: No snapshot available");
      return false;
    }

    // Restore to snapshot and replay events up to target
    const snapshot = this.events[snapshotIndex].stateSnapshot!;
    this.replayState = this.reconstructStateFromSnapshot(snapshot);

    const targetIndex = this.currentEventIndex - 1;
    for (let i = snapshotIndex + 1; i < targetIndex; i++) {
      this.applyEvent(this.events[i]);
    }

    this.currentEventIndex = targetIndex;
    return true;
  }

  /**
   * Jump to a specific event index
   */
  jumpToEvent(index: number): boolean {
    if (index < 0 || index >= this.events.length) {
      return false;
    }

    // Find nearest snapshot before target
    let snapshotIndex = -1;
    for (let i = index; i >= 0; i--) {
      if (this.events[i].stateSnapshot) {
        snapshotIndex = i;
        break;
      }
    }

    if (snapshotIndex === -1) {
      console.warn("Cannot jump: No snapshot available");
      return false;
    }

    // Restore to snapshot and replay to target
    const snapshot = this.events[snapshotIndex].stateSnapshot!;
    this.replayState = this.reconstructStateFromSnapshot(snapshot);

    for (let i = snapshotIndex + 1; i <= index; i++) {
      this.applyEvent(this.events[i]);
    }

    this.currentEventIndex = index + 1;
    return true;
  }

  /**
   * Apply a single event to the replay state
   */
  private applyEvent(event: GameLogEvent): void {
    if (!this.replayState) return;

    // If event has a snapshot, use it directly
    if (event.stateSnapshot) {
      this.replayState = this.reconstructStateFromSnapshot(event.stateSnapshot);
    }

    // Trigger callback if provided
    if (this.onEventReplay) {
      this.onEventReplay(event, this.replayState);
    }

    // Note: For events without snapshots, you would apply the event
    // to the state here based on event.type and event.data
    // This requires implementing state mutation logic for each event type
  }

  /**
   * Schedule the next event based on replay speed
   */
  private scheduleNextEvent(): void {
    if (!this.isPlaying || this.isPaused) return;

    if (this.currentEventIndex >= this.events.length) {
      this.isPlaying = false;
      if (this.onComplete) {
        this.onComplete();
      }
      return;
    }

    const hasMore = this.stepForward();

    if (hasMore && this.isPlaying && !this.isPaused) {
      // Calculate delay based on speed (base delay is 1000ms at 1x speed)
      const delay = 1000 / this.speed;
      this.intervalId = setTimeout(() => this.scheduleNextEvent(), delay);
    } else if (!hasMore && this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: ReplaySpeed): void {
    this.speed = speed;
  }

  /**
   * Get current replay progress
   */
  getProgress(): {
    currentEvent: number;
    totalEvents: number;
    percentage: number;
  } {
    return {
      currentEvent: this.currentEventIndex,
      totalEvents: this.events.length,
      percentage: (this.currentEventIndex / this.events.length) * 100,
    };
  }

  /**
   * Get current replay state (read-only)
   */
  getCurrentState(): Readonly<GameState> | null {
    return this.replayState;
  }

  /**
   * Check if replay is currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying && !this.isPaused;
  }
}

/**
 * Utility function to export game log for sharing/storage
 */
export function exportGameLog(
  events: GameLogEvent[],
  metadata?: {
    player1Name?: string;
    player2Name?: string;
    winner?: string;
    duration?: number;
  }
): string {
  return JSON.stringify({
    version: "1.0",
    exportedAt: Date.now(),
    metadata,
    events,
  });
}

/**
 * Utility function to import game log
 */
export function importGameLog(json: string): {
  events: GameLogEvent[];
  metadata?: any;
} {
  const data = JSON.parse(json);
  return {
    events: data.events || [],
    metadata: data.metadata,
  };
}
