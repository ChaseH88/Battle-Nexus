import { PlayerState } from "../../../battle/PlayerState";
import { GameState } from "../../../battle/GameState";
import { SupportZone, SupportZoneProps } from "./SupportZone";
import { CreatureZone, CreatureZoneProps } from "./CreatureZone";
import { useMemo, useCallback } from "react";
import { PlayerBoardContainer, DeckArea } from "./PlayerBoard.styled";
import { Player } from "./Player";
import { DeckDisplay } from "../DeckDisplay";
import { DiscardDisplay } from "../DiscardDisplay";
import { PlayerActiveEffects } from "../PlayerActiveEffects";
import { Box } from "@mui/material";
import { useAppDispatch } from "../../../store/hooks";
import { openDiscardPileModal } from "../../../store/uiSlice";

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
  onDraw?: () => void; // Callback for drawing a card
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
  onDraw,
}: PlayerBoardProps) => {
  const dispatch = useAppDispatch();

  const handleDiscardClick = useCallback(() => {
    dispatch(
      openDiscardPileModal({
        discardPile: player.discardPile,
        playerIndex: isOpponent ? 1 : 0,
        playerName: player.id,
      }),
    );
  }, [dispatch, player.discardPile, player.id, isOpponent]);

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
        onDiscardClick={handleDiscardClick}
      />
    ),
    [player.discardPile, isOpponent, handleDiscardClick],
  );

  const ActiveEffectsComponent = useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () =>
      gameState?.activeEffects ? (
        <PlayerActiveEffects
          playerIndex={isOpponent ? 1 : 0}
          activeEffects={gameState.activeEffects}
        />
      ) : null,
    [gameState?.activeEffects, isOpponent],
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
        className="side-area deck-discard"
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
          <DeckDisplay
            deckSize={deckSize || 0}
            onDraw={onDraw}
            canDraw={
              !isOpponent &&
              gameState?.phase === "DRAW" &&
              gameState?.activePlayer === 0
            }
            isDrawPhase={gameState?.phase === "DRAW"}
            isOpponent={isOpponent}
          />
          {isOpponent && DiscardDisplayComponent}
        </DeckArea>
      </Box>
      <Box
        className="side-area active-effects"
        sx={{
          position: "absolute",
          left: isOpponent ? "auto" : 0,
          border: "3px dashed rgba(139, 92, 246, 0.25)",
          borderRadius: "10px",
          ...(isOpponent
            ? { right: "50px", bottom: "50%", transform: "translateY(50%)" }
            : { left: "50px", top: "50%", transform: "translateY(-50%)" }),
        }}
      >
        {ActiveEffectsComponent}
      </Box>
      {!isOpponent && SupportZoneComponent}
    </PlayerBoardContainer>
  );
};
