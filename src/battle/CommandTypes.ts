/**
 * Command validation and execution types for Battle Nexus engine
 * Provides structured errors and validation results for UI feedback
 */

export enum CommandErrorCode {
  INSUFFICIENT_MOMENTUM = "INSUFFICIENT_MOMENTUM",
  INVALID_PHASE = "INVALID_PHASE",
  CARD_NOT_IN_HAND = "CARD_NOT_IN_HAND",
  INVALID_CARD_TYPE = "INVALID_CARD_TYPE",
  SLOT_OCCUPIED = "SLOT_OCCUPIED",
  INVALID_SLOT = "INVALID_SLOT",
  GAME_ALREADY_WON = "GAME_ALREADY_WON",
  NOT_ACTIVE_PLAYER = "NOT_ACTIVE_PLAYER",
}

export interface CommandError {
  code: CommandErrorCode;
  message: string;
  context?: {
    required?: number;
    available?: number;
    cardId?: string;
    cardName?: string;
    cost?: number;
    [key: string]: any;
  };
}

export interface CommandSuccess<T = void> {
  success: true;
  data?: T;
}

export interface CommandFailure {
  success: false;
  error: CommandError;
}

export type CommandResult<T = void> = CommandSuccess<T> | CommandFailure;

/**
 * Helper to create error results
 */
export function createError(
  code: CommandErrorCode,
  message: string,
  context?: CommandError["context"]
): CommandFailure {
  return {
    success: false,
    error: { code, message, context },
  };
}

/**
 * Helper to create success results
 */
export function createSuccess<T = void>(data?: T): CommandSuccess<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Validation result for pre-checks (doesn't mutate state)
 */
export interface ValidationResult {
  valid: boolean;
  error?: CommandError;
}

/**
 * Validates if a card can be afforded by the player
 */
export function validateMomentumCost(
  playerMomentum: number,
  cardCost: number,
  cardName: string,
  cardId: string
): ValidationResult {
  if (playerMomentum < cardCost) {
    return {
      valid: false,
      error: {
        code: CommandErrorCode.INSUFFICIENT_MOMENTUM,
        message: `Not enough momentum to play ${cardName}. Need ${cardCost}, have ${playerMomentum}.`,
        context: {
          required: cardCost,
          available: playerMomentum,
          cardId,
          cardName,
          cost: cardCost,
        },
      },
    };
  }
  return { valid: true };
}
