import { PlayerState } from "../../../battle/PlayerState";
import { SupportZone, SupportZoneProps } from "./SupportZone";
import { CreatureZone, CreatureZoneProps } from "./CreatureZone";
import { useMemo } from "react";
import { PlayerBoardContainer } from "./PlayerBoard.styled";
import { Player } from "./Player";

interface PlayerBoardProps
  extends Pick<SupportZoneProps, "onActivateSupport" | "onPlaySupport">,
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
  currentPlayerState?: PlayerState; // Pass to CreatureZone for checking attacker mode
  lifePoints: number;
  isOpponent?: boolean;
  isFirstTurn?: boolean;
  selectedHandCard?: string | null;
  selectedAttacker?: number | null;
  onCreatureDoubleClick?: (lane: number) => void;
  onSupportDoubleClick?: (slot: number) => void;
  showPlayButtons?: boolean; // Show "Play Here" buttons for accessibility
}

export const PlayerBoard = ({
  player,
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
    ]
  );

  return (
    <PlayerBoardContainer isopponent={isOpponent ? "true" : "false"}>
      <Player player={player} lifePoints={lifePoints} isOpponent={isOpponent} />
      {isOpponent && SupportZoneComponent}
      <CreatureZone
        player={player}
        currentPlayerState={currentPlayerState}
        selectedHandCard={selectedHandCard}
        selectedAttacker={selectedAttacker}
        isOpponent={isOpponent}
        isFirstTurn={isFirstTurn}
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
      {!isOpponent && SupportZoneComponent}
    </PlayerBoardContainer>
  );
};
