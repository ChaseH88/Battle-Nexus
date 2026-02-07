import { PlayerState } from "../../../battle/PlayerState";
import { GameState } from "../../../battle/GameState";
import { SupportZone, SupportZoneProps } from "./SupportZone";
import { CreatureZone, CreatureZoneProps } from "./CreatureZone";
import { useMemo } from "react";
import { PlayerBoardContainer, DeckArea } from "./PlayerBoard.styled";
import { Player } from "./Player";
import { DeckDisplay } from "../DeckDisplay";
import { DiscardDisplay } from "../DiscardDisplay";
import { Box } from "@mui/material";

interface PlayerBoardProps
  extends
    Pick<SupportZoneProps, "onActivateSupport" | "onPlaySupport">,
    Pick<
      CreatureZoneProps,
      | "onPlayCreature"
      | "onSelectAttacker"
      | "onAttack"
      | "onToggleMode"
      | "onFlipFaceUp"
      | "onActivateCreatureEffect"
      | "draggedCardId"
      | "onSetAttackerRef"
    > {
  player: PlayerState;
  gameState?: GameState; // For checking effect activation requirements
  currentPlayerState?: PlayerState; // Pass to CreatureZone for checking attacker mode
  lifePoints: number;
  isOpponent?: boolean;
  isFirstTurn?: boolean;
  selectedHandCard?: string | null;
  selectedAttacker?: number | null;
  onCreatureDoubleClick?: (lane: number) => void;
  onSupportDoubleClick?: (slot: number) => void;
  showPlayButtons?: boolean; // Show "Play Here" buttons for accessibility
  deckSize?: number; // Number of cards remaining in deck
}

export const PlayerBoard = ({
  player,
  gameState,
  currentPlayerState,
  lifePoints,
  isOpponent = false,
  isFirstTurn = false,
  selectedHandCard,
  selectedAttacker,
  onPlayCreature,
  onPlaySupport,
  onActivateSupport,
  onActivateCreatureEffect,
  onSelectAttacker,
  onAttack,
  onToggleMode,
  onFlipFaceUp,
  onCreatureDoubleClick,
  onSupportDoubleClick,
  draggedCardId,
  onSetAttackerRef,
  showPlayButtons = false,
  deckSize,
}: PlayerBoardProps) => {
  const SupportZoneComponent = useMemo(
    () => (
      <SupportZone
        player={player}
        selectedHandCard={selectedHandCard ?? null}
        onActivateSupport={onActivateSupport}
        onPlaySupport={onPlaySupport}
        isOpponent={isOpponent}
        onCardDoubleClick={onSupportDoubleClick}
        draggedCardId={draggedCardId}
        showPlayButtons={showPlayButtons}
      />
    ),
    [
      player,
      selectedHandCard,
      onActivateSupport,
      onPlaySupport,
      isOpponent,
      onSupportDoubleClick,
      draggedCardId,
      showPlayButtons,
    ],
  );

  const DiscardDisplayComponent = useMemo(
    () => (
      <DiscardDisplay
        discardPile={player.discardPile}
        playerIndex={isOpponent ? 1 : 0}
      />
    ),
    [player.discardPile, isOpponent],
  );

  return (
    <PlayerBoardContainer
      isTurn={gameState?.activePlayer === (isOpponent ? 1 : 0)}
    >
      <Player player={player} lifePoints={lifePoints} isOpponent={isOpponent} />
      {isOpponent && SupportZoneComponent}
      <CreatureZone
        player={player}
        gameState={gameState}
        currentPlayerState={currentPlayerState}
        selectedHandCard={selectedHandCard}
        selectedAttacker={selectedAttacker}
        isOpponent={isOpponent}
        isFirstTurn={isFirstTurn}
        playerIndex={isOpponent ? 1 : 0}
        onPlayCreature={onPlayCreature}
        onSelectAttacker={onSelectAttacker}
        onAttack={onAttack}
        onToggleMode={onToggleMode}
        onFlipFaceUp={onFlipFaceUp}
        onCardDoubleClick={onCreatureDoubleClick}
        onActivateCreatureEffect={onActivateCreatureEffect}
        draggedCardId={draggedCardId}
        showPlayButtons={showPlayButtons}
        onSetAttackerRef={onSetAttackerRef}
      />
      <Box
        className="side-area"
        sx={{
          position: "absolute",
          right: isOpponent ? "auto" : 0,
          border: "3px dashed rgba(255, 255, 255, 0.25)",
          borderRadius: "10px",
          ...(isOpponent
            ? { left: "50px", bottom: "50%", transform: "translateY(50%)" }
            : { right: "50px", top: "50%", transform: "translateY(-50%)" }),
        }}
      >
        <DeckArea>
          {!isOpponent && DiscardDisplayComponent}
          <DeckDisplay deckSize={deckSize || 0} />
          {isOpponent && DiscardDisplayComponent}
        </DeckArea>
      </Box>
      {!isOpponent && SupportZoneComponent}
    </PlayerBoardContainer>
  );
};
