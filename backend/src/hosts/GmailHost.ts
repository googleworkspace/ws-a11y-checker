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
        issue.canAutoFix = true;
        const domain = url.replace(/^https?:\/\//i, '').split('/')[0] || 'destination link';
        (issue as any).url = url;
        (issue as any).rawAnchor = rawAnchor;
        (issue as any).suggestedText = `${rawAnchor} (${domain})`;
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
      const imgIssue: any = {
        elementId: `gmail_img_${imgIdx}`,
        elementType: 'Inline Email Image',
        issueType: 'Alternative Text',
        severity: 'ERROR',
        wcagRule: 'WCAG 1.1.1 Non-text Content',
        title: `Missing alternative text on inline email image #${imgIdx}`,
        description: 'Recipients using screen readers cannot perceive inline graphics in emails without descriptive alternative text.',
        snippet: `Inline Image #${imgIdx}`,
        canAutoFix: true,
        imgIdx: imgIdx,
        suggestedAlt: 'Inline email attachment graphic',
      };
      issues.push(imgIssue);
    }
  }

  return issues;
}

/**
 * Helper to retrieve draft HTML body and subject from event object or latest active draft in Gmail.
 */
function resolveDraftContent(e: any): { htmlBody: string; subject: string; draftId: string } {
  let htmlBody = '';
  let subject = '';

  const draftId = e?.gmail?.draftMetadata?.id || e?.gmail?.draftId || e?.draftMetadata?.id || e?.draftMetadata?.draftId || e?.draftId || e?.gmail?.id || e?.id || '';

  if (draftId && typeof GmailApp !== 'undefined') {
    try {
      const draft = GmailApp.getDraft(draftId);
      if (draft) {
        const msg = draft.getMessage();
        htmlBody = msg.getBody();
        subject = msg.getSubject() || '(Untitled Draft)';
      }
    } catch (err) {}
  }

  if (!htmlBody && typeof GmailApp !== 'undefined') {
    try {
      const drafts = GmailApp.getDrafts();
      if (drafts && drafts.length > 0) {
        const latestDraft = drafts[0];
        const msg = latestDraft.getMessage();
        htmlBody = msg.getBody();
        subject = msg.getSubject() || '(Untitled Draft)';
        return { htmlBody, subject, draftId: latestDraft.getId() };
      }
    } catch (err) {}
  }

  return { htmlBody, subject, draftId };
}

/**
 * Helper to render issues with 1-click Quick Fix auto-remediation buttons on Gmail cards.
 */
function renderIssuesWithQuickFix(section: GoogleAppsScript.Card_Service.CardSection, issues: AccessibilityIssue[], draftId: string) {
  issues.forEach((issue: any) => {
    const keyText = `<b>${issue.severity}</b>: ${issue.title}<br><i>${issue.description}</i>`;
    section.addWidget(CardService.newTextParagraph().setText(keyText));

    if (issue.canAutoFix) {
      const fixAction = CardService.newAction()
        .setFunctionName('rpcApplyGmailFix')
        .setParameters({
          issueId: issue.elementId || '',
          fixType: issue.issueType === 'Alternative Text' ? 'ALT_TEXT' : 'LINK',
          draftId: draftId || '',
          url: issue.url || '',
          oldText: issue.rawAnchor || '',
          newText: issue.suggestedText || '',
          imgIdx: String(issue.imgIdx || 1),
          suggestedAlt: issue.suggestedAlt || 'Inline email graphic',
        });

      const buttonText = issue.issueType === 'Alternative Text'
        ? `✨ Quick Fix: Add Alt Text ("${issue.suggestedAlt}")`
        : `✨ Quick Fix: Rename Link ("${issue.suggestedText}")`;

      section.addWidget(
        CardService.newTextButton()
          .setText(buttonText)
          .setOnClickAction(fixAction)
      );
    }
  });
}

/**
 * Applies 1-click quick fixes (link renaming or alt text insertion) directly into the Gmail compose draft HTML body.
 */
