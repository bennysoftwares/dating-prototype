/** Warm placeholder gradients used until real photography exists. */
export const TONES = {
  clay: ['#d9a48f', '#8c4a3c'],
  sand: ['#e8d3b5', '#a7835a'],
  sage: ['#b9c6a8', '#5d6f52'],
  dusk: ['#c7a6b8', '#5e4560'],
  sea: ['#a9c3c8', '#3f6470'],
  ember: ['#e6b07a', '#9a4d2a'],
  stone: ['#cfc6bb', '#6f655c'],
  plum: ['#c99aa0', '#6b3540'],
} as const satisfies Record<string, readonly [string, string]>;
