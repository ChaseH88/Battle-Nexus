export type CardId = string;
export interface CardInterface {
  id: string;
  name: string;
  type: CardType;
  description: string;
  cost?: number;
  atk?: number;
  def?: number;
  affinity?: Affinity;
  rarity: "C" | "R" | "SR" | "UR";
  set: "Base";
  effectId?: string;
  effectType?: "ONE_TIME" | "CONTINUOUS";
  isMax?: boolean; // MAX cards are stored in separate MAX deck
  momentumCost?: number; // Momentum cost to play MAX cards
}

export interface EffectInterface {
  id: string;
  description: string;
}

export enum CardType {
  Creature = "CREATURE",
  Action = "ACTION",
  Support = "SUPPORT",
  Trap = "TRAP",
}

export enum Affinity {
  Fire = "FIRE",
  Water = "WATER",
  Grass = "GRASS",
  Lightning = "LIGHTNING",
  Ice = "ICE",
  Wind = "WIND",
  Metal = "METAL",
  Light = "LIGHT",
  Shadow = "SHADOW",
  Psychic = "PSYCHIC",
}
