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
 * Entrypoint functions exported to Google Apps Script runtime.
 */
import { runAllChecks } from './checks/CheckRunner';
import { SIMULATED_LIST_REGEX } from './checks/HeadingCheck';
import { applySlideReadingOrder, getSlideElementsAST, SlideElementAST } from './checks/ElementOrderCheck';
import { buildGmailComposeCard, buildGmailHomepageCard, refreshGmailComposeCard, refreshGmailHomepageCard, buildGmailMessageCard, rpcApplyGmailFix, rpcApplyAllGmailFixes, rpcPopulateGmailDemo, rpcScanLatestDraft } from './hosts/GmailHost';
import { AccessibilityIssue } from './models/Issue';
import { AddonSettings, DEFAULT_SETTINGS } from './models/Settings';
import { rpcGetImageBlob, generateAiAltText, generateAiLinkTitle } from './utils/AiUtil';

/**
 * Creates menu item in Extensions menu when document or slide deck opens.
 */
function onOpen(): void {
  let ui: GoogleAppsScript.Base.Ui | null = null;
  try { ui = DocumentApp.getUi(); } catch (e) {
    try { ui = SlidesApp.getUi(); } catch (e2) {
      try { ui = SpreadsheetApp.getUi(); } catch (e3) {
        try { ui = FormApp.getUi(); } catch (e4) {}
      }
    }
  }

  if (ui) {
    ui.createMenu('Accessibility Checker')
      .addItem('Start Check', 'showSidebar')
      .addItem('Populate Demo Test Suite', 'populateTestCases')
      .addToUi();
  }
}

/**
 * Populates the active document or slide presentation with a comprehensive suite of WCAG 2.1 AA violations for testing.
 */
