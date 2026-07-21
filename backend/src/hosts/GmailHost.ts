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
import { checkHyperlink } from '../checks/HyperlinkCheck';

/**
 * Parses Gmail compose draft HTML body and runs pre-send WCAG 2.1 AA checks.
 */
export function auditGmailDraftHtml(htmlContent: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  if (!htmlContent) return issues;

  // 1. Scan <a> links in draft HTML for WCAG 2.4.4 Link Purpose
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  let linkIdx = 0;

  while ((match = linkRegex.exec(htmlContent)) !== null) {
    linkIdx++;
    const url = match[1];
    const rawAnchor = match[2].replace(/<[^>]+>/g, '').trim();

    if (rawAnchor) {
      const issue = checkHyperlink(`gmail_link_${linkIdx}`, 'Email Link', rawAnchor, url);
      if (issue) {
        issues.push(issue);
      }
    }
  }

  // 2. Scan <img> tags in draft HTML for WCAG 1.1.1 Image Alt Text
  const imgRegex = /<img\s+([^>]*)\/?>/gi;
  let imgIdx = 0;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    imgIdx++;
    const attributes = match[1];
    const altMatch = /alt=["']([^"']*)["']/i.exec(attributes);
    const altText = altMatch ? altMatch[1].trim() : null;

    if (altText === null || altText === '') {
      issues.push({
        elementId: `gmail_img_${imgIdx}`,
        elementType: 'Inline Email Image',
        issueType: 'Alternative Text',
        severity: 'ERROR',
        wcagRule: 'WCAG 1.1.1 Non-text Content',
        title: `Missing alternative text on inline email image #${imgIdx}`,
        description: 'Recipients using screen readers cannot perceive inline graphics in emails without descriptive alternative text.',
        snippet: `Inline Image #${imgIdx}`,
        canAutoFix: false,
      });
    }
  }

  return issues;
}

/**
 * Builds native Google Workspace CardService UI for Gmail compose window.
 */
export function buildGmailComposeCard(e: any): GoogleAppsScript.Card_Service.Card {
  const builder = CardService.newCardBuilder();
  builder.setHeader(CardService.newCardHeader().setTitle('Email Accessibility Checker'));

  const section = CardService.newCardSection();

  try {
    const draftId = e?.gmail?.draftId;
    let htmlBody = '';

    if (draftId && typeof GmailApp !== 'undefined') {
      const draft = GmailApp.getDraft(draftId);
      if (draft) {
        htmlBody = draft.getMessage().getBody();
      }
    }

    const issues = auditGmailDraftHtml(htmlBody);

    if (issues.length === 0) {
      const textWidget = CardService.newTextParagraph().setText('<b>✓ All Clear!</b><br>No accessibility issues detected in your draft email.');
      section.addWidget(textWidget);
    } else {
      const headerWidget = CardService.newTextParagraph().setText(`<b>Found ${issues.length} Accessibility Issue(s)</b>`);
      section.addWidget(headerWidget);

      issues.forEach((issue) => {
        const keyText = `<b>${issue.severity}</b>: ${issue.title}<br><i>${issue.description}</i>`;
        section.addWidget(CardService.newTextParagraph().setText(keyText));
      });
    }
  } catch (err: any) {
    section.addWidget(CardService.newTextParagraph().setText(`Audit Error: ${err.message || err}`));
  }

  builder.addSection(section);
  return builder.build();
}
