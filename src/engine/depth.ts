export const MIN_SEARCH_DEPTH = 1;
export const MAX_SEARCH_DEPTH = 10;
export const DEEP_SEARCH_DEPTH = 7;

export const STRENGTH_DEPTHS = {
  easy: 2,
  medium: 4,
  hard: 6,
} as const;

export type Strength = keyof typeof STRENGTH_DEPTHS | "advanced";

export function depthForStrength(strength: Strength, advanced: number): number {
  return strength === "advanced" ? advanced : STRENGTH_DEPTHS[strength];
}

export function isSearchDepth(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_SEARCH_DEPTH && value <= MAX_SEARCH_DEPTH;
}
