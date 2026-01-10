import { EffectContext } from "../handler";

/**
 * Quick Assessment
 * Draw 1 card. If you control no creatures, draw 2 instead.
 */
export function quick_assessment(context: EffectContext): void {
  const { state, ownerIndex } = context;
  const player = state.players[ownerIndex];

  // Check if player controls any creatures
  const hasCreatures = player.lanes.some((lane) => lane !== null);

  // Draw 1 card normally, or 2 if no creatures
  const drawCount = hasCreatures ? 1 : 2;

  for (let i = 0; i < drawCount; i++) {
    if (player.deck.length > 0) {
      const card = player.deck.shift()!;
      player.hand.push(card);
    }
  }

  context.utils.log(
    `Quick Assessment: ${player.id} drew ${drawCount} card${
      drawCount > 1 ? "s" : ""
    }`
  );
}