export function rpcApplyGmailFix(e: any): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
  const fixType = e.parameters['fixType'];
  const draftId = e.parameters['draftId'];

  let htmlBody = '';
  if (draftId && typeof GmailApp !== 'undefined') {
    try {
      const draft = GmailApp.getDraft(draftId);
      if (draft) htmlBody = draft.getMessage().getBody();
    } catch (err) {}
  }
  if (!htmlBody && typeof GmailApp !== 'undefined') {
    try {
      const drafts = GmailApp.getDrafts();
      if (drafts && drafts.length > 0) htmlBody = drafts[0].getMessage().getBody();
    } catch (err) {}
  }

  let updatedHtml = htmlBody;

  if (fixType === 'LINK') {
    const oldUrl = e.parameters['url'];
    const oldText = e.parameters['oldText'];
    const newText = e.parameters['newText'] || `${oldText} (descriptive link)`;
    if (oldUrl && oldText) {
      const escapedUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(<a\\s+[^>]*href=["']${escapedUrl}["'][^>]*>)${oldText}(<\\/a>)`, 'gi');
      updatedHtml = updatedHtml.replace(regex, `$1${newText}$2`);
    }
  } else if (fixType === 'ALT_TEXT') {
    const targetIdx = parseInt(e.parameters['imgIdx'], 10) || 1;
    const suggestedAlt = e.parameters['suggestedAlt'] || 'Inline email graphic';
    let currIdx = 0;
    updatedHtml = updatedHtml.replace(/<img\s+([^>]*)\/?>/gi, (match, attrs) => {
      currIdx++;
      if (currIdx === targetIdx) {
        if (/alt=["'][^"']*["']/i.test(attrs)) {
          return match.replace(/alt=["'][^"']*["']/i, `alt="${suggestedAlt}"`);
        } else {
          return `<img alt="${suggestedAlt}" ${attrs}>`;
        }
      }
      return match;
    });
  }

  const response = CardService.newUpdateDraftActionResponseBuilder()
    .setUpdateDraftBodyAction(
      CardService.newUpdateDraftBodyAction()
        .addUpdateContent(updatedHtml, CardService.ContentType.TEXT)
        .setUpdateType(CardService.UpdateDraftBodyType.REPLACE)
    )
    .build();

  return response;
}

/**
 * Builds native Google Workspace CardService UI for Gmail compose window toolbar.
 */
export function buildGmailComposeCard(e: any): GoogleAppsScript.Card_Service.Card[] {
  const builder = CardService.newCardBuilder();
  builder.setHeader(CardService.newCardHeader().setTitle('Email Accessibility Checker'));

  const section = CardService.newCardSection();

  try {
    const { htmlBody, subject, draftId } = resolveDraftContent(e);

    if (htmlBody) {
      if (subject) {
        section.addWidget(CardService.newTextParagraph().setText(`<b>Draft:</b> ${subject}`));
      }
      const issues = auditGmailDraftHtml(htmlBody);

      if (issues.length === 0) {
        const textWidget = CardService.newTextParagraph().setText('<b>✓ All Clear!</b><br>No WCAG 2.1 Level AA link or image accessibility issues detected in your draft email.');
        section.addWidget(textWidget);
      } else {
        const headerWidget = CardService.newTextParagraph().setText(`<b>Found ${issues.length} Accessibility Issue(s)</b>`);
        section.addWidget(headerWidget);
        renderIssuesWithQuickFix(section, issues, draftId);
      }
    } else {
      section.addWidget(
        CardService.newTextParagraph().setText(
          '<b>⚠️ No Active Draft Content Detected</b><br><br>' +
          'When invoked, the add-on checks for your active email draft. No saved draft body was found right now.<br><br>' +
          '<b>How to audit your email:</b><br>' +
          '1. Type a recipient, subject, or message body in the compose window.<br>' +
          '2. Wait ~2 seconds for Gmail to auto-save the draft to the server.<br>' +
          '3. Re-open or click check below.'
        )
      );
    }

    builder.addSection(section);
  } catch (err: any) {
    section.addWidget(CardService.newTextParagraph().setText(`Audit Error: ${err.message || err}`));
    builder.addSection(section);
  }

  return [builder.build()];
}

/**
 * Builds native Google Workspace CardService UI for Gmail homepage / right-hand sidebar.
 */
export function buildGmailHomepageCard(e: any): GoogleAppsScript.Card_Service.Card[] {
  const builder = CardService.newCardBuilder();
  builder.setHeader(CardService.newCardHeader().setTitle('Email Accessibility Checker'));

  const section = CardService.newCardSection();

  try {
    const { htmlBody, subject, draftId } = resolveDraftContent(e);

    if (htmlBody) {
      section.addWidget(
        CardService.newTextParagraph().setText(`<b>Checking Draft:</b> ${subject || '(Untitled Draft)'}`)
      );

      const refreshAction = CardService.newAction().setFunctionName('refreshGmailHomepageCard');
      section.addWidget(
        CardService.newTextButton()
          .setText('🔄 Refresh Audit')
          .setOnClickAction(refreshAction)
      );

      const issues = auditGmailDraftHtml(htmlBody);

      if (issues.length === 0) {
        section.addWidget(
          CardService.newTextParagraph().setText('<b>✓ All Clear!</b><br>No WCAG 2.1 Level AA link or image accessibility issues detected in your draft email.')
        );
      } else {
        section.addWidget(
          CardService.newTextParagraph().setText(`<b>Found ${issues.length} Accessibility Issue(s)</b>`)
        );
        renderIssuesWithQuickFix(section, issues, draftId);
      }
    } else {
      section.addWidget(
        CardService.newTextParagraph().setText(
          '<b>⚠️ No Active Draft Content Found</b><br><br>' +
          'When you click check, we search for your active email draft in Gmail. No saved draft body was found right now.<br><br>' +
          '<b>How to check your email:</b><br>' +
          '1. Start composing a new email or reply in Gmail.<br>' +
          '2. Type a recipient, subject, or message body (wait ~2 seconds for Gmail to auto-save the draft to the server).<br>' +
          '3. Click <b>Re-check Current Draft</b> below.'
        )
      );
      const checkAction = CardService.newAction().setFunctionName('refreshGmailHomepageCard');
      section.addWidget(
        CardService.newTextButton()
          .setText('🔄 Re-check Current Draft')
          .setOnClickAction(checkAction)
      );
    }

    builder.addSection(section);
  } catch (err: any) {
    section.addWidget(CardService.newTextParagraph().setText(`Audit Error: ${err.message || err}`));
    builder.addSection(section);
  }

  return [builder.build()];
}

/**
 * Action handler for refreshing the homepage card without duplicating card stack.
 */
export function refreshGmailHomepageCard(e: any): GoogleAppsScript.Card_Service.ActionResponse {
  const cards = buildGmailHomepageCard(e);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(cards[0]))
    .build();
}

