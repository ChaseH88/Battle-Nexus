import {
  ModalOverlay,
  PlayCreatureModalContent,
  ModalTitle,
  ModalMessage,
  PlayOptions,
  PlayOptionGroup,
} from "./PlayCreatureModal.styled";
import { CardInterface } from "../../../cards/types";
import { Card } from "../Card/Card";
import { Box } from "@mui/material";
import { GameButton } from "../../Common/Button";

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
            <Box
              sx={{ pointerEvents: "none" }}
              display="flex"
              flexDirection="column"
              alignItems="center"
            >
              <Card
                card={{ ...card, mode: "ATTACK", isFaceDown: false } as any}
                isSelected={false}
                showFaceDown={false}
                canActivate={false}
                playerIndex={0}
                activeEffects={[]}
              />
            </Box>
          </PlayOptionGroup>

          <PlayOptionGroup
            onClick={onPlayFaceDownDefense}
            style={{ cursor: "pointer" }}
          >
            <Box sx={{ pointerEvents: "none" }}>
              <Card
                card={{ ...card, mode: "DEFENSE", isFaceDown: true } as any}
                isSelected={false}
                showFaceDown={true}
                canActivate={false}
                playerIndex={0}
                activeEffects={[]}
              />
            </Box>
          </PlayOptionGroup>
        </PlayOptions>

        <Box display="flex" justifyContent="flex-end">
          <GameButton variant="ghost" size="medium" onClick={onCancel}>
            Cancel
          </GameButton>
        </Box>
      </PlayCreatureModalContent>
    </ModalOverlay>
  );
};
