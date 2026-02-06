import { GameState } from "@battle/GameState";
import { Affinity, CardType } from "@cards";
import { CardFilter, TargetingConfig } from "./types";
import { CreatureCard } from "@cards/CreatureCard";
import { SupportCard } from "@cards/SupportCard";

/**
 * TargetingBuilder - Internal builder for creating TargetingConfig (no state required)
 */
class TargetingBuilder {
  private _targetType: TargetingConfig["targetType"] = "ALLY_CREATURE";
  private _filter: CardFilter = {};
  private _allowMultiple: boolean = false;
  private _formatOptions: {
    showStats?: "atk" | "hp" | "both";
    customFormatter?: (creature: CreatureCard, lane: number) => string;
  } = {};

  allyCreatures(): this {
    this._targetType = "ALLY_CREATURE";
    return this;
  }

  enemyCreatures(): this {
    this._targetType = "ENEMY_CREATURE";
    return this;
  }

  allySupports(): this {
    this._targetType = "ALLY_SUPPORT";
    return this;
  }

  enemySupports(): this {
    this._targetType = "ENEMY_SUPPORT";
    return this;
  }

  anyCreature(): this {
    this._targetType = "ANY_CREATURE";
    return this;
  }

  withAffinity(affinity: Affinity): this {
    this._filter.affinity = affinity;
    return this;
  }

  withType(type: CardType): this {
    this._filter.type = type;
    return this;
  }

  inLane(lane: number): this {
    this._filter.lane = lane;
    return this;
  }

  inSupportSlot(slot: number): this {
    this._filter.supportSlot = slot;
    return this;
  }

  withFilter(filter: CardFilter): this {
    this._filter = { ...this._filter, ...filter };
    return this;
  }

  allowMultiple(allow: boolean = true): this {
    this._allowMultiple = allow;
    return this;
  }

  formatWithStats(stats: "atk" | "hp" | "both"): this {
    this._formatOptions.showStats = stats;
    return this;
  }

  withCustomFormatter(
    formatter: (creature: CreatureCard, lane: number) => string,
  ): this {
    this._formatOptions.customFormatter = formatter;
    return this;
  }

  /**
   * Build the final TargetingConfig object
   */
  build(description: string): TargetingConfig {
    return {
      required: true,
      targetType: this._targetType,
      description,
      allowMultiple: this._allowMultiple,
      filter: Object.keys(this._filter).length > 0 ? this._filter : undefined,
    };
  }

  /**
   * Build and return both config + executor function
   * This eliminates the need to define targeting twice in metadata
   */
  buildWithExecutor(description: string): (
    state: GameState,
    ownerIndex: 0 | 1,
  ) => {
    config: TargetingConfig;
    getTargets: () => Array<{ label: string; value: number; metadata?: any }>;
  } {
    // Capture current builder state
    const config = this.build(description);
    const builderConfig = this._getInternalConfig();

    return (state: GameState, ownerIndex: 0 | 1) => {
      const targeting = Targeting.from(state, ownerIndex);

      // Apply the same builder configuration
      if (builderConfig.targetType === "ALLY_CREATURE") {
        targeting.allyCreatures();
      } else if (builderConfig.targetType === "ENEMY_CREATURE") {
        targeting.enemyCreatures();
      } else if (builderConfig.targetType === "ALLY_SUPPORT") {
        targeting.allySupports();
      } else if (builderConfig.targetType === "ENEMY_SUPPORT") {
        targeting.enemySupports();
      } else if (builderConfig.targetType === "ANY_CREATURE") {
        targeting.anyCreature();
      }

      // Apply filter options
      if (builderConfig.filter.affinity) {
        targeting.withAffinity(builderConfig.filter.affinity);
      }
      if (builderConfig.filter.type) {
        targeting.withType(builderConfig.filter.type);
      }
      if (builderConfig.filter.lane !== undefined) {
        targeting.inLane(builderConfig.filter.lane);
      }
      if (builderConfig.filter.supportSlot !== undefined) {
        targeting.inSupportSlot(builderConfig.filter.supportSlot);
      }

      // Apply format options
      if (builderConfig.formatOptions.showStats) {
        targeting.formatWithStats(builderConfig.formatOptions.showStats);
      }
      if (builderConfig.formatOptions.customFormatter) {
        targeting.withCustomFormatter(
          builderConfig.formatOptions.customFormatter,
        );
      }

      return {
        config,
        getTargets: () => targeting.getTargets(),
      };
    };
  }