function populateTestCases(targetId?: string): string {
  try {
    const pres = SlidesApp.getActivePresentation();
    if (pres) {
      return populateSlidesTestCases(pres);
    }
  } catch (e) {}

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      return populateSheetsTestCases(ss);
    }
  } catch (e) {}

  try {
    const form = FormApp.getActiveForm();
    if (form) {
      return populateFormsTestCases(form);
    }
  } catch (e) {}

  let doc: GoogleAppsScript.Document.Document | null = null;
  try {
    if (targetId && typeof targetId === 'string') {
      doc = DocumentApp.openById(targetId);
    } else {
      doc = DocumentApp.getActiveDocument() || DocumentApp.openById('1GJDORhxsPzaktyeqBcAsbiVkaVpGIBSfMePTZ9LRfdA');
    }
  } catch (e) {
    try {
      doc = DocumentApp.openById('1GJDORhxsPzaktyeqBcAsbiVkaVpGIBSfMePTZ9LRfdA');
    } catch (err) {
      throw new Error('Unable to access document for populating test suite.');
    }
  }

  if (!doc) return 'No document accessible.';

  const body = doc.getBody();
  body.appendHorizontalRule();

  // 1. Top-of-doc faux header (16pt bold NORMAL text) -> triggers faux header & missing H1
  const fauxH1 = body.appendParagraph('Google Workspace Accessibility Remediation Test Suite');
  fauxH1.editAsText().setFontSize(16).setBold(true).setForegroundColor('#1a73e8');

  body.appendParagraph('This document contains intentional accessibility barriers designed to test all automated checks and remediation tools in our add-on.').editAsText().setFontSize(11).setBold(false).setForegroundColor('#202124');

  // 2. Skipped Heading Level (H3 right after faux H1)
  const skippedH = body.appendParagraph('Section 1.1: Deeply Nested Architecture (Skipped Heading Level)');
  skippedH.setHeading(DocumentApp.ParagraphHeading.HEADING3);
  body.appendParagraph('This paragraph skips Heading 2, causing navigational disorientation for screen reader users navigating by heading ranks.');

  // 3. Faux header mid-doc (14pt bold NORMAL text)
  const fauxH2 = body.appendParagraph('Section 1.2: Simulated Subheading (Faux Header)');
  fauxH2.editAsText().setFontSize(14).setBold(true).setForegroundColor('#202124');

  // 4. Simulated Manual Bullet List
  body.appendParagraph('- First simulated bullet item formatted using a manual hyphen character.');
  body.appendParagraph('* Second simulated bullet item formatted using an asterisk character.');

  // 5. Low Color Contrast (Normal text)
  const lowContrastNormal = body.appendParagraph('Low Contrast Example: This text has a contrast ratio of 2.1:1 against the white background (#A0A0A0).');
  lowContrastNormal.editAsText().setForegroundColor('#A0A0A0');

  // 6. Low Color Contrast (Text very close to white page color)
  const lowContrastWhite = body.appendParagraph('Near-White Text Example: This critical warning text is colored very close to pure white (#E8E8E8), making it nearly invisible.');
  lowContrastWhite.editAsText().setForegroundColor('#E8E8E8').setFontSize(14).setBold(true);

  // 7. Ambiguous Hyperlinks and Raw URLs
  const linkP = body.appendParagraph('For more information about WCAG 2.1 AA requirements, please click here or learn more about our audit reports. To see the full audit checklist, refer to this or review this document. You can also review https://www.w3.org/TR/WCAG21/ directly.');
  const linkText = linkP.editAsText();
  const clickHereIdx = linkP.getText().indexOf('click here');
  if (clickHereIdx >= 0) linkText.setLinkUrl(clickHereIdx, clickHereIdx + 9, 'https://www.w3.org/WAI/');
  const learnMoreIdx = linkP.getText().indexOf('learn more');
  if (learnMoreIdx >= 0) linkText.setLinkUrl(learnMoreIdx, learnMoreIdx + 9, 'https://www.w3.org/TR/WCAG21/');
  const thisIdx = linkP.getText().indexOf(' refer to this') + 10;
  if (thisIdx >= 10) linkText.setLinkUrl(thisIdx, thisIdx + 3, 'https://www.w3.org/');
  const thisDocIdx = linkP.getText().indexOf('this document');
  if (thisDocIdx >= 0) linkText.setLinkUrl(thisDocIdx, thisDocIdx + 12, 'https://www.w3.org/TR/');

  // 8. Missing and Redundant Alternative Text on Images
  try {
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const blob1 = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', 'sample_missing_alt.png');
    const img1 = body.appendImage(blob1);
    img1.setWidth(120).setHeight(60);
    img1.setAltTitle('');
    img1.setAltDescription('');

    const blob2 = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', 'sample_redundant_alt.png');
    const img2 = body.appendImage(blob2);
    img2.setWidth(120).setHeight(60);
    img2.setAltTitle('Redundant Prefix');
    img2.setAltDescription('image of quarterly sales breakdown chart');
  } catch (e) {
    console.error('Image insertion failed:', e);
  }

  // 9. Justified Text Alignment (WCAG 1.4.8)
  const justifiedP = body.appendParagraph('Justified Text Example: This paragraph uses full justification across margins, creating irregular rivers of white space between words that severely disrupt tracking for dyslexic readers.');
  justifiedP.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);

  // 10. Cramped Line Spacing (WCAG 1.4.12)
  const tightP = body.appendParagraph('Cramped Line Spacing Example: This paragraph uses tight 1.0x single line spacing, failing the WCAG 1.4.12 recommendation of at least 1.15x vertical spacing for body text.');
  tightP.setLineSpacing(1.0);

  // 11. Empty Paragraph Spacers (WCAG 1.3.1)
  body.appendParagraph('');
  body.appendParagraph('');
  body.appendParagraph('');
  body.appendParagraph('Above this line are 3 consecutive empty paragraphs used as vertical spacers, which screen readers announce repeatedly as "blank".');

  // 12. Generic Uninformative Heading (WCAG 2.4.6)
  const genericH = body.appendParagraph('Section');
  genericH.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  // 13. Table Lacking Visual Header Row (WCAG 1.3.1)
  const tbl = body.appendTable([
    ['Employee Name', 'Department Role', 'Status Code'],
    ['Alice Smith', 'Engineering Lead', 'Active'],
    ['Bob Jones', 'Product Manager', 'On Leave']
  ]);
  // Ensure row 0 has unstyled white background matching data rows
  tbl.getRow(0).getCell(0).setBackgroundColor('#FFFFFF');

  doc.saveAndClose();
  return 'Test suite successfully generated.';
}

