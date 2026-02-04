import { CreatureCard } from "../cards/CreatureCard";
import { MagicCard } from "../cards/MagicCard";
import { TrapCard } from "../cards/TrapCard";
import { CardInterface } from "@/cards";

export const cardFactory = (raw: CardInterface): CardInterface => {
  switch (raw.type) {
    case "CREATURE":
      return new CreatureCard(raw as any);
    case "MAGIC":
      return new MagicCard(raw as any);
    case "TRAP":
      return new TrapCard(raw as any);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
};
