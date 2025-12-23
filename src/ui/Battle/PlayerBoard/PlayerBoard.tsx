import { PlayerState } from "../../../battle/PlayerState";
import { DiscardPile } from "./DiscardPile";
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
    > {
  player: PlayerState;
  currentPlayerState?: PlayerState; // Pass to CreatureZone for checking attacker mode
  koCount: number;
  isOpponent?: boolean;
  isFirstTurn?: boolean;
  selectedHandCard?: string | null;
  selectedAttacker?: number | null;
  onCreatureDoubleClick?: (lane: number) => void;
  onSupportDoubleClick?: (slot: number) => void;
}

export const PlayerBoard = ({
  player,
  currentPlayerState,
  koCount,
  isOpponent = false,
  isFirstTurn = false,
  selectedHandCard,
  selectedAttacker,
  onPlayCreature,
  onPlaySupport,
  onActivateSupport,
  onSelectAttacker,
  onAttack,
  onToggleMode,
  onFlipFaceUp,
  onCreatureDoubleClick,
  onSupportDoubleClick,
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
      />
    ),
    [
      player,
      selectedHandCard,
      onActivateSupport,
      onPlaySupport,
      isOpponent,
      onSupportDoubleClick,
    ]
  );

  return (
    <PlayerBoardContainer isopponent={isOpponent ? "true" : "false"}>
      <PlayerInfo>
        <PlayerName variant="h3">{player.id}</PlayerName>
        <PlayerStat
          className="kos"
          data-testid={isOpponent ? "opponent-ko-count" : "player-ko-count"}
        >
          KOs: {koCount}/3
        </PlayerStat>
        <PlayerStat>Deck: {player.deck.length}</PlayerStat>
        {isOpponent && <PlayerStat>Hand: {player.hand.length}</PlayerStat>}
        <DiscardPile cards={player.discardPile} />
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
      />
      {!isOpponent && SupportZoneComponent}
    </PlayerBoardContainer>
  );
};
