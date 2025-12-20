import { PlayerState } from "../../../battle/PlayerState";
import { CardInterface, CardType } from "../../../cards/types";
import { CreatureCard } from "../../../cards/CreatureCard";
import { SupportCard } from "../../../cards/SupportCard";
import { ActionCard } from "../../../cards/ActionCard";
import { Card } from "../Card";

interface PlayerBoardProps {
  player: PlayerState;
  koCount: number;
  isOpponent?: boolean;
  isFirstTurn?: boolean;
  selectedHandCard?: string | null;
  selectedAttacker?: number | null;
  onPlayCreature?: (lane: number, faceDown: boolean) => void;
  onPlaySupport?: (slot: number, activate: boolean) => void;
  onActivateSupport?: (slot: number) => void;
  onSelectAttacker?: (lane: number) => void;
  onAttack?: (targetLane: number) => void;
  onToggleMode?: (lane: number) => void;
  onFlipFaceUp?: (lane: number) => void;
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
  return (
    <div className={`player-board ${isOpponent ? "opponent" : "current"}`}>
      <div className="player-info">
        <h3>{player.id}</h3>
        <div className="kos">KOs: {koCount}/3</div>
        <div className="deck">Deck: {player.deck.length}</div>
        {isOpponent && <div className="hand">Hand: {player.hand.length}</div>}
        <div className="graveyard-display">
          <h4>Graveyard ({player.graveyard.length})</h4>
          <div className="graveyard-cards">
            {player.graveyard.slice(-3).map((card, i) => (
              <div key={i} className="graveyard-card-mini">
                {card.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="support-zone">
        <h4>{isOpponent ? "Support" : "Your Support"}</h4>
        <div className="support-slots">
          {player.support.map((card, i) => (
            <div key={i} className="support-slot">
              <Card
                card={card}
                onClick={
                  !isOpponent && card
                    ? () => {
                        if (
                          card.type === CardType.Support ||
                          card.type === CardType.Action
                        ) {
                          const spellCard = card as SupportCard | ActionCard;
                          if (!spellCard.isActive && onActivateSupport) {
                            onActivateSupport(i);
                          }
                        }
                      }
                    : undefined
                }
                showFaceDown={isOpponent}
              />
              {!isOpponent &&
                !card &&
                selectedHandCard &&
                onPlaySupport &&
                (() => {
                  const handCard = player.hand.find(
                    (c) => c.id === selectedHandCard
                  );
                  return handCard?.type === CardType.Support ||
                    handCard?.type === CardType.Action ? (
                    <div className="support-actions">
                      <button
                        className="play-here face-down-btn"
                        onClick={() => onPlaySupport(i, false)}
                      >
                        Set Face-Down
                      </button>
                      <button
                        className="play-here activate-btn"
                        onClick={() => onPlaySupport(i, true)}
                      >
                        Activate
                      </button>
                    </div>
                  ) : null;
                })()}
            </div>
          ))}
        </div>
      </div>

      <div className="creature-zone">
        <h4>{isOpponent ? "Creatures" : "Your Creatures"}</h4>
        <div className="lanes">
          {player.lanes.map((card, i) => (
            <div key={i} className="lane">
              <div className="lane-label">Lane {i}</div>
              <Card
                card={card}
                onClick={
                  !isOpponent && card && !isFirstTurn && onSelectAttacker
                    ? () => onSelectAttacker(i)
                    : undefined
                }
                isSelected={!isOpponent && selectedAttacker === i}
                showFaceDown={isOpponent}
                selectedHandCard={selectedHandCard}
              />

              {/* Opponent attack buttons */}
              {isOpponent && selectedAttacker !== null && onAttack && (
                <button
                  className="attack-here"
                  onClick={() => onAttack(i)}
                  disabled={isFirstTurn}
                >
                  {isFirstTurn
                    ? "Cannot Attack (Turn 1)"
                    : `Attack ${card ? "Creature" : "Directly"}`}
                </button>
              )}

              {/* Current player creature controls */}
              {!isOpponent && card && card.type === CardType.Creature && (
                <>
                  {onToggleMode && (
                    <button
                      className="toggle-mode-btn"
                      onClick={() => onToggleMode(i)}
                    >
                      Switch Mode
                    </button>
                  )}
                  {onFlipFaceUp && (card as CreatureCard).isFaceDown && (
                    <button
                      className="flip-btn"
                      onClick={() => onFlipFaceUp(i)}
                    >
                      Flip Face-Up
                    </button>
                  )}
                </>
              )}

              {/* Current player creature placement buttons */}
              {!isOpponent &&
                !card &&
                selectedHandCard &&
                onPlayCreature &&
                (() => {
                  const handCard = player.hand.find(
                    (c) => c.id === selectedHandCard
                  );
                  return handCard?.type === CardType.Creature ? (
                    <div className="creature-play-actions">
                      <button
                        className="play-here face-up-btn"
                        onClick={() => onPlayCreature(i, false)}
                      >
                        Play Face-Up
                      </button>
                      <button
                        className="play-here face-down-btn"
                        onClick={() => onPlayCreature(i, true)}
                      >
                        Set Face-Down
                      </button>
                    </div>
                  ) : null;
                })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
