import styled from "styled-components";
import { CARD_DIMENSIONS } from "../Card/cardDimensions";

export const ZoneContainer = styled.div`
  &:not(:last-child) {
    margin-bottom: 2.5em;
  }
`;

export const Lanes = styled.div<{ isCreature?: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${(props) => (props.isCreature ? 5 : 2)}em;
  justify-content: center;
  max-width: 520px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Lane = styled.div`
  min-width: ${CARD_DIMENSIONS.WIDTH}px;
`;

export const PlayHereButton = styled.button`
  width: 100%;
  background: linear-gradient(145deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    background: linear-gradient(145deg, #38a169, #2f855a);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(72, 187, 120, 0.4);
  }
`;

export const AttackButton = styled.button`
  width: 100%;
  background: linear-gradient(145deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 10px 18px;
  font-size: 0.95rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 10px;
  box-shadow:
    0 4px 12px rgba(239, 68, 68, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #dc2626 0%, #b91c1c 100%);
    box-shadow:
      0 6px 16px rgba(239, 68, 68, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const AttackDirectButton = styled(AttackButton)`
  background: linear-gradient(145deg, #f59e0b 0%, #d97706 100%);
  box-shadow:
    0 4px 12px rgba(245, 158, 11, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #d97706 0%, #b45309 100%);
    box-shadow:
      0 6px 16px rgba(245, 158, 11, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

export const ToggleModeButton = styled.button`
  width: 100%;
  background: linear-gradient(145deg, #4299e1, #3182ce);
  color: white;
  border: none;
  padding: 6px 12px;
  font-size: 0.85rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #3182ce, #2c5282);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const FlipButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
  border: none;
  padding: 6px 10px;
  font-size: 0.85rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
  margin-top: 8px;

  &:hover {
    background: linear-gradient(135deg, #dd6b20 0%, #c05621 100%);
    transform: translateY(-1px);
  }
`;

export const FaceDownButton = styled.button`
  background: linear-gradient(145deg, #718096, #4a5568);
  color: white;
  border: none;
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 8px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  width: 100%;
  cursor: pointer;

  &:hover {
    background: linear-gradient(145deg, #4a5568, #2d3748);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(74, 85, 104, 0.4);
  }
`;

export const ActivateButton = styled.button`
  background: linear-gradient(145deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 8px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  width: 100%;
  cursor: pointer;

  &:hover {
    background: linear-gradient(145deg, #38a169, #2f855a);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(72, 187, 120, 0.4);
  }
`;
