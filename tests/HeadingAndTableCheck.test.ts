import { checkHeadingHierarchy } from '../backend/src/checks/HeadingCheck';
import { checkTableHeaders } from '../backend/src/checks/TableCheck';

describe('HeadingCheck (WCAG 1.3.1 Info and Relationships)', () => {
  it('detects skipped heading levels (e.g. H1 to H3)', () => {
    const headings = [
      { elementId: 'h_1', level: 1, text: 'Main Title' },
      { elementId: 'h_2', level: 3, text: 'Skipped Subtitle' },
    ];
    const issues = checkHeadingHierarchy(headings);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].title).toContain('Skipped heading level');
    expect(issues[0].severity).toBe('WARNING');
  });

  it('passes proper sequential heading hierarchy (H1 -> H2 -> H3)', () => {
    const headings = [
      { elementId: 'h_1', level: 1, text: 'Main Title' },
      { elementId: 'h_2', level: 2, text: 'Section 1' },
      { elementId: 'h_3', level: 3, text: 'Subsection 1.1' },
    ];
    const issues = checkHeadingHierarchy(headings);
    expect(issues.length).toBe(0);
  });
});

describe('TableCheck (WCAG 1.3.1 Info and Relationships)', () => {
  it('flags tables with missing header rows or header columns', () => {
    const issue = checkTableHeaders('table_1', 'Document Table', false, false, 3, 3);
    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('ERROR');
    expect(issue?.title).toContain('Table missing header row/column');
  });

  it('passes tables that define a header row', () => {
    const issue = checkTableHeaders('table_2', 'Document Table', true, false, 3, 3);
    expect(issue).toBeNull();
  });
});
