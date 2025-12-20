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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="modal-button confirm" onClick={onConfirm}>
            Yes
          </button>
          <button className="modal-button cancel" onClick={onCancel}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};
