export enum Zone {
  Deck = "DECK",
  Hand = "HAND",
  Lane0 = "LANE_0",
  Lane1 = "LANE_1",
  Lane2 = "LANE_2",
  Support = "SUPPORT",
  Graveyard = "GRAVEYARD",
  Stack = "STACK",
}

export function isLane(zone: Zone): boolean {
  return zone === Zone.Lane0 || zone === Zone.Lane1 || zone === Zone.Lane2;
}

export function laneIndexFromZone(zone: Zone): number {
  switch (zone) {
    case Zone.Lane0:
      return 0;
    case Zone.Lane1:
      return 1;
    case Zone.Lane2:
      return 2;
    default:
      throw new Error(`Zone ${zone} is not a lane`);
  }
}
