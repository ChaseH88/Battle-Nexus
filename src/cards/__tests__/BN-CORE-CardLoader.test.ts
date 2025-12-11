import bnCoreCardData from "../../static/card-data/bn-core.json";
import { CardType } from "../types";
import { CreatureCard } from "../CreatureCard";
import { ActionCard } from "../ActionCard";
import { SupportCard } from "../SupportCard";

type RawCard = any; // you can tighten this later

function createCardFromJson(raw: RawCard) {
  switch (raw.type as CardType) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Support:
      return new SupportCard(raw);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

describe("cards.json loader", () => {
  const instances = (bnCoreCardData as RawCard[]).map(createCardFromJson);

  it("loads all cards without error", () => {
    expect(instances).toHaveLength(10);
  });

  it("creates correct class types", () => {
    const emberCub = instances.find((c) => c.id === "ember_cub");
    const igniteBurst = instances.find((c) => c.id === "ignite_burst");
    const burningField = instances.find((c) => c.id === "burning_field");

    expect(emberCub).toBeInstanceOf(CreatureCard);
    expect(igniteBurst).toBeInstanceOf(ActionCard);
    expect(burningField).toBeInstanceOf(SupportCard);
  });

  it("preserves important fields from JSON", () => {
    const emberCub = instances.find(
      (c) => c.id === "ember_cub"
    ) as CreatureCard;
    expect(emberCub.atk).toBe(200);
    expect(emberCub.affinity).toBeDefined();
  });
});
