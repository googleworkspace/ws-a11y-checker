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
 * Heading structure and list accessibility check module for Google Docs.
 */
import { AccessibilityIssue } from '../models/Issue';

export const SIMULATED_LIST_REGEX = /^(\s*([*•▪▫►❖➢·⁃\u2013\u2014]|[-+](?=\s)|(o|O)(?=\s)|\d+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]\))(\s*))/;

/**
 * Scans document paragraphs for heading structure issues, faux headings, and manual bullet lists,
 * ensuring logical cascading starting from Heading 1.
 */
export function checkHeadingStructureAndLists(
  paragraphs: GoogleAppsScript.Document.Paragraph[]
): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  let hasTitleOrH1 = false;
  let previousLevel = 0; // 0 = Normal/Body, 1 = H1, 2 = H2, etc.

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const text = p.getText().trim();
    if (!text) continue;

    const heading = p.getHeading();
    const elementId = `doc_p_${i}`;

    // Map heading enum to numeric level
    let currentLevel = 0;
    switch (heading) {
      case DocumentApp.ParagraphHeading.TITLE:
      case DocumentApp.ParagraphHeading.HEADING1:
        currentLevel = 1;
        hasTitleOrH1 = true;
        break;
      case DocumentApp.ParagraphHeading.HEADING2:
        currentLevel = 2;
        break;
      case DocumentApp.ParagraphHeading.HEADING3:
        currentLevel = 3;
        break;
      case DocumentApp.ParagraphHeading.HEADING4:
        currentLevel = 4;
        break;
      case DocumentApp.ParagraphHeading.HEADING5:
        currentLevel = 5;
        break;
      case DocumentApp.ParagraphHeading.HEADING6:
        currentLevel = 6;
        break;
      default:
        currentLevel = 0;
    }

    // Check 1: Skipped heading levels & Generic headings
    if (currentLevel > 0) {
      if (previousLevel > 0 && currentLevel > previousLevel + 1) {
        const targetLevel = previousLevel + 1;
        issues.push({
          elementId,
          elementType: 'Paragraph',
          issueType: 'Heading Structure',
          severity: 'WARNING',
          wcagRule: 'WCAG 1.3.1 Info and Relationships',
          title: `Skipped heading level (H${previousLevel} directly followed by H${currentLevel})`,
          description: `Skipping heading ranks confuses screen reader navigation. Use H${targetLevel} instead.`,
          snippet: text.substring(0, 50),
          canAutoFix: true,
          fixMetadata: { suggestedHeadingLevel: `HEADING${targetLevel}` },
        });
      }

      const GENERIC_HEADINGS = ['section', 'details', 'more info', 'continued', 'untitled', 'overview', 'notes', 'misc', 'miscellaneous'];
      if (GENERIC_HEADINGS.includes(text.toLowerCase().trim())) {
        issues.push({
          elementId,
          elementType: 'Paragraph',
          issueType: 'Heading Structure',
          severity: 'NOTICE',
          wcagRule: 'WCAG 2.4.6 Headings and Labels',
          title: `Generic uninformative heading ("${text}")`,
          description: 'Headings should clearly describe the section content under WCAG 2.4.6. Replace generic titles with descriptive topic names.',
          snippet: text,
          canAutoFix: false,
        });
      }

      previousLevel = currentLevel;
    }

    // Check 2: Pseudo-headings / Faux headers (NORMAL text that is bold and >= 14pt)
    if (currentLevel === 0) {
      const isBold = p.editAsText().isBold(0) === true;
      const fontSize = p.editAsText().getFontSize(0) || 11;
      if (isBold && fontSize >= 14 && text.length < 100) {
        // Intelligent Faux Header Hierarchy:
        // If there is no H1 yet in the doc (previousLevel === 0), suggest HEADING1 so doc starts cleanly with Heading 1.
        // Otherwise, suggest cascading immediately below previous level (e.g. HEADING2 under H1).
        const targetNumericLevel = previousLevel === 0 ? 1 : Math.min(6, previousLevel + 1);
        const suggestedEnum = `HEADING${targetNumericLevel}`;

        issues.push({
          elementId,
          elementType: 'Paragraph',
          issueType: 'Heading Structure',
          severity: 'NOTICE',
          wcagRule: 'WCAG 1.3.1 Info and Relationships',
          title: 'Simulated heading (faux header)',
          description: `Large bold text should use semantic Heading styles. Convert to Heading ${targetNumericLevel} to maintain logical cascade.`,
          snippet: text.substring(0, 50),
          canAutoFix: true,
          fixMetadata: { suggestedHeadingLevel: suggestedEnum },
        });

        // Treat faux heading as its suggested level so subsequent faux headers cascade properly (H1 -> H2 -> H3)
        previousLevel = targetNumericLevel;
        if (targetNumericLevel === 1) {
          hasTitleOrH1 = true;
        }
      }
    }

    // Check 3: Simulated list items (any paragraph that is not a native list item but starts with manual list characters)
    if (p.getType() !== DocumentApp.ElementType.LIST_ITEM && SIMULATED_LIST_REGEX.test(text)) {
      issues.push({
        elementId,
        elementType: 'Paragraph',
        issueType: 'List Formatting',
        severity: 'NOTICE',
        wcagRule: 'WCAG 1.3.1 Info and Relationships',
        title: 'Simulated list item using manual characters',
        description: 'Use native semantic list formatting so screen readers announce item counts and hierarchy.',
        snippet: text.substring(0, 50),
        canAutoFix: true,
      });
    }
  }

  // Check 4: No Document Title or Heading 1 found
  if (!hasTitleOrH1 && paragraphs.length > 0) {
    issues.push({
      elementId: 'doc_p_0',
      elementType: 'Document',
      issueType: 'Heading Structure',
      severity: 'ERROR',
      wcagRule: 'WCAG 1.3.1 Info and Relationships',
      title: 'Missing Document Title or Heading 1',
      description: 'Documents should start with a Title or Heading 1 to establish main semantic hierarchy.',
      snippet: 'Entire document',
      canAutoFix: false,
    });
  }

  return issues;
}
