import {
  ActionCard,
  CardInterface,
  CardType,
  SupportCard,
} from "../../../cards";
import { PlayerState } from "../../../battle/PlayerState";
import { Card } from "../Card";
import {
  SupportZoneContainer,
  SupportZoneTitle,
  SupportSlots,
  SupportSlot,
  SupportActions,
  FaceDownButton,
  ActivateButton,
} from "./SupportZone.styled";

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
  <SupportZoneContainer>
    <SupportZoneTitle>
      {isOpponent ? "Support" : "Your Support"}
    </SupportZoneTitle>
    <SupportSlots>
      {player.support.map((card, i) => (
        <SupportSlot key={i}>
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
                <SupportActions>
                  <FaceDownButton onClick={() => onPlaySupport(i, false)}>
                    Set Face-Down
                  </FaceDownButton>
                  <ActivateButton onClick={() => onPlaySupport(i, true)}>
                    Activate
                  </ActivateButton>
                </SupportActions>
              ) : null;
            })()}
        </SupportSlot>
      ))}
    </SupportSlots>
  </SupportZoneContainer>
);
