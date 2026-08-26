import { checkAltText } from '../backend/src/checks/AltTextCheck';

describe('AltTextCheck (WCAG 1.1.1 Non-text Content)', () => {
  it('flags missing alt text on visual elements', () => {
    const issue = checkAltText('img_1', 'Document Image', '', '');
    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('ERROR');
    expect(issue?.wcagRule).toBe('WCAG 1.1.1 Non-text Content');
    expect(issue?.title).toContain('Missing alternative text');
  });

  it('flags redundant prefixes like "image of" or "screenshot of"', () => {
    const issue1 = checkAltText('img_2', 'Document Image', 'Image of quarterly chart', '');
    expect(issue1).not.toBeNull();
    expect(issue1?.severity).toBe('WARNING');
    expect(issue1?.title).toContain('Redundant alt text phrase');
    expect(issue1?.fixMetadata?.suggestedCleanAlt).toBe('Quarterly chart');

    const issue2 = checkAltText('img_3', 'Document Image', 'Screenshot of settings page', '');
    expect(issue2).not.toBeNull();
    expect(issue2?.fixMetadata?.suggestedCleanAlt).toBe('Settings page');
  });

  it('passes descriptive alternative text without redundant prefixes', () => {
    const issue = checkAltText('img_4', 'Document Image', 'Two team members collaborating at a whiteboard', '');
    expect(issue).toBeNull();
  });
});
