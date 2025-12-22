/**
 * Battle Nexus - Replay & Undo System Exports
 *
 * This file provides centralized exports for all replay and undo functionality.
 */

// Core logging system
export {
  GameLogger,
  type GameLogEvent,
  type GameLogEventType,
  type GameStateSnapshot,
  type Phase,
  type PlayerId,
  type CardRef,
  type EffectRef,
  type LaneRef,
  type SlotRef,
  type CardDrawnData,
  type CardPlayedData,
  type AttackData,
  type DamageData,
  type CardDestroyedData,
  type EffectTriggeredData,
  type ModeChangedData,
} from "./GameLog";

// Replay engine
export {
  ReplayEngine,
  exportGameLog,
  importGameLog,
  type ReplaySpeed,
  type ReplayOptions,
} from "./ReplayEngine";

// Undo manager
export { UndoManager, restoreStateFromSnapshot } from "./UndoManager";

/**
 * Quick Start Guide:
 *
 * 1. Create a logger with automatic snapshots:
 *    const logger = new GameLogger({ snapshotOnMajorEvents: true });
 *
 * 2. Use it in your game state:
 *    const state = createGameState(p1, p2);
 *    state.log = logger;
 *
 * 3. For replay (film mode):
 *    const replay = new ReplayEngine(logger.getEvents(), {
 *      speed: 1,
 *      autoPlay: true,
 *      onEventReplay: (event, state) => updateUI(state)
 *    });
 *
 * 4. For undo:
 *    const undoMgr = new UndoManager(logger);
 *    const snapshot = undoMgr.undo();
 *    if (snapshot) restoreStateFromSnapshot(state, snapshot);
 *
 * 5. For network sync:
 *    const json = exportGameLog(logger.getEvents(), metadata);
 *    socket.emit('gameEvents', json);
 */
