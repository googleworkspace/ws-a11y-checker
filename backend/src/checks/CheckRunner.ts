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
 * Orchestrator engine running applicable accessibility checks across Google Docs or Slides host application.
 */
import { AccessibilityIssue } from '../models/Issue';
import { checkAltText } from './AltTextCheck';
import { checkContrast } from './ContrastCheck';
import { checkSlideElementOrder } from './ElementOrderCheck';
import { checkHeadingStructureAndLists } from './HeadingCheck';
import { checkHyperlink } from './HyperlinkCheck';
import { checkTextAlignment, checkLineSpacing, checkEmptyParagraphSpacers } from './TypographyCheck';
import { checkTableHeaders } from './TableCheck';

/**
 * Runs accessibility checks against the active document or presentation.
 */
export function runAllChecks(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Determine if active host is Google Docs or Google Slides
  let isDoc = false;
  try {
    const doc = DocumentApp.getActiveDocument();
    if (doc) {
      isDoc = true;
      issues.push(...runDocsChecks(doc));
    }
  } catch (e) {
    // Not in Google Docs
  }

  if (!isDoc) {
    try {
      const pres = SlidesApp.getActivePresentation();
      if (pres) {
        issues.push(...runSlidesChecks(pres));
      }
    } catch (e) {
      // Not in Google Slides
    }
  }

  return issues;
}

/**
 * Runs checks tailored for Google Docs.
 */
function runDocsChecks(doc: GoogleAppsScript.Document.Document): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();

  // 1. Heading Structure & Lists
  issues.push(...checkHeadingStructureAndLists(paragraphs));

  // 2. Paragraph-level contrast & hyperlinks across individual text runs
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const text = p.getText().trim();
    if (!text) continue;

    const editAsText = p.editAsText();
    const numChars = editAsText.getText().length;
    
    // Sample formatting at start, middle, and every run change
    const offsetsToCheck = [0];
    for (let c = 1; c < numChars; c += 5) {
      offsetsToCheck.push(c);
    }

    const checkedPairs = new Set<string>();

    for (const offset of offsetsToCheck) {
      if (offset >= numChars) continue;
      const fgColor = editAsText.getForegroundColor(offset) || '#000000';
      const bgColor = editAsText.getBackgroundColor(offset) || '#FFFFFF';
      const pairKey = `${fgColor}_${bgColor}`;

      if (!checkedPairs.has(pairKey)) {
        checkedPairs.add(pairKey);
        const fontSize = editAsText.getFontSize(offset) || 11;
        const isBold = editAsText.isBold(offset) === true;

        const contrastIssue = checkContrast(
          `doc_p_${i}`,
          'Paragraph',
          text,
          fgColor,
          bgColor,
          fontSize,
          isBold
        );
        if (contrastIssue) {
          issues.push(contrastIssue);
          break; // Only report one contrast violation per paragraph
        }
      }
    }

    // Check hyperlinks across all character spans
    let curUrl: string | null = null;
    let startIdx = -1;
    for (let c = 0; c < numChars; c++) {
      const u = editAsText.getLinkUrl(c);
      if (u !== curUrl) {
        if (curUrl && startIdx >= 0) {
          const anchor = editAsText.getText().substring(startIdx, c).trim();
          if (anchor) {
            const lIssue = checkHyperlink(`doc_p_${i}`, 'Link', anchor, curUrl);
            if (lIssue) issues.push(lIssue);
          }
        }
        curUrl = u;
        startIdx = u ? c : -1;
      }
    }
    if (curUrl && startIdx >= 0) {
      const anchor = editAsText.getText().substring(startIdx, numChars).trim();
      if (anchor) {
        const lIssue = checkHyperlink(`doc_p_${i}`, 'Link', anchor, curUrl);
        if (lIssue) issues.push(lIssue);
      }
    }

    const alignIssue = checkTextAlignment(`doc_p_${i}`, text, p.getAlignment());
    if (alignIssue) issues.push(alignIssue);

    const spacingIssue = checkLineSpacing(`doc_p_${i}`, text, p.getLineSpacing());
    if (spacingIssue) issues.push(spacingIssue);
  }

  // Check structural empty spacers
  issues.push(...checkEmptyParagraphSpacers(paragraphs));

  // 3. Images
  const images = body.getImages();
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const altIssue = checkAltText(
      `doc_img_${i}`,
      'Image',
      img.getAltTitle() || '',
      img.getAltDescription() || ''
    );
    if (altIssue) {
      issues.push(altIssue);
    }
  }

  // 4. Tables
  issues.push(...checkTableHeaders(body.getTables()));

  return issues;
}

/**
 * Runs checks tailored for Google Slides.
 */
function runSlidesChecks(pres: GoogleAppsScript.Slides.Presentation): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const slides = pres.getSlides();

  for (let sIdx = 0; sIdx < slides.length; sIdx++) {
    const slide = slides[sIdx];

    // 1. Element reading order check
    const orderIssue = checkSlideElementOrder(slide);
    if (orderIssue) {
      issues.push(orderIssue);
    }

    // 2. Inspect page elements
    const elements = slide.getPageElements();
    for (const el of elements) {
      const id = el.getObjectId();
      const type = el.getPageElementType().toString();

      if (el.getPageElementType() === SlidesApp.PageElementType.IMAGE) {
        const img = el.asImage();
        const altIssue = checkAltText(id, type, img.getTitle(), img.getDescription());
        if (altIssue) {
          issues.push(altIssue);
        }
      }

      if (el.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
        const shape = el.asShape();
        const textRange = shape.getText();
        const textStr = textRange.asString().trim();
        if (textStr) {
          const shapeBgHex = shape.getFill()?.getSolidFill()?.getColor()?.asRgbColor()?.asHexString() || '#FFFFFF';
          const runs = textRange.getRuns();

          for (let rIdx = 0; rIdx < runs.length; rIdx++) {
            const run = runs[rIdx];
            const runText = run.asString().trim();
            if (!runText) continue;

            const style = run.getTextStyle();
            const fgHex = style.getForegroundColor()?.asRgbColor()?.asHexString() || '#000000';
            const fontSize = style.getFontSize() || 18;
            const isBold = style.isBold() || false;

            const contrastIssue = checkContrast(id, type, runText, fgHex, shapeBgHex, fontSize, isBold);
            if (contrastIssue) {
              issues.push(contrastIssue);
            }

            const runLinkUrl = style.getLink()?.getUrl();
            if (runLinkUrl) {
              const linkIssue = checkHyperlink(id, type, runText, runLinkUrl);
              if (linkIssue) issues.push(linkIssue);
            }
          }
        }
      }
    }
  }

  return issues;
}

