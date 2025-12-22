import { GameState } from "./GameState";
import { GameLogger, GameLogEvent, GameStateSnapshot } from "./GameLog";

/**
 * UndoManager - Manages undo/redo functionality for the battle system
 *
 * Uses snapshots from the GameLogger to restore previous game states.
 * Only reversible actions can be undone.
 */
export class UndoManager {
  private logger: GameLogger;
  private maxUndoSteps: number;

  constructor(logger: GameLogger, options?: { maxUndoSteps?: number }) {
    this.logger = logger;
    this.maxUndoSteps = options?.maxUndoSteps || 50;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    const reversibleEvents = this.logger.getReversibleEvents();
    return reversibleEvents.length > 0;
  }

  /**
   * Get the last reversible event
   */
  getLastReversibleEvent(): GameLogEvent | null {
    const reversible = this.logger.getReversibleEvents();
    return reversible.length > 0 ? reversible[reversible.length - 1] : null;
  }

  /**
   * Undo the last reversible action
   * Returns the snapshot to restore, or null if undo is not available
   */
  undo(): GameStateSnapshot | null {
    const lastReversible = this.getLastReversibleEvent();
    if (!lastReversible) {
      return null;
    }

    // Find the snapshot immediately before this action
    const events = this.logger.getEvents();
    const targetIndex = events.findIndex((e) => e.id === lastReversible.id);

    // Look backwards for a snapshot before this event
    for (let i = targetIndex - 1; i >= 0; i--) {
      if (events[i].stateSnapshot) {
        return events[i].stateSnapshot!;
      }
    }

    // If no snapshot found, cannot undo
    console.warn("Cannot undo: No snapshot available before action");
    return null;
  }

  /**
   * Get available undo steps (for UI display)
   */
  getUndoSteps(): Array<{ event: GameLogEvent; description: string }> {
    const reversible = this.logger.getReversibleEvents();
    return reversible.slice(-this.maxUndoSteps).map((event) => ({
      event,
      description: event.message,
    }));
  }

  /**
   * Undo to a specific event by ID
   */
  undoToEvent(eventId: string): GameStateSnapshot | null {
    const events = this.logger.getEvents();
    const targetIndex = events.findIndex((e) => e.id === eventId);

    if (targetIndex === -1) {
      return null;
    }

    // Find nearest snapshot before target event
    for (let i = targetIndex - 1; i >= 0; i--) {
      if (events[i].stateSnapshot) {
        return events[i].stateSnapshot!;
      }
    }

    return null;
  }

  /**
   * Clear undo history (useful when starting a new game or after certain actions)
   */
  clearHistory(): void {
    // Note: This doesn't clear the logger, just resets undo capability
    // In a full implementation, you might want to clear reversible flags
  }
}

/**
 * Helper function to restore a game state from a snapshot
 */
export function restoreStateFromSnapshot(
  currentState: GameState,
  snapshot: GameStateSnapshot
): void {
  // Restore core game state
  currentState.turn = snapshot.turn;
  currentState.phase = snapshot.phase;
  currentState.hasDrawnThisTurn = snapshot.hasDrawnThisTurn;
  currentState.koCount = [...snapshot.koCount] as [number, number];
  currentState.winnerIndex = snapshot.winnerIndex as 0 | 1 | null;

  // Restore player states
  // Note: This is a simplified restoration
  // In a real implementation, you'd need to fully reconstruct the player state
  // from your card registry and apply the snapshot data
  snapshot.players.forEach((playerSnapshot, i) => {
    const player = currentState.players[i] as any;
    // Restore what we can from snapshot
    // Full implementation would reconstruct from card registry
  });

  // Restore active effects
  currentState.activeEffects = snapshot.activeEffects.map((e) => ({
    id: e.id,
    name: e.name,
    sourceCardId: e.sourceCardId,
    turnsRemaining: e.turnsRemaining,
    // You'd need to reconstruct full effect data here
  })) as any;
}
