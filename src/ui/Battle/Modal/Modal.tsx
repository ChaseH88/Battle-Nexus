import {
  ModalOverlayStyled,
  ModalContentStyled,
  ModalTitleStyled,
  ModalMessageStyled,
  ModalActionsStyled,
} from "./styled";
import { GameButton } from "../../Common/Button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const Modal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <ModalOverlayStyled onClick={onCancel}>
      <ModalContentStyled onClick={(e) => e.stopPropagation()}>
        <ModalTitleStyled>{title}</ModalTitleStyled>
        <ModalMessageStyled>{message}</ModalMessageStyled>
        <ModalActionsStyled>
          <GameButton
            variant="success"
            size="medium"
            onClick={onConfirm}
            sx={{
              fontSize: "1rem",
              padding: ".5em 1.5em",
              minWidth: "5em",
            }}
          >
            Yes
          </GameButton>
          <GameButton
            variant="danger"
            size="medium"
            onClick={onCancel}
            sx={{
              fontSize: "1rem",
              padding: ".5em 1.5em",
              minWidth: "5em",
            }}
          >
            No
          </GameButton>
        </ModalActionsStyled>
      </ModalContentStyled>
    </ModalOverlayStyled>
  );
};
