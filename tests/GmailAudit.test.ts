import {
  auditGmailDraftHtml,
  buildInlineImagesMap,
} from '../backend/src/hosts/GmailHost';

describe('Gmail Accessibility Audit & Image Handling', () => {
  const sampleDemoHtml = `
<div dir="ltr">
<div style="font-size: 18px; font-weight: bold; color: #1a73e8;">Welcome to the Gmail Accessibility Audit Demo</div>
<div>This email draft contains intentional WCAG 2.1 AA violations.</div>
<br>
<div style="color: #a0a0a0;">This text is light gray (#a0a0a0) with a 2.1:1 contrast ratio against white.</div>
<br>
<div>To review guidelines, please <a href="http://test.com">Click Here</a> or <a href="https://www.w3.org/WAI/">learn more</a>.</div>
<br>
<div><img data-surl="cid:ii_mtaczakn1" src="cid:ii_mtaczakn1" alt="IMG_2038.JPG" width="383" height="510"><br></div>
<br>
<div>Action items for next week:</div>
<div>- apples</div>
<div>- bananas</div>
<div>- oranges</div>
<br>
<table border="1" cellpadding="6">
  <tr><td>Feature</td><td>Status</td><td>Priority</td></tr>
  <tr><td>Contrast Check</td><td>Complete</td><td>High</td></tr>
</table>
</div>
`;

  describe('auditGmailDraftHtml', () => {
    it('detects all standard WCAG 2.1 AA violations in the demo draft', () => {
      const issues = auditGmailDraftHtml(sampleDemoHtml);
      expect(issues.length).toBeGreaterThanOrEqual(5);

      const issueTypes = issues.map((i) => i.issueType);
      expect(issueTypes).toContain('Alternative Text');
      expect(issueTypes).toContain('Meaningful Hyperlinks');
      expect(issueTypes).toContain('Color Contrast');
      expect(issueTypes).toContain('List Formatting');
      expect(issueTypes).toContain('Heading Structure');
      expect(issueTypes).toContain('Table Structure');
    });

    it('flags missing alt text or generic filename alt text', () => {
      const issues = auditGmailDraftHtml(sampleDemoHtml);
      const altIssue = issues.find((i) => i.issueType === 'Alternative Text');
      expect(altIssue).toBeDefined();
      expect(altIssue?.title).toContain('Missing or Generic Alternative Text');
      expect(altIssue?.canAutoFix).toBe(true);
    });

    it('passes images explicitly marked as decorative', () => {
      const decorativeHtml = `<div><img src="cid:ii_123" alt="" role="presentation" data-a11y-decorative="true"></div>`;
      const issues = auditGmailDraftHtml(decorativeHtml);
      const altIssues = issues.filter((i) => i.issueType === 'Alternative Text');
      expect(altIssues.length).toBe(0);
    });

    it('passes images with descriptive alternative text', () => {
      const compliantHtml = `<div><img src="cid:ii_123" alt="Woman Eating lunch in a garden" width="300" height="200"></div>`;
      const issues = auditGmailDraftHtml(compliantHtml);
      const altIssues = issues.filter((i) => i.issueType === 'Alternative Text');
      expect(altIssues.length).toBe(0);
    });
  });

  describe('buildInlineImagesMap', () => {
    it('correlates CIDs from HTML and attachment filenames to Blobs', () => {
      const mockBlob1 = {
        getName: () => 'IMG_2038.JPG',
        getContentType: () => 'image/jpeg',
        getBytes: () => new Uint8Array([1, 2, 3]),
      } as any;

      const html = `<div><img data-surl="cid:ii_mtaczakn1" src="cid:ii_mtaczakn1" alt="Woman Eating"></div>`;
      const map = buildInlineImagesMap(html, [mockBlob1]);

      expect(map['IMG_2038.JPG']).toBe(mockBlob1);
      expect(map['img_2038.jpg']).toBe(mockBlob1);
      expect(map['ii_mtaczakn1']).toBe(mockBlob1);
    });

    it('returns empty map when no inline blobs are present', () => {
      const html = `<div><img src="https://example.com/pic.png"></div>`;
      const map = buildInlineImagesMap(html, []);
      expect(map).toEqual({});
    });
  });
});
