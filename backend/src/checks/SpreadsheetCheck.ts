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
import { checkContrast } from './ContrastCheck';

/**
 * Runs WCAG 2.1 AA accessibility checks on Google Sheets active spreadsheet.
 */
export function runSpreadsheetChecks(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return issues;

    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      const sheetName = sheet.getName();
      const sheetId = `sheet_${i}`;

      // Check 1: Generic Sheet Tab Naming (WCAG 1.3.1)
      if (/^Sheet\d+$/i.test(sheetName.trim())) {
        issues.push({
          elementId: sheetId,
          elementType: 'Sheet Tab',
          issueType: 'Table Structure',
          severity: 'WARNING',
          wcagRule: 'WCAG 1.3.1 Info and Relationships',
          title: `Default generic sheet tab name ("${sheetName}")`,
          description: 'Screen reader users rely on descriptive sheet tab names for navigation. Rename generic tab titles like "Sheet1".',
          snippet: sheetName,
          canAutoFix: false,
        });
      }

      // Check 2: Frozen Header Row Verification (WCAG 1.3.1)
      const lastRow = sheet.getLastRow();
      if (lastRow > 5 && sheet.getFrozenRows() === 0) {
        issues.push({
          elementId: sheetId,
          elementType: 'Data Table',
          issueType: 'Table Structure',
          severity: 'WARNING',
          wcagRule: 'WCAG 1.3.1 Info and Relationships',
          title: `Missing frozen header row in sheet "${sheetName}"`,
          description: 'Large spreadsheets require frozen top header rows so screen readers maintain column context while navigating data rows.',
          snippet: `${sheetName} (${lastRow} data rows)`,
          canAutoFix: true,
          fixMetadata: { isSpreadsheetHeader: true },
        });
      }

      // Check 3: Cell Color Contrast Scanning (WCAG 1.4.3)
      if (lastRow > 0 && sheet.getLastColumn() > 0) {
        const sampleRows = Math.min(lastRow, 10);
        const sampleCols = Math.min(sheet.getLastColumn(), 6);
        const range = sheet.getRange(1, 1, sampleRows, sampleCols);
        const fontColors = range.getFontColors();
        const bgColors = range.getBackgrounds();
        const values = range.getValues();

        for (let r = 0; r < sampleRows; r++) {
          for (let c = 0; c < sampleCols; c++) {
            const val = String(values[r][c]).trim();
            if (!val) continue;

            const fg = fontColors[r][c] || '#000000';
            const bg = bgColors[r][c] || '#FFFFFF';
            const contrastIssue = checkContrast(`cell_${r}_${c}`, 'Cell Text', val, fg, bg, 11, false);
            if (contrastIssue) {
              issues.push({
                ...contrastIssue,
                elementId: `sheet_cell_${i}_${r + 1}_${c + 1}`,
                title: `Low cell color contrast in cell ${sheet.getRange(r + 1, c + 1).getA1Notation()}`,
              });
            }
          }
        }
      }

      // Check 4: Embedded Charts Alternative Text (WCAG 1.1.1)
      const charts = sheet.getCharts();
      charts.forEach((chart, idx) => {
        const options = chart.getOptions();
        const chartTitle = options.get('title') || '';
        if (!chartTitle) {
          issues.push({
            elementId: `chart_${i}_${idx}`,
            elementType: 'Embedded Chart',
            issueType: 'Alternative Text',
            severity: 'ERROR',
            wcagRule: 'WCAG 1.1.1 Non-text Content',
            title: `Missing title / alt text on chart in "${sheetName}"`,
            description: 'Screen reader users cannot perceive charts without a descriptive title or alternative text.',
            snippet: `Chart #${idx + 1} on ${sheetName}`,
            canAutoFix: false,
          });
        }
      });
    }
  } catch (e) {
    // Not in Google Sheets
  }

  return issues;
}
