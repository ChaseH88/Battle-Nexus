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
          <ModalButton buttonType="confirm" onClick={onConfirm}>
            Yes
          </ModalButton>
          <ModalButton buttonType="cancel" onClick={onCancel}>
            No
          </ModalButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};
