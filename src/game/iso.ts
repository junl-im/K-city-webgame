export const TILE_W = 96;
export const TILE_H = 48;

export function isoToScreen(x: number, y: number) {
  return {
    x: (x - y) * (TILE_W / 2),
    y: (x + y) * (TILE_H / 2)
  };
}

export function screenToIso(x: number, y: number) {
  return {
    x: y / TILE_H + x / TILE_W,
    y: y / TILE_H - x / TILE_W
  };
}
