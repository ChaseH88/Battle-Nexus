import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalMessage,
  ModalActions,
  ModalButton,
} from "./styled";

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
          <ModalButton
            $buttonType="confirm"
            onClick={onConfirm}
            sx={{
              fontSize: "1rem",
              padding: ".5em .2em",
              minWidth: "5em",
            }}
          >
            Yes
          </ModalButton>
          <ModalButton
            $buttonType="cancel"
            onClick={onCancel}
            sx={{
              fontSize: "1rem",
              padding: ".5em .2em",
              minWidth: "5em",
            }}
          >
            No
          </ModalButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};