/**
 * Builds native Google Workspace CardService UI when viewing a received or sent email message.
 */
export function buildGmailMessageCard(e: any): GoogleAppsScript.Card_Service.Card[] {
  const builder = CardService.newCardBuilder();
  builder.setHeader(CardService.newCardHeader().setTitle('Email Accessibility Checker'));

  const section = CardService.newCardSection();

  try {
    const messageId = e?.gmail?.messageId || e?.messageMetadata?.messageId || e?.gmail?.messageMetadata?.messageId;
    let htmlBody = '';
    let msgSubject = '';

    if (messageId && typeof GmailApp !== 'undefined') {
      try {
        const msg = GmailApp.getMessageById(messageId);
        if (msg) {
          htmlBody = msg.getBody();
          msgSubject = msg.getSubject() || '(Untitled Message)';
        }
      } catch (err) {}
    }

    if (htmlBody) {
      section.addWidget(
        CardService.newTextParagraph().setText(`<b>Auditing Message:</b> ${msgSubject}`)
      );

      const issues = auditGmailDraftHtml(htmlBody);

      if (issues.length === 0) {
        section.addWidget(
          CardService.newTextParagraph().setText('<b>✓ All Clear!</b><br>No WCAG 2.1 Level AA link or image accessibility issues detected in this email.')
        );
      } else {
        section.addWidget(
          CardService.newTextParagraph().setText(`<b>Found ${issues.length} Accessibility Issue(s)</b>`)
        );
        issues.forEach((issue: any) => {
          const keyText = `<b>${issue.severity}</b>: ${issue.title}<br><i>${issue.description}</i>`;
          section.addWidget(CardService.newTextParagraph().setText(keyText));
        });
      }
    } else {
      section.addWidget(CardService.newTextParagraph().setText('Could not load email message content for auditing.'));
    }

    builder.addSection(section);
  } catch (err: any) {
    section.addWidget(CardService.newTextParagraph().setText(`Audit Error: ${err.message || err}`));
    builder.addSection(section);
  }

  return [builder.build()];
}
