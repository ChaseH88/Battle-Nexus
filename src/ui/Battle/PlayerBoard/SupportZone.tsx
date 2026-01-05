import { ActionCard, CardType, SupportCard, TrapCard } from "../../../cards";
import { PlayerState } from "../../../battle/PlayerState";
import { Card } from "../Card";
import { motion } from "framer-motion";
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
  draggedCardId?: string | null;
  showPlayButtons?: boolean; // Show "Set Face-Down" buttons for accessibility
}

export const SupportZone = ({
  player,
  selectedHandCard,
  onActivateSupport,
  onPlaySupport,
  isOpponent = false,
  onCardDoubleClick,
  draggedCardId,
  showPlayButtons = false,
}: SupportZoneProps) => {
  return (
    <SupportZoneContainer>
      <SupportZoneTitle>
        {isOpponent ? "Support" : "Your Support"}
      </SupportZoneTitle>
      <SupportSlots>
        {player.support.map((card, i) => {
          const draggedCard = draggedCardId
            ? player.hand.find((c) => c.id === draggedCardId)
            : null;
          const isDropTarget =
            !isOpponent &&
            draggedCardId &&
            !card &&
            draggedCard &&
            (draggedCard.type === CardType.Support ||
              draggedCard.type === CardType.Action ||
              draggedCard.type === CardType.Trap);

          return (
            <motion.div
              key={i}
              data-drop-support={isDropTarget ? i : undefined}
              animate={{
                scale: isDropTarget ? 1.05 : 1,
                backgroundColor: isDropTarget
                  ? "rgba(147, 51, 234, 0.2)"
                  : "transparent",
              }}
              transition={{ duration: 0.2 }}
              style={{
                border: isDropTarget ? "2px dashed #9333ea" : undefined,
                borderRadius: "8px",
              }}
            >
              <SupportSlot
                data-testid={`support-slot-${i}`}
                data-drop-support={isDropTarget ? i : undefined}
              >
                <div
                  data-drop-support={isDropTarget ? i : undefined}
                  onDragStart={(e) => e.preventDefault()}
                  draggable={false}
                >
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
                      card && onCardDoubleClick
                        ? () => onCardDoubleClick(i)
                        : undefined
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
                </div>
                {showPlayButtons &&
                  !isOpponent &&
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
            </motion.div>
          );
        })}
      </SupportSlots>
    </SupportZoneContainer>
  );
};
