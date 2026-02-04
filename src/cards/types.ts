export type CardId = string;
export interface CardInterface {
  id: string;
  instanceId?: string; // Unique ID for this specific instance of the card
  name: string;
  type: CardType;
  description: string;
  cost: number; // Momentum cost (0, 1, 3, 4, 5) - REQUIRED for all cards
  atk?: number;
  def?: number;
  affinity?: Affinity;
  rarity: Rarity;
  set: "Base";
  effectId?: string;
  effectType?: "ONE_TIME" | "CONTINUOUS";
  isMax?: boolean; // MAX cards are stored in separate MAX deck
  image?: string; // Optional image filename (e.g., "riptide_pixie.jpg")
}

export enum Rarity {
  Common = "C",
  Rare = "R",
  SuperRare = "SR",
  SecretRare = "SECRET",
  UltraRare = "UR",
  PrismaticRare = "PR",
}

export interface EffectInterface {
  id: string;
  description: string;
}

export enum CardType {
  Creature = "CREATURE",
  Magic = "MAGIC",
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
