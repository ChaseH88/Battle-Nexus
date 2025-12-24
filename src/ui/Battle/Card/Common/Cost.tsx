import { CreatureCard } from "@cards/CreatureCard";
import { Affinity } from "@cards";
import {
  Container,
  BadgeContainer,
  OuterGoldRing,
  InnerCircle,
  TextureOverlay,
  Glow,
  CostText,
} from "./Cost.styled";

interface CostProps extends Pick<CreatureCard, "cost" | "affinity"> {
  size?: number; // optional if you want to scale the badge
}

export const Cost = ({ cost, affinity, size = 32 }: CostProps) => {
  const colors: Record<Affinity, string> = {
    [Affinity.Fire]: "#cf2411",
    [Affinity.Water]: "#2b8fff",
    [Affinity.Grass]: "#2fbf4a",
    [Affinity.Lightning]: "#f7c400",
    [Affinity.Ice]: "#7ad8ff",
    [Affinity.Wind]: "#7fe0c3",
    [Affinity.Metal]: "#a7b0ba",
    [Affinity.Light]: "#f7f2b5",
    [Affinity.Shadow]: "#5a2a82",
    [Affinity.Psychic]: "#d84cff",
  };

  const base = colors[affinity] ?? "#cf2411";

  return (
    <Container>
      <BadgeContainer size={size}>
        <OuterGoldRing>
          <InnerCircle baseColor={base}>
            <TextureOverlay />
            <CostText variant="h2">{cost}</CostText>
          </InnerCircle>
        </OuterGoldRing>
        <Glow />
      </BadgeContainer>
    </Container>
  );
};