  /**
   * Get the configuration needed to create a Targeting executor
   * @internal Used by Targeting.from()
   */
  _getInternalConfig() {
    return {
      targetType: this._targetType,
      filter: this._filter,
      allowMultiple: this._allowMultiple,
      formatOptions: this._formatOptions,
    };
  }
}

/**
 * Targeting class - Builder pattern for creating targeting configurations
 * Eliminates boilerplate and ensures consistency across effects
 *
 * @example
 * // For static targeting config (no state needed):
 * targeting: Targeting.allyCreatures()
 *   .withAffinity(Affinity.Fire)
 *   .build("Select Fire creature to boost")
 *
 * // For getting valid targets (requires state):
 * getValidTargets: (state, ownerIndex) =>
 *   Targeting.from(state, ownerIndex)
 *     .allyCreatures()
 *     .withAffinity(Affinity.Fire)
 *     .formatWithStats("atk")
 *     .getTargets()
 */
export class Targeting {
  private state: GameState;
  private ownerIndex: 0 | 1;
  private _targetType: TargetingConfig["targetType"] = "ALLY_CREATURE";
  private _filter: CardFilter = {};
  private _allowMultiple: boolean = false;
  private _formatOptions: {
    showStats?: "atk" | "hp" | "both";
    customFormatter?: (creature: CreatureCard, lane: number) => string;
  } = {};

  private constructor(state: GameState, ownerIndex: 0 | 1) {
    this.state = state;
    this.ownerIndex = ownerIndex;
  }

  /**
   * Static builder methods - Create config builders (no state required)
   */
  static allyCreatures(): TargetingBuilder {
    return new TargetingBuilder().allyCreatures();
  }

  static enemyCreatures(): TargetingBuilder {
    return new TargetingBuilder().enemyCreatures();
  }

  static allySupports(): TargetingBuilder {
    return new TargetingBuilder().allySupports();
  }

  static enemySupports(): TargetingBuilder {
    return new TargetingBuilder().enemySupports();
  }

  static anyCreature(): TargetingBuilder {
    return new TargetingBuilder().anyCreature();
  }

  /**
   * Static factory: Create a targeting executor (requires state)
   * Use this in getValidTargets to actually fetch targets
   */
  static from(state: GameState, ownerIndex: 0 | 1): Targeting {
    return new Targeting(state, ownerIndex);
  }

  /**
   * Target ally creatures
   */
  allyCreatures(): this {
    this._targetType = "ALLY_CREATURE";
    return this;
  }

  /**
   * Target enemy creatures
   */
  enemyCreatures(): this {
    this._targetType = "ENEMY_CREATURE";
    return this;
  }

  /**
   * Target ally support cards
   */
  allySupports(): this {
    this._targetType = "ALLY_SUPPORT";
    return this;
  }

  /**
   * Target enemy support cards
   */
  enemySupports(): this {
    this._targetType = "ENEMY_SUPPORT";
    return this;
  }

  /**
   * Target any creature (ally or enemy)
   */
  anyCreature(): this {
    this._targetType = "ANY_CREATURE";
    return this;
  }

  /**
   * Filter by affinity
   */
  withAffinity(affinity: Affinity): this {
    this._filter.affinity = affinity;
    return this;
  }

  /**
   * Filter by card type
   */
  withType(type: CardType): this {
    this._filter.type = type;
    return this;
  }

  /**
   * Filter by specific lane
   */
  inLane(lane: number): this {
    this._filter.lane = lane;
    return this;
  }

  /**
   * Filter by support slot
   */
  inSupportSlot(slot: number): this {
    this._filter.supportSlot = slot;
    return this;
  }

  /**
   * Apply custom filter
   */
  withFilter(filter: CardFilter): this {
    this._filter = { ...this._filter, ...filter };
    return this;
  }

  /**
   * Allow multiple targets
   */
  allowMultiple(allow: boolean = true): this {
    this._allowMultiple = allow;
    return this;
  }

  /**
   * Configure label formatting for targets
   */
  formatWithStats(stats: "atk" | "hp" | "both"): this {
    this._formatOptions.showStats = stats;
    return this;
  }

  /**
   * Use custom formatter for target labels
   */
  withCustomFormatter(
    formatter: (creature: CreatureCard, lane: number) => string,
  ): this {
    this._formatOptions.customFormatter = formatter;
    return this;
  }