/**
 * Generates test slides with contrast, alt text, hyperlink, and reading order violations.
 */
function populateSlidesTestCases(pres: GoogleAppsScript.Slides.Presentation): string {
  // Slide 1: Color Contrast & Hyperlinks
  const s1 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  const title1 = s1.insertShape(SlidesApp.ShapeType.TEXT_BOX, 50, 20, 600, 50);
  title1.getText().setText('Demo Test Slide 1: Color Contrast & Hyperlinks').getTextStyle().setFontSize(22).setBold(true);

  const shape1 = s1.insertShape(SlidesApp.ShapeType.TEXT_BOX, 50, 90, 600, 150);
  shape1.getFill().setSolidFill('#FFFFFF');
  const text1 = shape1.getText();
  text1.setText('Low Contrast Warning: This shape text has a low contrast ratio (2.1:1) against white background.\nClick here or learn more about WCAG 2.1 AA slides compliance. Also refer to this or review this page.');
  text1.getTextStyle().setForegroundColor('#A0A0A0').setFontSize(16);
  const clickIdx = text1.asString().indexOf('click here');
  if (clickIdx >= 0) text1.getRange(clickIdx, clickIdx + 9).getTextStyle().setLinkUrl('https://www.w3.org/WAI/');
  const thisSlideIdx = text1.asString().indexOf('refer to this') + 9;
  if (thisSlideIdx >= 9) text1.getRange(thisSlideIdx, thisSlideIdx + 4).getTextStyle().setLinkUrl('https://www.w3.org/');

  // Slide 2: Images with Missing / Redundant Alt Text
  const s2 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  const title2 = s2.insertShape(SlidesApp.ShapeType.TEXT_BOX, 50, 20, 600, 50);
  title2.getText().setText('Slide 2: Image Alternative Text Tests').getTextStyle().setFontSize(22).setBold(true);

  try {
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const blob1 = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', 'missing_alt_slide.png');
    const img1 = s2.insertImage(blob1, 50, 100, 200, 150);
    img1.setTitle('');
    img1.setDescription('');

    const blob2 = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', 'redundant_alt_slide.png');
    const img2 = s2.insertImage(blob2, 300, 100, 200, 150);
    img2.setTitle('Redundant Prefix');
    img2.setDescription('image of architecture diagram flowchart');
  } catch (e) {
    console.error(e);
  }

  // Slide 3: Z-Index Reading Order Test
  const s3 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  const title3 = s3.insertShape(SlidesApp.ShapeType.TEXT_BOX, 50, 20, 600, 50);
  title3.getText().setText('Slide 3: Element Reading Order Test (Deliberately Scrambled)').getTextStyle().setFontSize(20).setBold(true);

  const boxA = s3.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 50, 90, 500, 60);
  boxA.getFill().setSolidFill('#E8F0FE');
  boxA.getText().setText('1. Top Banner Element (Should be read 1st)').getTextStyle().setForegroundColor('#1967D2').setFontSize(14);

  const boxB = s3.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 50, 170, 500, 60);
  boxB.getFill().setSolidFill('#FEF7E0');
  boxB.getText().setText('2. Middle Content Section (Should be read 2nd)').getTextStyle().setForegroundColor('#B06000').setFontSize(14);

  const boxC = s3.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 50, 250, 500, 60);
  boxC.getFill().setSolidFill('#FCE8E6');
  boxC.getText().setText('3. Bottom Footer Note (Should be read 3rd)').getTextStyle().setForegroundColor('#C5221F').setFontSize(14);

  boxC.bringToFront();
  boxB.bringToFront();
  boxA.sendToBack();

  return 'Slides test suite successfully generated.';
}

