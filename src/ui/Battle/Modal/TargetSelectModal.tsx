import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { closeTargetSelectModal } from "../../../store/uiSlice";
import { ModalOverlay, ModalContent, ModalTitle, ModalMessage } from "./styled";

export const TargetSelectModal = () => {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((s) => s.ui.targetSelectModal);

  if (!modal.isOpen) return null;

  const onCancel = () => dispatch(closeTargetSelectModal());

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{modal.title}</ModalTitle>
        {modal.message && <ModalMessage>{modal.message}</ModalMessage>}

        <div style={{ margin: "12px 0", display: "grid", gap: 12 }}>
          {modal.options.map((opt, i) => (
            <div
              key={i}
              onClick={() => {
                // Immediately confirm on click so player selects target by clicking the card
                if (modal?.onConfirm) modal.onConfirm(opt.value);
                dispatch(closeTargetSelectModal());
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 8,
                borderRadius: 8,
                background: "rgba(255,255,255,0.02)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 80,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "#e2e8f0",
                }}
              >
                {opt.label}
              </div>
              <div style={{ color: "#e2e8f0" }}>{opt.label}</div>
            </div>
          ))}
        </div>
      </ModalContent>
    </ModalOverlay>
  );
};
