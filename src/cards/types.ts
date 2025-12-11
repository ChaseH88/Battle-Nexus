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

export type CardId = string;

export interface BaseCardArgs {
  id: CardId;
  name: string;
  description?: string;
  cost?: number;
}
