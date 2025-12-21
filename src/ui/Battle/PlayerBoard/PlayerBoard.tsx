import { PlayerState } from "../../../battle/PlayerState";
import { DiscardPile } from "./DiscardPile";
import { SupportZone, SupportZoneProps } from "./SupportZone";
import { CreatureZone, CreatureZoneProps } from "./CreatureZone";
import { useMemo } from "react";

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
  koCount: number;
  isOpponent?: boolean;
  isFirstTurn?: boolean;
  selectedHandCard?: string | null;
  selectedAttacker?: number | null;
}

export const PlayerBoard = ({
  player,
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
}: PlayerBoardProps) => {
  const SupportZoneComponent = useMemo(
    () => (
      <SupportZone
        player={player}
        selectedHandCard={selectedHandCard}
        onActivateSupport={onActivateSupport}
        onPlaySupport={onPlaySupport}
        isOpponent={isOpponent}
      />
    ),
    [player, selectedHandCard, onActivateSupport, onPlaySupport, isOpponent]
  );

  return (
    <div className={`player-board ${isOpponent ? "opponent" : "current"}`}>
      <div className="player-info">
        <h3>{player.id}</h3>
        <div className="kos">KOs: {koCount}/3</div>
        <div className="deck">Deck: {player.deck.length}</div>
        {isOpponent && <div className="hand">Hand: {player.hand.length}</div>}
        <DiscardPile cards={player.discardPile} />
      </div>
      {isOpponent && SupportZoneComponent}
      <CreatureZone
        player={player}
        selectedHandCard={selectedHandCard}
        selectedAttacker={selectedAttacker}
        isOpponent={isOpponent}
        isFirstTurn={isFirstTurn}
        onPlayCreature={onPlayCreature}
        onSelectAttacker={onSelectAttacker}
        onAttack={onAttack}
        onToggleMode={onToggleMode}
        onFlipFaceUp={onFlipFaceUp}
      />
      {!isOpponent && SupportZoneComponent}
    </div>
  );
};
