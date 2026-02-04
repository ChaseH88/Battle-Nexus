import { CardType, ActionCard, TrapCard } from "../../../cards";
import { PlayerState } from "../../../battle/PlayerState";
import { Card } from "../Card";
import { motion } from "framer-motion";
import { ZoneContainer, Lanes, Lane, FaceDownButton } from "./Zone.styles";
import { SupportZoneTitle, SupportActions } from "./SupportZone.styled";
import { useRef } from "react";

export interface SupportZoneProps {
  player: PlayerState;
  selectedHandCard: string | null;
  onActivateSupport?: (slot: number, element: HTMLElement) => void;
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
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <ZoneContainer>
      <SupportZoneTitle />
      <Lanes>
        {player.support.map((card, i) => {
          const draggedCard = draggedCardId
            ? player.hand.find((c) => c.id === draggedCardId)
            : null;
          const isDropTarget =
            !isOpponent &&
            draggedCardId &&
            !card &&
            draggedCard &&
            (draggedCard.type === CardType.Action ||
              draggedCard.type === CardType.Trap);

          return (
            <Lane
              as={motion.div}
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
              <div
                data-testid={`support-slot-${i}`}
                data-drop-support={isDropTarget ? i : undefined}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
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
                              card.type === CardType.Action ||
                              card.type === CardType.Trap
                            ) {
                              const spellCard = card as ActionCard | TrapCard;
                              if (!spellCard.isActive && onActivateSupport) {
                                const element = cardRefs.current[i];
                                if (element) {
                                  onActivateSupport(i, element);
                                }
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
                      (card.type === CardType.Action ||
                        card.type === CardType.Trap) &&
                      (card.isFaceDown ||
                        !(card as ActionCard | TrapCard).isActive)
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
                      (c) => c.id === selectedHandCard,
                    );
                    return handCard?.type === CardType.Action ||
                      handCard?.type === CardType.Trap ? (
                      <SupportActions>
                        <FaceDownButton onClick={() => onPlaySupport(i)}>
                          Set Face-Down
                        </FaceDownButton>
                      </SupportActions>
                    ) : null;
                  })()}
              </div>
            </Lane>
          );
        })}
      </Lanes>
    </ZoneContainer>
  );
};