/**
 * Populates the active spreadsheet with WCAG 2.1 AA test cases for Google Sheets.
 */
function populateSheetsTestCases(ss: GoogleAppsScript.Spreadsheet.Spreadsheet): string {
  const sheet = ss.getActiveSheet();
  sheet.getRange('A1:C10').clear();

  // Header row with low contrast (WCAG 1.4.3) and unfrozen header (WCAG 1.3.1)
  const cellA1 = sheet.getRange('A1');
  cellA1.setValue('Quarterly Metrics Header');
  cellA1.setFontColor('#CCCCCC');
  cellA1.setBackground('#FFFFFF');

  for (let r = 2; r <= 8; r++) {
    sheet.getRange(r, 1).setValue(`Data Item ${r - 1}`);
    sheet.getRange(r, 2).setValue(r * 150);
  }

  return 'Google Sheets test suite successfully populated.';
}

/**
 * Populates the active form with WCAG 2.1 AA test cases for Google Forms.
 */
function populateFormsTestCases(form: GoogleAppsScript.Forms.Form): string {
  form.setDescription(''); // Missing main form description (WCAG 3.3.2)
  const textItem = form.addTextItem();
  textItem.setTitle(''); // Unlabelled question item (WCAG 3.3.2)

  return 'Google Forms test suite successfully populated.';
}

/**
 * Opens the main HTML sidebar UI.
 */
function showSidebar(): void {
  let ui: GoogleAppsScript.Base.Ui | null = null;
  try { ui = DocumentApp.getUi(); } catch (e) {
    try { ui = SlidesApp.getUi(); } catch (e2) {
      try { ui = SpreadsheetApp.getUi(); } catch (e3) {
        try { ui = FormApp.getUi(); } catch (e4) {}
      }
    }
  }

  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Accessibility Checker')
    .setWidth(360);
  if (ui) ui.showSidebar(html);
}

/**
 * RPC: Returns active host type ('DOCS', 'SLIDES', 'SHEETS', 'FORMS').
 */
function rpcGetHostType(): 'DOCS' | 'SLIDES' | 'SHEETS' | 'FORMS' | 'UNKNOWN' {
  try {
    if (DocumentApp.getActiveDocument()) return 'DOCS';
  } catch (e) {}
  try {
    if (SlidesApp.getActivePresentation()) return 'SLIDES';
  } catch (e) {}
  try {
    if (SpreadsheetApp.getActiveSpreadsheet()) return 'SHEETS';
  } catch (e) {}
  try {
    if (FormApp.getActiveForm()) return 'FORMS';
  } catch (e) {}
  return 'UNKNOWN';
}

/**
 * RPC: Executes accessibility checks across active file.
 */
function rpcRunChecks(): AccessibilityIssue[] {
  return runAllChecks();
}

/**
 * RPC: Selects / highlights element on canvas.
 */
