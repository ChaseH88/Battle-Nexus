import styled, { css, keyframes } from "styled-components";
import { CardType } from "@cards/types";
import { CARD_DIMENSIONS } from "./cardDimensions";

const pulseBorder = keyframes`
  0%, 100% {
    border-color: #60a5fa;
    box-shadow: 0 0 15px rgba(96, 165, 250, 0.6);
  }
  50% {
    border-color: #3b82f6;
    box-shadow: 0 0 25px rgba(59, 130, 246, 0.9);
  }
`;

interface CardSlotProps {
  isEmpty?: boolean;
  isSelected?: boolean;
  cardType?: CardType;
  isDefeated?: boolean;
  isExhausted?: boolean;
  isDefenseMode?: boolean;
  isFaceDown?: boolean;
  isActive?: boolean;
  canActivate?: boolean;
  disableHover?: boolean;
}

export const CardSlot = styled.div<CardSlotProps>`
  box-sizing: border-box;
  background: linear-gradient(145deg, #2d374869, #1a202c76);
  border: 2px dashed #4a5568;
  border-radius: 10px;
  padding: 15px;
  width: ${CARD_DIMENSIONS.WIDTH}px;
  height: ${CARD_DIMENSIONS.HEIGHT}px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  position: relative;

  ${(props) =>
    props.disableHover &&
    css`
      pointer-events: none !important;
    `}

  ${(props) =>
    !props.disableHover &&
    !props.isEmpty &&
    !props.isExhausted &&
    css`
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        border-color: #63b3ed;
      }
    `}

  /* Empty slot styles */
  ${(props) =>
    props.isEmpty &&
    css`
      background: rgba(255, 255, 255, 0.05);
      border-style: dashed;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #718096;
      cursor: default;

      &:hover {
        transform: none;
        border-color: #4a5568;
      }
    `}

  /* Selected styles */
  ${(props) =>
    props.isSelected &&
    css`
      border-color: #48bb78;
      box-shadow: 0 0 20px rgba(72, 187, 120, 0.5);
      transform: translateY(-5px);
    `}

  /* Card type specific colors */
  ${(props) =>
    props.cardType === CardType.Creature &&
    css`
      border-color: #ed8936;

      ${props.isFaceDown &&
      css`
        background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        border: 2px solid #4a5568;
      `}
    `}

  ${(props) =>
    props.cardType === CardType.Support &&
    css`
      border-color: #4299e1;

      ${props.isFaceDown &&
      css`
        background: linear-gradient(145deg, #4a5568, #2d3748);
        border-color: #718096;
      `}

      ${props.isActive &&
      css`
        border-color: #48bb78;
        box-shadow: 0 0 15px rgba(72, 187, 120, 0.5);
      `}
    `}

  ${(props) =>
    props.cardType === CardType.Action &&
    css`
      border-color: #9f7aea;

      ${props.isFaceDown &&
      css`
        background: linear-gradient(145deg, #553c9a, #44337a);
        border-color: #805ad5;
      `}

      ${props.isActive &&
      css`
        border-color: #d69e2e;
        box-shadow: 0 0 15px rgba(214, 158, 46, 0.5);
      `}
    `}

  ${(props) =>
    props.cardType === CardType.Trap &&
    css`
      border-color: #9f7aea;

      ${props.isFaceDown &&
      css`
        background: linear-gradient(145deg, #553c9a, #44337a);
        border-color: #805ad5;
      `}

      ${props.isActive &&
      css`
        border-color: #48bb78;
        box-shadow: 0 0 15px rgba(72, 187, 120, 0.5);
      `}
    `}

  /* Can activate animation */
  ${(props) =>
    props.canActivate &&
    css`
      animation: ${pulseBorder} 2s ease-in-out infinite;
      cursor: pointer;

      &:hover {
        border-color: #93c5fd;
        box-shadow: 0 0 30px rgba(147, 197, 253, 1);
        transform: translateY(-8px);
      }
    `}

  /* Defeated styles */
  ${(props) =>
    props.isDefeated &&
    css`
      opacity: 0.5;
      filter: grayscale(100%);
    `}

  /* Exhausted styles */
  ${(props) =>
    props.isExhausted &&
    css`
      opacity: 0.7;
      border-color: #718096 !important;

      &:hover {
        transform: translateY(-2px);
      }
    `}

  /* Defense mode styles */
  ${(props) =>
    props.isDefenseMode &&
    !props.isFaceDown &&
    css`
      border-color: rgba(50, 150, 255, 0.6) !important;
      box-shadow: 0 0 10px rgba(50, 150, 255, 0.3);
      transform: rotate(90deg);
      margin: 30px 0;
    `}
`;

export const CardModeBadge = styled.div<{ $isDefenseMode?: boolean }>`
  position: absolute;
  top: 5px;
  right: 5px;
  background: ${(props) =>
    props.$isDefenseMode
      ? "rgba(50, 150, 255, 0.9)"
      : "rgba(255, 100, 50, 0.9)"};
  color: #fff;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const ActiveBadge = styled.div`
  background: rgba(72, 187, 120, 0.8);
  color: #fff;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const AttackedBadge = styled.div`
  background: rgba(128, 128, 128, 0.8);
  color: #fff;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;
