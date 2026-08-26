import { checkHyperlink } from '../backend/src/checks/HyperlinkCheck';

describe('HyperlinkCheck (WCAG 2.4.4 Link Purpose)', () => {
  it('flags ambiguous link phrases such as "click here", "read more", "learn more"', () => {
    const issue1 = checkHyperlink('link_1', 'Document Link', 'click here', 'https://example.com');
    expect(issue1).not.toBeNull();
    expect(issue1?.severity).toBe('ERROR');
    expect(issue1?.wcagRule).toBe('WCAG 2.4.4 Link Purpose (In Context)');

    const issue2 = checkHyperlink('link_2', 'Document Link', 'Learn More', 'https://example.com');
    expect(issue2).not.toBeNull();

    const issue3 = checkHyperlink('link_3', 'Document Link', 'here', 'https://example.com');
    expect(issue3).not.toBeNull();
  });

  it('flags raw URLs used as link display text', () => {
    const issue = checkHyperlink('link_4', 'Document Link', 'https://www.w3.org/WAI/', 'https://www.w3.org/WAI/');
    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('WARNING');
    expect(issue?.title).toContain('Raw URL');
  });

  it('flags extremely short non-descriptive link anchors', () => {
    const issue = checkHyperlink('link_5', 'Document Link', '>>', 'https://example.com');
    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('ERROR');
  });

  it('passes clear, descriptive link anchor text', () => {
    const issue1 = checkHyperlink('link_6', 'Document Link', 'Q3 Accessibility Audit Report', 'https://example.com');
    expect(issue1).toBeNull();

    const issue2 = checkHyperlink('link_7', 'Document Link', 'W3C Web Content Accessibility Guidelines', 'https://w3.org');
    expect(issue2).toBeNull();
  });
});
