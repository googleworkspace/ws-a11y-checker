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
 * Typography, alignment, line spacing, and structural whitespace check module for Google Docs.
 */
import { AccessibilityIssue } from '../models/Issue';

/**
 * Checks if a paragraph uses justified alignment.
 */
export function checkTextAlignment(
  elementId: string,
  text: string,
  alignment: GoogleAppsScript.Document.HorizontalAlignment | null
): AccessibilityIssue | null {
  if (!text || text.length < 30) return null;

  if (alignment === DocumentApp.HorizontalAlignment.JUSTIFY) {
    return {
      elementId,
      elementType: 'Paragraph',
      issueType: 'Typography & Legibility',
      severity: 'WARNING',
      wcagRule: 'WCAG 1.4.8 Visual Presentation',
      title: 'Justified text alignment detected',
      description: 'Justified text creates irregular word spacing ("rivers of white space") that impairs readability for users with dyslexia or low vision.',
      snippet: text.substring(0, 50),
      canAutoFix: true,
      fixMetadata: { suggestedHex: 'LEFT' },
    };
  }

  return null;
}

/**
 * Checks if a body paragraph uses cramped line spacing (< 1.15).
 */
export function checkLineSpacing(
  elementId: string,
  text: string,
  lineSpacing: number | null
): AccessibilityIssue | null {
  if (!text || text.length < 40) return null;

  // If lineSpacing is defined and < 1.14 (e.g. tight 1.0 spacing)
  if (lineSpacing !== null && lineSpacing < 1.14 && lineSpacing > 0) {
    return {
      elementId,
      elementType: 'Paragraph',
      issueType: 'Typography & Legibility',
      severity: 'NOTICE',
      wcagRule: 'WCAG 1.4.12 Text Spacing',
      title: `Tight line spacing (${lineSpacing.toFixed(2)}x)`,
      description: 'Cramped vertical line spacing makes tracking lines difficult. WCAG 1.4.12 recommends standard line spacing of at least 1.15x.',
      snippet: text.substring(0, 50),
      canAutoFix: true,
      fixMetadata: { suggestedHex: '1.15' },
    };
  }

  return null;
}

/**
 * Scans document paragraphs for consecutive empty paragraphs used as visual spacers.
 */
export function checkEmptyParagraphSpacers(
  paragraphs: GoogleAppsScript.Document.Paragraph[]
): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  let emptyStreak = 0;
  let firstEmptyIndex = -1;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const text = p.getText().trim();

    if (!text && p.getNumChildren() <= 1) {
      if (emptyStreak === 0) firstEmptyIndex = i;
      emptyStreak++;
    } else {
      if (emptyStreak >= 2) {
        issues.push({
          elementId: `doc_p_${firstEmptyIndex}`,
          elementType: 'Paragraph',
          issueType: 'Typography & Legibility',
          severity: 'NOTICE',
          wcagRule: 'WCAG 1.3.1 Info and Relationships',
          title: `Consecutive empty paragraphs (${emptyStreak} blank lines)`,
          description: 'Using empty lines for vertical spacing causes screen readers to repeatedly announce "blank". Use paragraph SpaceAfter formatting instead.',
          snippet: `[${emptyStreak} empty lines]`,
          canAutoFix: true,
          fixMetadata: { count: emptyStreak },
        });
      }
      emptyStreak = 0;
    }
  }

  return issues;
}
