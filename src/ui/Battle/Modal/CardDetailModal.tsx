import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { closeCardDetailModal } from "../../../store/uiSlice";
import { ModalOverlay, ModalContent } from "./styled";
import { Card } from "../Card";

export const CardDetailModal = () => {
  const dispatch = useDispatch();
  const { isOpen, card /*activeEffects*/ } = useSelector(
    (state: RootState) => state.ui.cardDetailModal
  );

  if (!isOpen || !card) return null;

  // const cardEffects = activeEffects.filter((effect) =>
  //   effect.affectedCardIds?.includes(card.id)
  // );

  return (
    <ModalOverlay onClick={() => dispatch(closeCardDetailModal())}>
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px", maxHeight: "90vh", overflow: "hidden" }}
      >
        <Card card={card} disableHover={true} />

        {/* Active Effects
        {cardEffects.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ marginBottom: "12px" }}>Active Effects:</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {cardEffects.map((effect) => (
                <div
                  key={effect.id}
                  style={{
                    padding: "12px",
                    background: "#2a2a2a",
                    borderRadius: "6px",
                    borderLeft: "3px solid #a855f7",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "4px",
                      color: "#a855f7",
                    }}
                  >
                    {effect.name}
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.8 }}>
                    {effect.description}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.6,
                      marginTop: "4px",
                    }}
                  >
                    Source: {effect.sourceCardName}
                    {effect.turnsRemaining !== undefined && (
                      <> • Turns remaining: {effect.turnsRemaining}</>
                    )}
                  </div>
                  {effect.statModifiers && (
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      {effect.statModifiers.atk !== undefined && (
                        <span style={{ marginRight: "12px" }}>
                          ⚔️ ATK: {effect.statModifiers.atk > 0 ? "+" : ""}
                          {effect.statModifiers.atk}
                        </span>
                      )}
                      {effect.statModifiers.def !== undefined && (
                        <span>
                          🛡️ DEF: {effect.statModifiers.def > 0 ? "+" : ""}
                          {effect.statModifiers.def}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )} */}
      </ModalContent>
    </ModalOverlay>
  );
};
