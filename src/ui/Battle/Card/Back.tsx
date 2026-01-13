import { useMemo } from "react";
import backImage from "@/assets/card-back.png";
import { BackContainer, BackImage, BackModeBadge } from "./Back.styles";

interface BackProps {
  onClick?: () => void;
  type: "creature" | "support" | "action" | "trap";
}

export const Back = ({ onClick, type }: BackProps) => {
  const isCreature = useMemo(() => type === "creature", [type]);

  return (
    <BackContainer onClick={onClick} $type={type} $isCreature={isCreature}>
      <BackImage src={backImage} alt="Back of card" />
      {isCreature && <BackModeBadge>Defense Mode!</BackModeBadge>}
    </BackContainer>
  );
};
