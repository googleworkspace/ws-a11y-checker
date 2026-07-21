/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Color utility functions for computing WCAG 2.1 AA relative luminance and suggested compliant hex swatches.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Converts hex color string (#RRGGBB or #RGB) to RGB object (0-255).
 */
export function hexToRgb(hex: string): RGB {
  let cleaned = hex.replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts RGB (0-255) to hex string (#RRGGBB).
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Calculates WCAG 2.1 relative luminance (0.0 to 1.0) of an RGB color.
 */
export function getRelativeLuminance(rgb: RGB): number {
  const transform = (val: number) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = transform(rgb.r);
  const g = transform(rgb.g);
  const b = transform(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes contrast ratio between two hex colors (returns value >= 1.0).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hexToRgb(hex1));
  const l2 = getRelativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Converts RGB (0-255) to HSL (h: 0-360, s: 0-1, l: 0-1).
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
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
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

/**
 * Converts HSL to RGB (0-255).
 */
export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  const hNormalized = h / 360;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, hNormalized + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNormalized) * 255),
    b: Math.round(hue2rgb(p, q, hNormalized - 1 / 3) * 255),
  };
}

/**
 * Suggests a WCAG AA compliant hex color (>= 4.5:1) for foreground text against a background color,
 * preserving original hue and saturation by adjusting lightness.
 */
export function suggestCompliantColor(fgHex: string, bgHex: string, targetRatio = 4.5): string {
  if (getContrastRatio(fgHex, bgHex) >= targetRatio) {
    return fgHex.toUpperCase();
  }

  const bgLuminance = getRelativeLuminance(hexToRgb(bgHex));
  const hsl = rgbToHsl(hexToRgb(fgHex));

  // Determine whether to darken or lighten text based on background luminance
  const darkenText = bgLuminance > 0.179; // Midpoint threshold
  let step = darkenText ? -0.02 : 0.02;

  while (hsl.l >= 0 && hsl.l <= 1) {
    hsl.l += step;
    const candidateHex = rgbToHex(hslToRgb(hsl));
    if (getContrastRatio(candidateHex, bgHex) >= targetRatio) {
      return candidateHex;
    }
  }

  // Fallback to black or white if target ratio cannot be reached preserving hue
  return darkenText ? '#000000' : '#FFFFFF';
}
