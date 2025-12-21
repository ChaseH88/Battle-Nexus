import {
  ModalOverlay,
  PlayCreatureModalContent,
  ModalTitle,
  ModalMessage,
  PlayOptions,
  PlayOptionGroup,
  PlayOptionTitle,
  PlayOptionButton,
  CancelButton,
} from "./PlayCreatureModal.styled";

interface PlayCreatureModalProps {
  isOpen: boolean;
  creatureName: string;
  onPlayFaceUpAttack: () => void;
  onPlayFaceUpDefense: () => void;
  onPlayFaceDownAttack: () => void;
  onPlayFaceDownDefense: () => void;
  onCancel: () => void;
}

export const PlayCreatureModal = ({
  isOpen,
  creatureName,
  onPlayFaceUpAttack,
  onPlayFaceUpDefense,
  onPlayFaceDownAttack,
  onPlayFaceDownDefense,
  onCancel,
}: PlayCreatureModalProps) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onCancel}>
      <PlayCreatureModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Play {creatureName}</ModalTitle>
        <ModalMessage>Choose how to play this creature:</ModalMessage>

        <PlayOptions>
          <PlayOptionGroup>
            <PlayOptionTitle>Face-Up</PlayOptionTitle>
            <PlayOptionButton mode="attack" onClick={onPlayFaceUpAttack}>
              Attack Mode
            </PlayOptionButton>
            <PlayOptionButton mode="defense" onClick={onPlayFaceUpDefense}>
              Defense Mode
            </PlayOptionButton>
          </PlayOptionGroup>

          <PlayOptionGroup>
            <PlayOptionTitle>Face-Down</PlayOptionTitle>
            <PlayOptionButton mode="attack" onClick={onPlayFaceDownAttack}>
              Attack Mode
            </PlayOptionButton>
            <PlayOptionButton mode="defense" onClick={onPlayFaceDownDefense}>
              Defense Mode
            </PlayOptionButton>
          </PlayOptionGroup>
        </PlayOptions>

        <CancelButton onClick={onCancel}>Cancel</CancelButton>
      </PlayCreatureModalContent>
    </ModalOverlay>
  );
};
