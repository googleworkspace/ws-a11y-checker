import {
  hexToRgb,
  rgbToHex,
  getRelativeLuminance,
  getContrastRatio,
  suggestCompliantColor,
} from '../backend/src/utils/ColorUtil';

describe('ColorUtil', () => {
  describe('hexToRgb', () => {
    it('correctly converts 6-digit hex strings', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#1A73E8')).toEqual({ r: 26, g: 115, b: 232 });
    });

    it('correctly converts 3-digit shorthand hex strings', () => {
      expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    });
  });

  describe('rgbToHex', () => {
    it('converts RGB objects to uppercase hex strings', () => {
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
      expect(rgbToHex({ r: 26, g: 115, b: 232 })).toBe('#1A73E8');
    });
  });

  describe('getRelativeLuminance', () => {
    it('returns 0 for pure black', () => {
      expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    });

    it('returns 1 for pure white', () => {
      expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4);
    });
  });

  describe('getContrastRatio', () => {
    it('returns 21:1 for black text on white background', () => {
      expect(getContrastRatio('#000000', '#FFFFFF')).toBe(21);
    });

    it('returns 1:1 for identical colors', () => {
      expect(getContrastRatio('#FFFFFF', '#FFFFFF')).toBe(1);
      expect(getContrastRatio('#1A73E8', '#1A73E8')).toBe(1);
    });

    it('correctly calculates low contrast for light gray on white', () => {
      const ratio = getContrastRatio('#A0A0A0', '#FFFFFF');
      expect(ratio).toBeLessThan(4.5);
      expect(ratio).toBeCloseTo(2.61, 1);
    });
  });

  describe('suggestCompliantColor', () => {
    it('returns original color if it already meets 4.5:1 ratio', () => {
      const result = suggestCompliantColor('#000000', '#FFFFFF', 4.5);
      expect(result).toBe('#000000');
    });

    it('darkens low contrast color on white background to achieve >= 4.5:1', () => {
      const suggested = suggestCompliantColor('#A0A0A0', '#FFFFFF', 4.5);
      const ratio = getContrastRatio(suggested, '#FFFFFF');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