function rpcSelectElement(elementId: string): void {
  try {
    const doc = DocumentApp.getActiveDocument();
    if (doc) {
      const rangeBuilder = doc.newRange();
      if (elementId.startsWith('doc_p_')) {
        const idx = parseInt(elementId.replace('doc_p_', ''), 10);
        const p = doc.getBody().getParagraphs()[idx];
        if (p) {
          const textEl = p.editAsText();
          if (textEl && textEl.getText().length > 0) {
            rangeBuilder.addElement(textEl, 0, textEl.getText().length - 1);
          } else {
            rangeBuilder.addElement(p);
          }
          doc.setSelection(rangeBuilder.build());
        }
      } else if (elementId.startsWith('doc_img_')) {
        const idx = parseInt(elementId.replace('doc_img_', ''), 10);
        const img = doc.getBody().getImages()[idx];
        if (img) {
          rangeBuilder.addElement(img);
          doc.setSelection(rangeBuilder.build());
        }
      } else if (elementId.startsWith('doc_tbl_')) {
        const idx = parseInt(elementId.replace('doc_tbl_', ''), 10);
        const tbl = doc.getBody().getTables()[idx];
        if (tbl) {
          rangeBuilder.addElement(tbl);
          doc.setSelection(rangeBuilder.build());
        }
      }
      return;
    }
  } catch (e) {
    // Not Google Docs
  }

  try {
    const pres = SlidesApp.getActivePresentation();
    if (pres) {
      // Check if elementId is a slide itself
      const slide = pres.getSlideById(elementId);
      if (slide) {
        slide.selectAsCurrentPage();
        return;
      }

      // Otherwise navigate to parent slide first, then select page element
      const el = pres.getPageElementById(elementId);
      if (el) {
        const page = el.getPage();
        if (page) {
          page.asSlide().selectAsCurrentPage();
        }
        el.select();
      }
    }
  } catch (e) {
    console.error('Failed to select element in Slides:', e);
  }
}


/**
 * RPC: Applies one-click auto-fix to an element.
 */
