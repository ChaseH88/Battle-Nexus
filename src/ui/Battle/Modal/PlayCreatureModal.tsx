import {
  ModalOverlayStyled,
  PlayCreatureModalContentStyled,
  ModalTitleStyled,
  ModalMessageStyled,
  PlayOptionsStyled,
  PlayOptionGroupStyled,
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
    <ModalOverlayStyled onClick={onCancel}>
      <PlayCreatureModalContentStyled
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <ModalTitleStyled>Play {card.name}</ModalTitleStyled>
        <ModalMessageStyled>
          Choose how to play this creature:
        </ModalMessageStyled>

        <PlayOptionsStyled>
          <PlayOptionGroupStyled
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
          </PlayOptionGroupStyled>

          <PlayOptionGroupStyled
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
          </PlayOptionGroupStyled>
        </PlayOptionsStyled>

        <Box display="flex" justifyContent="flex-end">
          <GameButton variant="ghost" size="medium" onClick={onCancel}>
            Cancel
          </GameButton>
        </Box>
      </PlayCreatureModalContentStyled>
    </ModalOverlayStyled>
  );
};
