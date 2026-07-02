/**
 * Table structure accessibility check module for Google Docs.
 */
import { AccessibilityIssue } from '../models/Issue';

/**
 * Scans document tables to ensure header rows are structurally and visually distinguished.
 */
export function checkTableHeaders(tables: GoogleAppsScript.Document.Table[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const numRows = table.getNumRows();
    if (numRows < 2) continue;

    const row0 = table.getRow(0);
    const row1 = table.getRow(1);
    if (row0.getNumCells() === 0 || row1.getNumCells() === 0) continue;

    const cell0 = row0.getCell(0);
    const cell1 = row1.getCell(0);

    const isRow0Bold = cell0.editAsText().isBold(0) === true;
    const isRow1Bold = cell1.editAsText().isBold(0) === true;

    const bg0 = cell0.getBackgroundColor() || '#FFFFFF';
    const bg1 = cell1.getBackgroundColor() || '#FFFFFF';

    // If row 0 has the exact same styling as row 1 (neither bold nor contrasting fill)
    if (isRow0Bold === isRow1Bold && bg0 === bg1) {
      issues.push({
        elementId: `doc_tbl_${i}`,
        elementType: 'Table',
        issueType: 'Table Structure',
        severity: 'WARNING',
        wcagRule: 'WCAG 1.3.1 Info and Relationships',
        title: 'Table lacks visual column header row',
        description: 'Data tables must distinguish column header cells from data cells so users and assistive tech recognize structure.',
        snippet: `Table ${i + 1} (${numRows} rows)`,
        canAutoFix: true,
      });
    }
  }

  return issues;
}
