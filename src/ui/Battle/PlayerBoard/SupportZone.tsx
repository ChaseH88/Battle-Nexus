import {
  ActionCard,
  CardInterface,
  CardType,
  SupportCard,
} from "../../../cards";
import { PlayerState } from "../../../battle/PlayerState";
import { Card } from "../Card";

export interface SupportZoneProps {
  player: PlayerState;
  selectedHandCard?: string | null;
  onActivateSupport?: (slot: number) => void;
  onPlaySupport?: (slot: number, activate: boolean) => void;
  isOpponent?: boolean;
}

export const SupportZone = ({
  player,
  selectedHandCard,
  onActivateSupport,
  onPlaySupport,
  isOpponent = false,
}: SupportZoneProps) => (
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
);
