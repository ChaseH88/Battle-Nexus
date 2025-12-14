export enum Zone {
  Deck = "DECK",
  Hand = "HAND",

  Lane0 = "LANE_0",
  Lane1 = "LANE_1",
  Lane2 = "LANE_2",

  Support0 = "SUPPORT_0",
  Support1 = "SUPPORT_1",
  Support2 = "SUPPORT_2",

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

export function isSupport(zone: Zone): boolean {
  return (
    zone === Zone.Support0 || zone === Zone.Support1 || zone === Zone.Support2
  );
}

export function supportIndexFromZone(zone: Zone): number {
  switch (zone) {
    case Zone.Support0:
      return 0;
    case Zone.Support1:
      return 1;
    case Zone.Support2:
      return 2;
    default:
      throw new Error(`Zone ${zone} is not a support lane`);
  }
}
