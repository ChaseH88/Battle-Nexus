import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { closeCardDetailModal } from "../../../store/uiSlice";
import { ModalOverlay, ModalContent } from "./styled";
import { CardType } from "../../../cards/types";
import { CreatureCard } from "../../../cards/CreatureCard";
import { SupportCard } from "../../../cards/SupportCard";
import { ActionCard } from "../../../cards/ActionCard";

export const CardDetailModal = () => {
  const dispatch = useDispatch();
  const { isOpen, card, activeEffects } = useSelector(
    (state: RootState) => state.ui.cardDetailModal
  );

  if (!isOpen || !card) return null;

  const isCreature = card.type === CardType.Creature;
  const isSupport = card.type === CardType.Support;
  const isAction = card.type === CardType.Action;
  const creature = isCreature ? (card as CreatureCard) : null;
  const support = isSupport ? (card as SupportCard) : null;
  const action = isAction ? (card as ActionCard) : null;

  const cardEffects = activeEffects.filter((effect) =>
    effect.affectedCardIds?.includes(card.id)
  );

  return (
    <ModalOverlay onClick={() => dispatch(closeCardDetailModal())}>
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>{card.name}</h2>

        {/* Enlarged Card Display */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <article
            style={{
              width: 320,
              height: 506,
              fontSize: "18px",
              padding: "16px",
              border: "2px solid #333",
              borderRadius: "8px",
              background: "#1a1a1a",
              color: "white",
            }}
          >
            {creature && (
              <>
                <div>
                  <div style={{ fontSize: "14px", opacity: 0.7 }}>
                    {card.type}
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {card.name}
                  </div>
                  <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                    {creature.affinity}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  {creature.mode === "ATTACK" ? "⚔️ ATTACK" : "🛡️ DEFENSE"}
                </div>
                <div
                  style={{
                    height: 160,
                    width: 160,
                    background: "white",
                    margin: "8px auto",
                  }}
                />
                <div
                  style={{
                    fontSize: "14px",
                    marginBottom: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  {card.description}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "16px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color:
                        creature.currentHp < creature.hp * 0.3
                          ? "#ef4444"
                          : "#22c55e",
                    }}
                  >
                    ❤️ HP: {creature.currentHp}/{creature.hp}
                  </div>
                  <div
                    style={{ opacity: creature.mode === "ATTACK" ? 1 : 0.5 }}
                  >
                    ⚔️ ATK: {creature.atk}
                    {creature.isAtkModified && (
                      <span style={{ opacity: 0.6 }}>
                        {" "}
                        (base: {creature.baseAtk})
                      </span>
                    )}
                  </div>
                  <div
                    style={{ opacity: creature.mode === "DEFENSE" ? 1 : 0.5 }}
                  >
                    🛡️ DEF: {creature.def}
                    {creature.isDefModified && (
                      <span style={{ opacity: 0.6 }}>
                        {" "}
                        (base: {creature.baseDef})
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {support && (
              <>
                <div>
                  <div style={{ fontSize: "14px", opacity: 0.7 }}>
                    {card.type}
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {card.name}
                  </div>
                  {support.cost !== undefined && (
                    <div style={{ fontSize: "16px" }}>Cost: {support.cost}</div>
                  )}
                </div>
                <div
                  style={{
                    height: 160,
                    width: 160,
                    background: "white",
                    margin: "16px auto",
                  }}
                />
                <div
                  style={{
                    fontSize: "14px",
                    marginBottom: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  {card.description}
                </div>
                {support.isActive && (
                  <div
                    style={{
                      fontSize: "14px",
                      padding: "4px 8px",
                      background: "#22c55e",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    ACTIVE
                  </div>
                )}
              </>
            )}

            {action && (
              <>
                <div>
                  <div style={{ fontSize: "14px", opacity: 0.7 }}>
                    {card.type}
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {card.name}
                  </div>
                  {action.cost !== undefined && (
                    <div style={{ fontSize: "16px" }}>Cost: {action.cost}</div>
                  )}
                  <div style={{ fontSize: "16px" }}>Speed: {action.speed}</div>
                </div>
                <div
                  style={{
                    height: 160,
                    width: 160,
                    background: "white",
                    margin: "16px auto",
                  }}
                />
                <div
                  style={{
                    fontSize: "14px",
                    marginBottom: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  {card.description}
                </div>
                {action.isActive && (
                  <div
                    style={{
                      fontSize: "14px",
                      padding: "4px 8px",
                      background: "#22c55e",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    ACTIVE
                  </div>
                )}
              </>
            )}
          </article>
        </div>

        {/* Active Effects */}
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
        )}

        <button
          onClick={() => dispatch(closeCardDetailModal())}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </ModalContent>
    </ModalOverlay>
  );
};
