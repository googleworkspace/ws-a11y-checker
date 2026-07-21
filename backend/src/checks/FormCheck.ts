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

import { AccessibilityIssue } from '../models/Issue';

/**
 * Runs WCAG 2.1 AA accessibility checks on Google Forms active form.
 */
export function runFormChecks(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  try {
    const form = FormApp.getActiveForm();
    if (!form) return issues;

    // Check 1: Form Title & Description (WCAG 1.3.1 / 3.3.2)
    const formTitle = form.getTitle();
    const formDesc = form.getDescription();
    if (!formDesc || formDesc.trim().length === 0) {
      issues.push({
        elementId: 'form_header',
        elementType: 'Form Description',
        issueType: 'Document Metadata',
        severity: 'NOTICE',
        wcagRule: 'WCAG 3.3.2 Labels or Instructions',
        title: 'Missing main form description instructions',
        description: 'Provide a brief summary of the form purpose and completion time to assist screen reader users.',
        snippet: formTitle,
        canAutoFix: false,
      });
    }

    // Check 2: Form Items Audit
    const items = form.getItems();
    items.forEach((item, idx) => {
      const itemTitle = item.getTitle();
      const itemType = item.getType().toString();
      const itemId = `form_item_${item.getId()}`;

      // WCAG 3.3.2 Question Help Text / Instructions
      if (!itemTitle || itemTitle.trim().length === 0) {
        issues.push({
          elementId: itemId,
          elementType: 'Form Question',
          issueType: 'Document Metadata',
          severity: 'ERROR',
          wcagRule: 'WCAG 3.3.2 Labels or Instructions',
          title: `Unlabelled form item #${idx + 1}`,
          description: 'Every form question item must provide a descriptive label or title.',
          snippet: `Item #${idx + 1} [Type: ${itemType}]`,
          canAutoFix: false,
        });
      }

      // WCAG 1.1.1 Image Item Alt Text
      if (itemType === 'IMAGE') {
        const imgItem = item.asImageItem();
        const helpText = imgItem.getHelpText() || '';
        if (!helpText.trim()) {
          issues.push({
            elementId: itemId,
            elementType: 'Form Image',
            issueType: 'Alternative Text',
            severity: 'ERROR',
            wcagRule: 'WCAG 1.1.1 Non-text Content',
            title: `Missing alternative text caption on Form Image #${idx + 1}`,
            description: 'Form images must provide descriptive text via the Item Help Text field.',
            snippet: itemTitle || `Form Image #${idx + 1}`,
            canAutoFix: false,
          });
        }
      }

      // WCAG 1.3.1 Section Page Break Titles
      if (itemType === 'PAGE_BREAK') {
        const pbItem = item.asPageBreakItem();
        if (!pbItem.getTitle() || pbItem.getTitle().trim().length === 0) {
          issues.push({
            elementId: itemId,
            elementType: 'Form Section Header',
            issueType: 'Heading Structure',
            severity: 'WARNING',
            wcagRule: 'WCAG 1.3.1 Info and Relationships',
            title: `Untitled form section header (Section #${idx + 1})`,
            description: 'Multi-page forms must provide descriptive section headers for screen reader navigation.',
            snippet: `Page Break #${idx + 1}`,
            canAutoFix: false,
          });
        }
      }
    });
  } catch (e) {
    // Not in Google Forms
  }

  return issues;
}
