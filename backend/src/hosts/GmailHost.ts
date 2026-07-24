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
export function auditGmailDraftHtml(htmlContent: string, debugLog?: string[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  if (!htmlContent) {
    debugLog?.push('⚠️ auditGmailDraftHtml called with empty HTML content.');
    return issues;
  }

  debugLog?.push(`Starting WCAG 2.1 AA audit on draft HTML (${htmlContent.length} bytes)...`);

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

  debugLog?.push(`Audit complete: Scanned ${linkIdx} hyperlink(s) and ${imgIdx} image(s). Found ${issues.length} issue(s).`);
  console.log(`[auditGmailDraftHtml] Scanned links: ${linkIdx}, images: ${imgIdx}, issues found: ${issues.length}`);

  return issues;
}

/**
 * Helper to retrieve draft HTML body and subject from event object or latest active draft in Gmail with detailed logging.
 */
function resolveDraftContent(e: any): { htmlBody: string; subject: string; debugLog: string[] } {
  let htmlBody = '';
  let subject = '';
  const debugLog: string[] = [];

  const timeStr = new Date().toISOString();
  debugLog.push(`[${timeStr}] Starting draft resolution...`);
  console.log('[resolveDraftContent] Event object:', JSON.stringify(e || {}));
  debugLog.push(`Event keys present: ${e ? Object.keys(e).join(', ') : 'null'}`);

  if (e && e.gmail) {
    debugLog.push(`e.gmail keys: ${Object.keys(e.gmail).join(', ')}`);
    if (e.gmail.draftMetadata) {
      debugLog.push(`e.gmail.draftMetadata: ${JSON.stringify(e.gmail.draftMetadata)}`);
    }
  }

  const draftId = e?.gmail?.draftMetadata?.id || e?.gmail?.draftId || e?.draftMetadata?.id || e?.draftMetadata?.draftId || e?.draftId || e?.gmail?.id || e?.id;
  debugLog.push(`Resolved target draftId from event: ${draftId || '(none)'}`);

  if (draftId && typeof GmailApp !== 'undefined') {
    try {
      debugLog.push(`Calling GmailApp.getDraft("${draftId}")...`);
      const draft = GmailApp.getDraft(draftId);
      if (draft) {
        debugLog.push('Draft found via ID. Fetching message subject & body...');
        const msg = draft.getMessage();
        htmlBody = msg.getBody();
        subject = msg.getSubject() || '(Untitled Draft)';
        debugLog.push(`✓ Successfully loaded draft via ID: "${subject}" (${htmlBody.length} bytes HTML)`);
        console.log(`[resolveDraftContent] Loaded draft via ID: ${draftId}, length: ${htmlBody.length}`);
      } else {
        debugLog.push(`⚠️ GmailApp.getDraft("${draftId}") returned null/undefined.`);
        console.warn(`[resolveDraftContent] getDraft returned null for id: ${draftId}`);
      }
    } catch (err: any) {
      const errMsg = `Error calling GmailApp.getDraft("${draftId}"): ${err.message || err}`;
      console.error(errMsg, err);
      debugLog.push(`❌ ${errMsg}`);
    }
  }

  if (!htmlBody && typeof GmailApp !== 'undefined') {
    try {
      debugLog.push('No draft content loaded via event ID. Calling GmailApp.getDrafts() to inspect active user drafts...');
      const drafts = GmailApp.getDrafts();
      debugLog.push(`GmailApp.getDrafts() returned ${drafts ? drafts.length : 0} draft(s).`);
      console.log(`[resolveDraftContent] getDrafts() count: ${drafts ? drafts.length : 0}`);

      if (drafts && drafts.length > 0) {
        const latestDraft = drafts[0];
        const latestId = latestDraft.getId();
        debugLog.push(`Inspecting latest draft in inbox (ID: ${latestId})...`);
        const msg = latestDraft.getMessage();
        htmlBody = msg.getBody();
        subject = msg.getSubject() || '(Untitled Draft)';
        debugLog.push(`✓ Successfully loaded latest draft: "${subject}" (${htmlBody.length} bytes HTML)`);
        console.log(`[resolveDraftContent] Loaded latest draft ID: ${latestId}, length: ${htmlBody.length}`);
      } else {
        debugLog.push('⚠️ No drafts found in GmailApp.getDrafts(). Note: When composing in Gmail web, you must type a recipient or subject and wait ~2 seconds for Gmail to auto-save the draft to the server before checking.');
        console.warn('[resolveDraftContent] No drafts returned by GmailApp.getDrafts()');
      }
    } catch (err: any) {
      const errMsg = `Error calling GmailApp.getDrafts(): ${err.message || err}`;
      console.error(errMsg, err);
      debugLog.push(`❌ ${errMsg}`);
    }
  }

  if (typeof GmailApp === 'undefined') {
    const errMsg = '❌ GmailApp global service is undefined in this Apps Script execution context!';
    console.error(errMsg);
    debugLog.push(errMsg);
  }

  return { htmlBody, subject, debugLog };
}

/**
 * Helper to check for OAuth scope permission errors and render an actionable re-authorization card.
 */
function checkAndRenderPermissionError(section: GoogleAppsScript.Card_Service.CardSection, debugLog: string[]): boolean {
  const hasPermissionError = debugLog.some((l) =>
    l.toLowerCase().includes('does not have permission') ||
    l.toLowerCase().includes('required permissions') ||
    l.toLowerCase().includes('authorization')
  );

  if (hasPermissionError) {
    section.addWidget(
      CardService.newTextParagraph().setText(
        '<b>🔐 Authorization Required for Email Drafts</b><br><br>' +
        'To audit your active draft email from the sidebar, Google Apps Script requires permission to inspect Gmail drafts (<code>gmail.readonly</code> / <code>gmail.compose</code>). Because these permissions were recently added to the add-on manifest, your current Gmail session is running under earlier permissions.<br><br>' +
        '<b>How to grant permissions (takes 10 seconds):</b><br>' +
        '1. Open any Google Doc, Slide, Sheet, or Form.<br>' +
        '2. Go to top menu: <b>Extensions → Accessibility Checker → Show Sidebar</b>.<br>' +
        '3. Google Apps Script will pop up an <b>Authorization Required</b> dialog. Click <b>Review Permissions → Allow</b>.<br>' +
        '4. Return here to Gmail and click <b>Re-check Current Draft</b> below!'
      )
    );
    const checkAction = CardService.newAction().setFunctionName('refreshGmailHomepageCard');
    section.addWidget(
      CardService.newTextButton()
        .setText('🔄 Re-check Current Draft')
        .setOnClickAction(checkAction)
    );
    return true;
  }
  return false;
}

/**
 * Helper to append diagnostic logs section to a CardBuilder.
 */
function addDiagnosticLogSection(builder: GoogleAppsScript.Card_Service.CardBuilder, debugLog: string[]) {
  if (!debugLog || debugLog.length === 0) return;
  const hasError = debugLog.some((l) => l.includes('❌') || l.includes('⚠️') || l.includes('Error'));
  const logSection = CardService.newCardSection()
    .setHeader('🛠️ Diagnostic Logs (Console / Execution)')
    .setCollapsible(true);

  if (hasError) {
    logSection.setNumUncollapsibleWidgets(debugLog.length);
  } else {
    logSection.setNumUncollapsibleWidgets(1);
  }

  const logText = debugLog.map((line) => `• ${line}`).join('<br>');
  logSection.addWidget(CardService.newTextParagraph().setText(`<font color="#5f6368">${logText}</font>`));
  builder.addSection(logSection);
}

/**
 * Builds native Google Workspace CardService UI for Gmail compose window toolbar.
 */
export function buildGmailComposeCard(e: any): GoogleAppsScript.Card_Service.Card[] {
  const builder = CardService.newCardBuilder();
  builder.setHeader(CardService.newCardHeader().setTitle('Email Accessibility Checker'));

  const section = CardService.newCardSection();

  try {
    const { htmlBody, subject, debugLog } = resolveDraftContent(e);

    if (htmlBody) {
      if (subject) {
        section.addWidget(CardService.newTextParagraph().setText(`<b>Draft:</b> ${subject}`));
      }
      const issues = auditGmailDraftHtml(htmlBody, debugLog);

      if (issues.length === 0) {
        const textWidget = CardService.newTextParagraph().setText('<b>✓ All Clear!</b><br>No WCAG 2.1 Level AA link or image accessibility issues detected in your draft email.');
        section.addWidget(textWidget);
      } else {
        const headerWidget = CardService.newTextParagraph().setText(`<b>Found ${issues.length} Accessibility Issue(s)</b>`);
        section.addWidget(headerWidget);

        issues.forEach((issue) => {
          const keyText = `<b>${issue.severity}</b>: ${issue.title}<br><i>${issue.description}</i>`;
          section.addWidget(CardService.newTextParagraph().setText(keyText));
        });
      }
    } else {
      if (!checkAndRenderPermissionError(section, debugLog)) {
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
    }

    builder.addSection(section);
    addDiagnosticLogSection(builder, debugLog);
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
    const { htmlBody, subject, debugLog } = resolveDraftContent(e);

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

      const issues = auditGmailDraftHtml(htmlBody, debugLog);

      if (issues.length === 0) {
        section.addWidget(
          CardService.newTextParagraph().setText('<b>✓ All Clear!</b><br>No WCAG 2.1 Level AA link or image accessibility issues detected in your draft email.')
        );
      } else {
        section.addWidget(
          CardService.newTextParagraph().setText(`<b>Found ${issues.length} Accessibility Issue(s)</b>`)
        );
        issues.forEach((issue) => {
          const keyText = `<b>${issue.severity}</b>: ${issue.title}<br><i>${issue.description}</i>`;
          section.addWidget(CardService.newTextParagraph().setText(keyText));
        });
      }
    } else {
      if (!checkAndRenderPermissionError(section, debugLog)) {
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
    }

    builder.addSection(section);
    addDiagnosticLogSection(builder, debugLog);
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
  console.log('[refreshGmailHomepageCard] Action triggered with event:', JSON.stringify(e || {}));
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
    const debugLog: string[] = [];

    debugLog.push(`[${new Date().toISOString()}] Auditing message ID: ${messageId || '(none)'}`);

    if (messageId && typeof GmailApp !== 'undefined') {
      try {
        const msg = GmailApp.getMessageById(messageId);
        if (msg) {
          htmlBody = msg.getBody();
          msgSubject = msg.getSubject() || '(Untitled Message)';
          debugLog.push(`✓ Loaded message "${msgSubject}" (${htmlBody.length} bytes HTML)`);
        } else {
          debugLog.push(`⚠️ GmailApp.getMessageById("${messageId}") returned null.`);
        }
      } catch (err: any) {
        const errMsg = `Error fetching message: ${err.message || err}`;
        console.error(errMsg, err);
        debugLog.push(`❌ ${errMsg}`);
      }
    }

    if (htmlBody) {
      section.addWidget(
        CardService.newTextParagraph().setText(`<b>Auditing Message:</b> ${msgSubject}`)
      );

      const issues = auditGmailDraftHtml(htmlBody, debugLog);

      if (issues.length === 0) {
        section.addWidget(
          CardService.newTextParagraph().setText('<b>✓ All Clear!</b><br>No WCAG 2.1 Level AA link or image accessibility issues detected in this email.')
        );
      } else {
        section.addWidget(
          CardService.newTextParagraph().setText(`<b>Found ${issues.length} Accessibility Issue(s)</b>`)
        );
        issues.forEach((issue) => {
          const keyText = `<b>${issue.severity}</b>: ${issue.title}<br><i>${issue.description}</i>`;
          section.addWidget(CardService.newTextParagraph().setText(keyText));
        });
      }
    } else {
      section.addWidget(CardService.newTextParagraph().setText('Could not load email message content for auditing.'));
    }

    builder.addSection(section);
    addDiagnosticLogSection(builder, debugLog);
  } catch (err: any) {
    section.addWidget(CardService.newTextParagraph().setText(`Audit Error: ${err.message || err}`));
    builder.addSection(section);
  }

  return [builder.build()];
}
