import { PlayerState } from "../../../battle/PlayerState";
import { DiscardPile } from "./DiscardPile";
import { MaxDeck } from "./MaxDeck";
import { SupportZone, SupportZoneProps } from "./SupportZone";
import { CreatureZone, CreatureZoneProps } from "./CreatureZone";
import { useMemo } from "react";
import {
  PlayerBoardContainer,
  PlayerInfo,
  PlayerName,
  PlayerStat,
} from "./PlayerBoard.styled";

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
      <PlayerInfo>
        <PlayerName variant="h3">{player.id}</PlayerName>
        <PlayerStat
          className="life-points"
          data-testid={
            isOpponent ? "opponent-life-points" : "player-life-points"
          }
          style={{
            color:
              lifePoints <= 500
                ? "#fc8181"
                : lifePoints <= 1000
                ? "#f6ad55"
                : "#68d391",
            fontWeight: "bold",
          }}
        >
          LP: {lifePoints > 0 ? lifePoints : 0}
        </PlayerStat>
        <PlayerStat
          className="momentum"
          data-testid={isOpponent ? "opponent-momentum" : "player-momentum"}
          style={{
            color: "#60a5fa",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
          ⚡ {player.momentum}/10
        </PlayerStat>
        <PlayerStat>Deck: {player.deck.length}</PlayerStat>
        {isOpponent && <PlayerStat>Hand: {player.hand.length}</PlayerStat>}
        <DiscardPile cards={player.discardPile} />
        <MaxDeck cards={player.maxDeck} playerMomentum={player.momentum} />
      </PlayerInfo>
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
      />
      {!isOpponent && SupportZoneComponent}
    </PlayerBoardContainer>
  );
};