function rpcApplyFix(elementId: string, fixType: string, suggestedValue?: string, metadata?: any): boolean {
  try {
    const doc = DocumentApp.getActiveDocument();
    if (doc) {
      if (elementId.startsWith('doc_tbl_')) {
        const idx = parseInt(elementId.replace('doc_tbl_', ''), 10);
        const tbl = doc.getBody().getTables()[idx];
        if (tbl && tbl.getNumRows() > 0) {
          const row0 = tbl.getRow(0);
          for (let c = 0; c < row0.getNumCells(); c++) {
            const cell = row0.getCell(c);
            cell.setBackgroundColor('#F1F3F4');
            cell.editAsText().setBold(true);
          }
          return true;
        }
      }

      if (elementId.startsWith('doc_img_')) {
        const idx = parseInt(elementId.replace('doc_img_', ''), 10);
        const img = doc.getBody().getImages()[idx];
        if (img && fixType === 'Alternative Text' && suggestedValue) {
          img.setAltDescription(suggestedValue);
          try { img.setAltTitle(''); } catch (e) {}
          return true;
        }
      }

      if (elementId.startsWith('doc_p_')) {
        const idx = parseInt(elementId.replace('doc_p_', ''), 10);
        const p = doc.getBody().getParagraphs()[idx];
        if (p) {
          if (fixType === 'Color Contrast' && suggestedValue) {
            p.editAsText().setForegroundColor(suggestedValue);
            return true;
          }
          if (fixType === 'Typography & Legibility') {
            if (suggestedValue === 'LEFT') {
              p.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
              return true;
            }
            if (suggestedValue === '1.15') {
              p.setLineSpacing(1.15);
              return true;
            }
            // Empty spacer removal
            if (!p.getText().trim() && p.getNumChildren() <= 1) {
              p.removeFromParent();
              return true;
            }
          }
          if (fixType === 'Heading Structure' && suggestedValue) {
            let headingEnum = DocumentApp.ParagraphHeading.HEADING2;
            switch (suggestedValue) {
              case 'TITLE': headingEnum = DocumentApp.ParagraphHeading.TITLE; break;
              case 'HEADING1': headingEnum = DocumentApp.ParagraphHeading.HEADING1; break;
              case 'HEADING2': headingEnum = DocumentApp.ParagraphHeading.HEADING2; break;
              case 'HEADING3': headingEnum = DocumentApp.ParagraphHeading.HEADING3; break;
              case 'HEADING4': headingEnum = DocumentApp.ParagraphHeading.HEADING4; break;
              case 'HEADING5': headingEnum = DocumentApp.ParagraphHeading.HEADING5; break;
              case 'HEADING6': headingEnum = DocumentApp.ParagraphHeading.HEADING6; break;
            }
            p.setHeading(headingEnum);
            return true;
          }
          if (fixType === 'Meaningful Hyperlinks' && suggestedValue) {
            const textEl = p.editAsText();
            const textStr = textEl.getText();
            const targetUrl = metadata?.url || '';
            const targetAnchor = (metadata?.currentAnchor || '').toLowerCase().trim();

            let startIdx = -1;
            let foundUrl = '';
            for (let c = 0; c < textStr.length; c++) {
              const u = textEl.getLinkUrl(c);
              if (u && (!targetUrl || u === targetUrl)) {
                if (startIdx === -1) startIdx = c;
                foundUrl = u;
              } else {
                if (startIdx !== -1) {
                  const spanText = textStr.substring(startIdx, c).trim();
                  const spanLower = spanText.toLowerCase();
                  if (!targetAnchor || spanLower === targetAnchor || spanLower.includes(targetAnchor) || targetAnchor.includes(spanLower) || ['click here', 'learn more', 'this document', 'this page', 'this', 'here', 'link', 'more info', 'refer to this'].some(k => spanLower.includes(k))) {
                    textEl.deleteText(startIdx, c - 1);
                    textEl.insertText(startIdx, suggestedValue);
                    textEl.setLinkUrl(startIdx, startIdx + suggestedValue.length - 1, foundUrl);
                    return true;
                  }
                  startIdx = -1;
                }
              }
            }
            if (startIdx !== -1) {
              const spanText = textStr.substring(startIdx, textStr.length).trim();
              const spanLower = spanText.toLowerCase();
              if (!targetAnchor || spanLower === targetAnchor || spanLower.includes(targetAnchor) || targetAnchor.includes(spanLower) || ['click here', 'learn more', 'this document', 'this page', 'this', 'here', 'link', 'more info', 'refer to this'].some(k => spanLower.includes(k))) {
                textEl.deleteText(startIdx, textStr.length - 1);
                textEl.insertText(startIdx, suggestedValue);
                textEl.setLinkUrl(startIdx, startIdx + suggestedValue.length - 1, foundUrl);
                return true;
              }
            }
            // Fallback keyword search if URL span matching didn't trigger
            const lower = textStr.toLowerCase();
            const kwMatch = (targetAnchor ? [targetAnchor] : []).concat(['click here', 'learn more', 'this document', 'this page', 'this', 'here', 'link', 'more info', 'refer to this']).find(k => lower.includes(k));
            if (kwMatch) {
              const kwIdx = lower.indexOf(kwMatch);
              let linkUrl = targetUrl;
              if (!linkUrl) {
                for (let c = kwIdx; c < kwIdx + kwMatch.length; c++) {
                  const u = textEl.getLinkUrl(c);
                  if (u) { linkUrl = u; break; }
                }
              }
              if (linkUrl) {
                textEl.deleteText(kwIdx, kwIdx + kwMatch.length - 1);
                textEl.insertText(kwIdx, suggestedValue);
                textEl.setLinkUrl(kwIdx, kwIdx + suggestedValue.length - 1, linkUrl);
                return true;
              }
            }
          }
          if (fixType === 'List Formatting') {
            const raw = p.getText();
            const cleaned = raw.replace(SIMULATED_LIST_REGEX, '').trim();
            p.editAsText().setText(cleaned);
            const listItem = doc.getBody().insertListItem(doc.getBody().getChildIndex(p), cleaned);
            listItem.setGlyphType(DocumentApp.GlyphType.BULLET);
            p.removeFromParent();
            return true;
          }
        }
        return false;
      }
    }
  } catch (e) {
    // Not Google Docs
  }

  try {
    const pres = SlidesApp.getActivePresentation();
    if (pres) {
      const el = pres.getPageElementById(elementId);
      if (el) {
        if (el.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
          if (fixType === 'Color Contrast' && suggestedValue) {
            el.asShape().getText().getTextStyle().setForegroundColor(suggestedValue);
            return true;
          }
          if (fixType === 'Meaningful Hyperlinks' && suggestedValue) {
            const textRange = el.asShape().getText();
            const runs = textRange.getRuns();
            const targetAnchor = (metadata?.currentAnchor || '').toLowerCase().trim();
            for (let rIdx = 0; rIdx < runs.length; rIdx++) {
              const run = runs[rIdx];
              const linkUrl = run.getTextStyle().getLink()?.getUrl();
              if (linkUrl && (!metadata?.url || linkUrl === metadata.url)) {
                const runText = run.asString().trim();
                const runLower = runText.toLowerCase();
                if (!targetAnchor || runLower === targetAnchor || runLower.includes(targetAnchor) || targetAnchor.includes(runLower) || ['click here', 'learn more', 'this document', 'this page', 'this', 'here', 'link', 'more info', 'refer to this'].some(k => runLower.includes(k))) {
                  run.setText(suggestedValue);
                  run.getTextStyle().setLinkUrl(linkUrl);
                  return true;
                }
              }
            }
          }
          if (fixType === 'List Formatting') {
            const shape = el.asShape();
            const textRange = shape.getText();
            const rawText = textRange.asString();
            const cleanedLines = rawText.split(/\r?\n/).map(l => l.replace(SIMULATED_LIST_REGEX, '').trim()).filter(l => l.length > 0);
            textRange.setText(cleanedLines.join('\n'));
            try {
              textRange.getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
            } catch (err) {
              console.warn('Could not apply list preset in Slides:', err);
            }
            return true;
          }
        }
        if (el.getPageElementType() === SlidesApp.PageElementType.IMAGE) {
          if (fixType === 'Alternative Text' && suggestedValue) {
            el.asImage().setDescription(suggestedValue);
            try { el.asImage().setTitle(''); } catch (e) {}
            return true;
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to apply fix in Slides:', e);
  }

  return false;
}

/**
 * RPC: Generates alternative text for an image using Google Gemini API if key is available, or smart backend NLP fallback.
 */
function rpcGenerateAiAltText(elementId: string, currentAlt?: string, base64DataParam?: string): string {
  return generateAiAltText(elementId, currentAlt, base64DataParam);
}

/**
 * RPC: Generates a descriptive link anchor title using Gemini API or syntactic NLP rules.
 */
function rpcGenerateAiLinkTitle(anchorText: string, sentenceContext?: string, url?: string): string {
  return generateAiLinkTitle(anchorText, sentenceContext, url);
}

/**
 * RPC: Gets the user settings
 */
function rpcGetSettings(): AddonSettings {
  try {
    const props = PropertiesService.getUserProperties().getProperties();
    return {
      ...DEFAULT_SETTINGS,
      ...props,
      enableAutoRemediation: props['enableAutoRemediation'] === 'true'
    } as AddonSettings;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * RPC: Saves the user settings
 */
function rpcSaveSettings(settings: AddonSettings): void {
  try {
    const props: Record<string, string> = {
      contrastFixMode: settings.contrastFixMode || 'PRESERVE_HSL',
      enableAutoRemediation: settings.enableAutoRemediation ? 'true' : 'false',
      language: settings.language || 'AUTO'
    };
    PropertiesService.getUserProperties().setProperties(props);
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export {
  onOpen,
  showSidebar,
  populateTestCases,
  buildGmailComposeCard,
  buildGmailHomepageCard,
  refreshGmailComposeCard,
  refreshGmailHomepageCard,
  buildGmailMessageCard,
  rpcApplyGmailFix,
  rpcApplyAllGmailFixes,
  rpcGetHostType,
  rpcRunChecks,
  rpcSelectElement,
  rpcApplyFix,
  rpcGetImageBlob,
  rpcGetSlideElements,
  rpcApplyReadingOrder,
  rpcGetSettings,
  rpcSaveSettings,
  rpcGenerateAiAltText,
  rpcGenerateAiLinkTitle,
  rpcPopulateGmailDemo,
  rpcScanLatestDraft,
};

