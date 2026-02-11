import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalMessage,
  ModalActions,
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
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{title}</ModalTitle>
        <ModalMessage>{message}</ModalMessage>
        <ModalActions>
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
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};
