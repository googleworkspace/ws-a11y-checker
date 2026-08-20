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
 * Alternative Text inspection module for images and visual elements.
 */
import { AccessibilityIssue } from '../models/Issue';

const REDUNDANT_PREFIXES = [
  'image of', 'picture of', 'screenshot of', 'photo of',
  'graphic of', 'diagram of', 'chart showing', 'chart of',
  'graph of', 'visual of', 'drawing of', 'icon of',
  'illustration of', 'sketch of', 'table showing'
];

/**
 * Checks image or visual element for missing or redundant alternative text.
 */
export function checkAltText(
  elementId: string,
  elementType: string,
  title: string,
  description: string
): AccessibilityIssue | null {
  const combined = `${title || ''} ${description || ''}`.trim();

  // Check 1: Missing alt text entirely
  if (!combined) {
    return {
      elementId,
      elementType,
      issueType: 'Alternative Text',
      severity: 'ERROR',
      wcagRule: 'WCAG 1.1.1 Non-text Content',
      title: `Missing alternative text on ${elementType}`,
      description: 'Screen reader users cannot perceive images or visual elements without descriptive alternative text.',
      snippet: `${elementType} [ID: ${elementId}]`,
      canAutoFix: true,
      fixMetadata: { isImage: true, currentAlt: '' },
    };
  }

  // Check 2: Redundant phrases (e.g., "image of")
  const lower = combined.toLowerCase();
  for (const prefix of REDUNDANT_PREFIXES) {
    if (lower.startsWith(prefix)) {
      const suggestedClean = combined.substring(prefix.length).trim();
      const capitalizedClean = suggestedClean.charAt(0).toUpperCase() + suggestedClean.slice(1);
      return {
        elementId,
        elementType,
        issueType: 'Alternative Text',
        severity: 'WARNING',
        wcagRule: 'WCAG 1.1.1 Non-text Content',
        title: `Redundant alt text phrase ("${prefix}...")`,
        description: 'Screen readers already announce elements as graphics. Avoid redundant phrases like "image of".',
        snippet: combined.substring(0, 50),
        canAutoFix: true,
        fixMetadata: { isImage: true, currentAlt: combined, suggestedCleanAlt: capitalizedClean || 'Descriptive visual graphic' },
      };
    }
  }

  return null;
}
