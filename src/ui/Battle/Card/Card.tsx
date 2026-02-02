import { CardInterface, CardType } from "../../../cards/types";
import { Creature } from "./Creature";
import { Support } from "./Support";
import { Action } from "./Action";
import { SupportCard } from "../../../cards/SupportCard";
import { ActionCard } from "../../../cards/ActionCard";
import { TrapCard } from "../../../cards/TrapCard";
import { Back } from "./Back";
import { CreatureCard } from "../../../cards";
import { CardSlot } from "./Card.styles";
import { useDispatch } from "react-redux";
import { openCardDetailModal } from "../../../store/uiSlice";
import { useRef, useMemo } from "react";
import { getEffectiveStatsFromActiveEffects } from "../../../battle/MomentumPressure";
import { ActiveEffect } from "../../../battle/GameState";

interface CardProps {
  card: CardInterface | null;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
  showFaceDown?: boolean;
  selectedHandCard?: string | null;
  canActivate?: boolean; // New prop to show pulsing border
  disableHover?: boolean; // Disable hover animations (for modal display)
  activeEffects?: ActiveEffect[]; // Active effects for stat calculations
  playerIndex?: 0 | 1; // Player index for scoped effects
  readonly?: boolean; // If true, the card is in a read-only state
}

export const Card = ({
  card,
  onClick,
  onDoubleClick,
  isSelected,
  showFaceDown,
  selectedHandCard,
  canActivate = false,
  disableHover = false,
  activeEffects = [],
  playerIndex,
  readonly = false,
}: CardProps) => {
  const dispatch = useDispatch();
  const cardSlotRef = useRef<HTMLDivElement>(null);

  // Calculate effective stats with active effects (must be before early returns)
  const effectiveStats = useMemo(() => {
    if (!card || card.type !== CardType.Creature) return null;
    const creature = card as CreatureCard;

    // If playerIndex is undefined, just use base stats (no active effects applied)
    if (playerIndex === undefined) {
      return {
        atk: creature.atk,
        def: creature.def,
        currentHp: readonly ? undefined : creature.currentHp,
        maxHp: creature.hp,
      };
    }

    return {
      ...getEffectiveStatsFromActiveEffects(
        creature,
        activeEffects,
        playerIndex,
      ),
      ...(readonly && {
        currentHp: undefined,
      }),
    };
  }, [card, activeEffects, playerIndex, readonly]);

  if (!card) {
    return <CardSlot isEmpty onClick={onClick} />;
  }

  const isCreature = card.type === CardType.Creature;
  const isSupport = card.type === CardType.Support;
  const isAction = card.type === CardType.Action;
  const isTrap = card.type === CardType.Trap;
  const creature = isCreature ? (card as CreatureCard) : null;
  const support = isSupport ? (card as SupportCard) : null;
  const action = isAction ? (card as ActionCard) : null;
  const trap = isTrap ? (card as TrapCard) : null;

  // Show creature face-down if it has isFaceDown property set
  if (creature && creature.isFaceDown) {
    return <Back onClick={onClick} type="creature" />;
  }

  // Show support/action/trap face-down if isFaceDown is true
  if (
    (support && support.isFaceDown) ||
    (action && action.isFaceDown) ||
    (trap && trap.isFaceDown)
  ) {
    const backType = support ? "support" : action ? "action" : "trap";
    return <Back onClick={onClick} type={backType} />;
  }

  // Also show face-down for opponent's inactive cards if showFaceDown is true
  if (
    showFaceDown &&
    (support || action || trap) &&
    !(support || action || trap)!.isActive
  ) {
    const backType = support ? "support" : action ? "action" : "trap";
    return <Back onClick={onClick} type={backType} />;
  }

  const isDefeated = creature ? creature.currentHp <= 0 : false;
  const isExhausted = creature ? creature.hasAttackedThisTurn : false;
  const isDefenseMode = creature ? creature.mode === "DEFENSE" : false;
  const isActiveCard = Boolean(
    (support && support.isActive) ||
    (action && action.isActive) ||
    (trap && trap.isActive),
  );

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick();
    if (!cardSlotRef.current) return;
    const rect = cardSlotRef.current.getBoundingClientRect();
    dispatch(
      openCardDetailModal({
        card,
        activeEffects,
        playerIndex,
        originRect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      }),
    );
  };

  return (
    <CardSlot
      ref={cardSlotRef}
      cardType={card.type}
      isSelected={selectedHandCard === card.id || isSelected}
      isDefeated={isDefeated}
      isExhausted={isExhausted}
      isDefenseMode={isDefenseMode}
      isFaceDown={false}
      isActive={isActiveCard}
      canActivate={canActivate}
      disableHover={disableHover}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      className={"card-slot"}
    >
      {creature && effectiveStats && (
        <Creature
          id={creature.id}
          mode={creature.mode}
          baseAtk={creature.atk}
          baseDef={creature.def}
          effectiveAtk={effectiveStats.atk}
          effectiveDef={effectiveStats.def}
          hp={effectiveStats.maxHp}
          currentHp={effectiveStats.currentHp}
          hasAttackedThisTurn={creature.hasAttackedThisTurn}
          description={creature.description}
          affinity={creature.affinity}
          name={creature.name}
          cost={creature.cost}
          image={creature.image}
        />
      )}
      {support && (
        <Support
          id={support.id}
          name={support.name}
          type={support.type}
          description={support.description}
          cost={support.cost}
          isActive={support.isActive}
          isFaceDown={support.isFaceDown}
          targetPlayerIndex={support.targetPlayerIndex}
          image={support.image}
        />
      )}
      {action && (
        <Action
          id={action.id}
          name={action.name}
          type={action.type}
          description={action.description}
          cost={action.cost}
          speed={action.speed}
          isActive={action.isActive}
          isFaceDown={action.isFaceDown}
          image={action.image}
        />
      )}
      {trap && (
        <Support
          id={trap.id}
          name={trap.name}
          type={trap.type}
          description={trap.description}
          cost={trap.cost}
          isActive={trap.isActive}
          isFaceDown={trap.isFaceDown}
          image={trap.image}
        />
      )}
    </CardSlot>
  );
};