  /**
   * Get valid targets based on the current configuration
   */
  getTargets(): Array<{ label: string; value: number; metadata?: any }> {
    const player =
      this._targetType.startsWith("ALLY") || this._targetType === "ANY_CREATURE"
        ? this.state.players[this.ownerIndex]
        : this.state.players[this.ownerIndex === 0 ? 1 : 0];

    // Handle creature targeting
    if (
      this._targetType === "ALLY_CREATURE" ||
      this._targetType === "ENEMY_CREATURE" ||
      this._targetType === "ANY_CREATURE"
    ) {
      return player.lanes
        .map((creature, lane) => ({ creature, lane }))
        .filter((item) => {
          if (!item.creature) return false;
          if (
            this._filter.affinity &&
            item.creature.affinity !== this._filter.affinity
          ) {
            return false;
          }
          if (
            this._filter.lane !== undefined &&
            item.lane !== this._filter.lane
          ) {
            return false;
          }
          return true;
        })
        .map(({ creature, lane }) => ({
          label: this._formatCreatureLabel(creature!, lane),
          value: lane,
          metadata: { lane, creature },
        }));
    }

    // Handle support targeting
    if (
      this._targetType === "ALLY_SUPPORT" ||
      this._targetType === "ENEMY_SUPPORT"
    ) {
      return player.support
        .map((support, slot) => ({ support, slot }))
        .filter((item) => {
          if (!item.support) return false;
          if (
            this._filter.supportSlot !== undefined &&
            item.slot !== this._filter.supportSlot
          ) {
            return false;
          }
          return true;
        })
        .map(({ support, slot }) => ({
          label: this._formatSupportLabel(support!, slot),
          value: slot,
          metadata: { slot, support },
        }));
    }

    return [];
  }

  /**
   * Format creature label based on configuration
   */
  private _formatCreatureLabel(creature: CreatureCard, lane: number): string {
    if (this._formatOptions.customFormatter) {
      return this._formatOptions.customFormatter(creature, lane);
    }

    let label = `${creature.name} (Lane ${lane + 1})`;

    if (this._formatOptions.showStats === "atk") {
      label += ` - ${creature.atk} ATK`;
    } else if (this._formatOptions.showStats === "hp") {
      label += ` - ${creature.currentHp}/${creature.hp} HP`;
    } else if (this._formatOptions.showStats === "both") {
      label += ` - ${creature.atk} ATK, ${creature.currentHp}/${creature.hp} HP`;
    }

    if (creature.isFaceDown) {
      label += " [Face-Down]";
    }
    if (creature.hasAttackedThisTurn) {
      label += " [Attacked]";
    }

    return label;
  }

  /**
   * Format support label
   */
  private _formatSupportLabel(support: SupportCard, slot: number): string {
    let label = `${support.name} (Slot ${slot + 1})`;

    if (support.isFaceDown) {
      label += " [Face-Down]";
    }

    return label;
  }
}

/**
 * Static factory methods for common targeting patterns
 */
export class TargetingHelpers {
  /**
   * Quick helper: Target ally creatures with specific affinity
   */
  static allyCreaturesWithAffinity(
    state: GameState,
    ownerIndex: 0 | 1,
    affinity: Affinity,
    description: string,
  ): {
    config: TargetingConfig;
    targets: Array<{ label: string; value: number; metadata?: any }>;
  } {
    const config = Targeting.allyCreatures()
      .withAffinity(affinity)
      .formatWithStats("atk")
      .build(description);

    const targets = Targeting.from(state, ownerIndex)
      .allyCreatures()
      .withAffinity(affinity)
      .formatWithStats("atk")
      .getTargets();

    return { config, targets };
  }

  /**
   * Quick helper: Target any ally creature
   */
  static allyCreatures(
    state: GameState,
    ownerIndex: 0 | 1,
    description: string,
  ): {
    config: TargetingConfig;
    targets: Array<{ label: string; value: number; metadata?: any }>;
  } {
    const config = Targeting.allyCreatures()
      .formatWithStats("hp")
      .build(description);

    const targets = Targeting.from(state, ownerIndex)
      .allyCreatures()
      .formatWithStats("hp")
      .getTargets();

    return { config, targets };
  }

  /**
   * Quick helper: Target enemy support cards
   */
  static enemySupports(
    state: GameState,
    ownerIndex: 0 | 1,
    description: string,
  ): {
    config: TargetingConfig;
    targets: Array<{ label: string; value: number; metadata?: any }>;
  } {
    const config = Targeting.enemySupports().build(description);

    const targets = Targeting.from(state, ownerIndex)
      .enemySupports()
      .getTargets();

    return { config, targets };
  }
}
