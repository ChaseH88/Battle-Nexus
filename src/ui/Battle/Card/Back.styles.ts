import styled, { css } from "styled-components";

interface BackContainerProps {
  $type: "creature" | "support" | "action" | "trap";
  $isCreature: boolean;
}

export const BackContainer = styled.div<BackContainerProps>`
  background: linear-gradient(145deg, #2d3748, #1a202c);
  border: 2px solid #4a5568;
  border-radius: 10px;
  padding: 15px;
  min-height: 140px;
  min-width: 160px;
  width: 160px;
  height: 253px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;

  ${(props) =>
    props.$type === "creature" &&
    css`
      border-color: #4a5568;
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    `}

  ${(props) =>
    props.$type === "support" &&
    css`
      border-color: #718096;
      background: linear-gradient(145deg, #4a5568, #2d3748);
    `}

  ${(props) =>
    props.$type === "action" &&
    css`
      border-color: #805ad5;
      background: linear-gradient(145deg, #553c9a, #44337a);
    `}

  ${(props) =>
    props.$type === "trap" &&
    css`
      border-color: #805ad5;
      background: linear-gradient(145deg, #553c9a, #44337a);
    `}

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
  width: 140px;
  height: auto;
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
