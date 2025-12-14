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
  keywords?: ComboKeyword[];
  rarity: "C" | "R" | "SR" | "UR";
  set: "Base";
  effectId?: string;
}

export interface EffectInterface {
  id: string;
  description: string;
}

export enum CardType {
  Creature = "CREATURE",
  Action = "ACTION",
  Support = "SUPPORT",
}

export enum Affinity {
  Fire = "FIRE",
  Water = "WATER",
  Earth = "EARTH",
  Lightning = "LIGHTNING",
  Light = "LIGHT",
  Shadow = "SHADOW",
}

export enum ComboKeyword {
  Ignite = "IGNITE",
  Chain = "CHAIN",
  Absorb = "ABSORB",
  Strike = "STRIKE",
  Charge = "CHARGE",
}
