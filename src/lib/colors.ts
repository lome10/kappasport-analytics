export const PLAYER_COLORS = [
  'oklch(0.488 0.243 264.376)',
  'oklch(0.646 0.222 41.116)',
  'oklch(0.6 0.118 184.704)',
  'oklch(0.627 0.265 303.9)',
  'oklch(0.828 0.189 84.429)',
  'oklch(0.577 0.245 27.325)',
  'oklch(0.696 0.17 162.48)',
  'oklch(0.769 0.188 70.08)',
]

export function playerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}
