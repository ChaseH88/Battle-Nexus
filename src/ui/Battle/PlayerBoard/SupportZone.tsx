import { ActionCard, CardType, SupportCard, TrapCard } from "../../../cards";
import { PlayerState } from "../../../battle/PlayerState";
import { Card } from "../Card";
import {
  SupportZoneContainer,
  SupportZoneTitle,
  SupportSlots,
  SupportSlot,
  SupportActions,
  FaceDownButton,
} from "./SupportZone.styled";

export interface SupportZoneProps {
  player: PlayerState;
  selectedHandCard: string | null;
  onActivateSupport?: (slot: number) => void;
  onPlaySupport?: (slot: number) => void;
  isOpponent?: boolean;
  onCardDoubleClick?: (slot: number) => void;
}

export const SupportZone = ({
  player,
  selectedHandCard,
  onActivateSupport,
  onPlaySupport,
  isOpponent = false,
  onCardDoubleClick,
}: SupportZoneProps) => (
  <SupportZoneContainer>
    <SupportZoneTitle>
      {isOpponent ? "Support" : "Your Support"}
    </SupportZoneTitle>
    <SupportSlots>
      {player.support.map((card, i) => (
        <SupportSlot key={i} data-testid={`support-slot-${i}`}>
          <Card
            card={card}
            onClick={
              !isOpponent && card
                ? () => {
                    if (
                      card.type === CardType.Support ||
                      card.type === CardType.Action ||
                      card.type === CardType.Trap
                    ) {
                      const spellCard = card as
                        | SupportCard
                        | ActionCard
                        | TrapCard;
                      if (!spellCard.isActive && onActivateSupport) {
                        onActivateSupport(i);
                      }
                    }
                  }
                : undefined
            }
            onDoubleClick={
              card && onCardDoubleClick ? () => onCardDoubleClick(i) : undefined
            }
            showFaceDown={isOpponent}
            canActivate={
              !isOpponent &&
              card !== null &&
              (card.type === CardType.Support ||
                card.type === CardType.Action ||
                card.type === CardType.Trap) &&
              (card.isFaceDown ||
                !(card as SupportCard | ActionCard | TrapCard).isActive)
            }
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
                handCard?.type === CardType.Action ||
                handCard?.type === CardType.Trap ? (
                <SupportActions>
                  <FaceDownButton onClick={() => onPlaySupport(i)}>
                    Set Face-Down
                  </FaceDownButton>
                </SupportActions>
              ) : null;
            })()}
        </SupportSlot>
      ))}
    </SupportSlots>
  </SupportZoneContainer>
);
