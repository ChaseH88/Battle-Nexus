import styled, { css } from "styled-components";
import { CARD_DIMENSIONS } from "./cardDimensions";

interface BackContainerProps {
  $type: "creature" | "support" | "action" | "trap";
  $isCreature: boolean;
}

export const BackContainer = styled.div<BackContainerProps>`
  box-sizing: border-box;
  min-height: 140px;
  min-width: ${CARD_DIMENSIONS.WIDTH}px;
  width: ${CARD_DIMENSIONS.WIDTH}px;
  height: ${CARD_DIMENSIONS.HEIGHT}px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;

  ${(props) =>
    props.$isCreature &&
    css`
      transform: rotate(90deg);
      margin: 30px 0;
      border-color: rgba(50, 150, 255, 0.6) !important;
      box-shadow: 0 0 10px rgba(50, 150, 255, 0.3);
    `}

  &:hover {
    transform: ${(props) =>
      props.$isCreature
        ? "rotate(90deg) translateY(-5px)"
        : "translateY(-5px)"};
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    border-color: #63b3ed;
  }
`;

export const BackImage = styled.img`
  max-width: 100%;
  width: 100%;
  height: 100%;
`;

export const BackModeBadge = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(50, 150, 255, 0.9);
  color: #fff;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`;
