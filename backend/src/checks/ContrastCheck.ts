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
 * Color Contrast accessibility inspection and remediation module.
 */
import { AccessibilityIssue } from '../models/Issue';
import { getContrastRatio, suggestCompliantColor } from '../utils/ColorUtil';

/**
 * Checks a Docs Paragraph or Slides Text Element for WCAG 2.1 AA color contrast compliance.
 */
export function checkContrast(
  elementId: string,
  elementType: string,
  text: string,
  fgHex: string,
  bgHex: string,
  fontSizePt: number,
  isBold: boolean
): AccessibilityIssue | null {
  if (!text || !text.trim() || !fgHex || !bgHex) {
    return null;
  }

  // Threshold: 3.0:1 for large text (>= 18pt or >= 14pt bold), 4.5:1 for normal text
  const isLargeText = fontSizePt >= 18 || (fontSizePt >= 14 && isBold);
  const targetRatio = isLargeText ? 3.0 : 4.5;
  const currentRatio = getContrastRatio(fgHex, bgHex);

  if (currentRatio >= targetRatio) {
    return null;
  }

  const suggestedHex = suggestCompliantColor(fgHex, bgHex, targetRatio);

  return {
    elementId,
    elementType,
    issueType: 'Color Contrast',
    severity: 'ERROR',
    wcagRule: 'WCAG 1.4.3 Contrast (Minimum)',
    title: `Low color contrast ratio (${currentRatio}:1)`,
    description: `Text has a contrast ratio of ${currentRatio}:1 against its background, failing the WCAG 2.1 AA requirement of at least ${targetRatio}:1.`,
    snippet: text.trim().substring(0, 50),
    canAutoFix: true,
    fixMetadata: {
      currentHex: fgHex,
      suggestedHex: suggestedHex,
      contrastRatio: currentRatio,
    },
  };
}
