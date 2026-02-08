import {
  ModalOverlay,
  PlayCreatureModalContent,
  ModalTitle,
  ModalMessage,
  PlayOptions,
  PlayOptionGroup,
  PlayOptionTitle,
  CancelButton,
} from "./PlayCreatureModal.styled";
import { CardInterface } from "../../../cards/types";
import { Card } from "../Card/Card";

interface PlayCreatureModalProps {
  isOpen: boolean;
  card: CardInterface | null;
  onPlayFaceUpAttack: () => void;
  onPlayFaceDownDefense: () => void;
  onCancel: () => void;
}

export const PlayCreatureModal = ({
  isOpen,
  card,
  onPlayFaceUpAttack,
  onPlayFaceDownDefense,
  onCancel,
}: PlayCreatureModalProps) => {
  if (!isOpen || !card) return null;

  return (
    <ModalOverlay onClick={onCancel}>
      <PlayCreatureModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Play {card.name}</ModalTitle>
        <ModalMessage>Choose how to play this creature:</ModalMessage>

        <PlayOptions>
          <PlayOptionGroup
            onClick={onPlayFaceUpAttack}
            style={{ cursor: "pointer" }}
          >
            <PlayOptionTitle>Face-Up Attack Mode</PlayOptionTitle>
            <div style={{ pointerEvents: "none" }}>
              <Card
                card={{ ...card, mode: "ATTACK", isFaceDown: false } as any}
                isSelected={false}
                showFaceDown={false}
                canActivate={false}
                playerIndex={0}
                activeEffects={[]}
              />
            </div>
          </PlayOptionGroup>

          <PlayOptionGroup
            onClick={onPlayFaceDownDefense}
            style={{ cursor: "pointer" }}
          >
            <PlayOptionTitle>Face-Down Defense Mode</PlayOptionTitle>
            <div style={{ pointerEvents: "none" }}>
              <Card
                card={{ ...card, mode: "DEFENSE", isFaceDown: true } as any}
                isSelected={false}
                showFaceDown={true}
                canActivate={false}
                playerIndex={0}
                activeEffects={[]}
              />
            </div>
          </PlayOptionGroup>
        </PlayOptions>

        <CancelButton onClick={onCancel}>Cancel</CancelButton>
      </PlayCreatureModalContent>
    </ModalOverlay>
  );
};
