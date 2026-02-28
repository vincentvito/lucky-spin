/**
 * Color utilities for generating cohesive wheel palettes
 * from a single base color.
 */

export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface MonochromaticPalette {
  prizeShades: string[];
  noWinShade: string;
}

/**
 * Generate a monochromatic palette from a base color.
 * Creates `count` shades by varying lightness, plus a muted "no win" shade.
 */
export function generateMonochromaticPalette(
  baseHex: string,
  count: number
): MonochromaticPalette {
  const [h, s] = hexToHsl(baseHex);

  const minL = 30;
  const maxL = 65;
  const step = count > 1 ? (maxL - minL) / (count - 1) : 0;

  const prizeShades = Array.from({ length: count }, (_, i) => {
    const l = minL + step * i;
    return hslToHex(h, s, l);
  });

  const noWinShade = hslToHex(h, Math.max(s - 40, 10), 22);

  return { prizeShades, noWinShade };
}

/**
 * Generate a subtle radial gradient background from a base dark color.
 */
export function generateBgGradient(baseHex: string): string {
  const [h, s, l] = hexToHsl(baseHex);
  const lighter = hslToHex(h, Math.min(s + 5, 100), Math.min(l + 6, 100));
  return `radial-gradient(ellipse at 50% 40%, ${lighter}, ${baseHex})`;
}
