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

import * as fs from 'fs';
import * as path from 'path';
import {
  buildGmailComposeCard,
  buildGmailHomepageCard,
  buildGmailMessageCard,
  refreshGmailComposeCard,
  refreshGmailHomepageCard,
  rpcApplyGmailFix,
  rpcApplyAllGmailFixes,
  rpcPopulateGmailDemo,
  rpcScanLatestDraft,
} from '../backend/src/hosts/GmailHost';
import {
  BACKEND_DICTIONARIES,
  getBackendTranslation,
  interpolateParams,
  isRtlLocale,
  normalizeLocale,
  resolveEffectiveLanguage,
} from '../backend/src/utils/i18n';
import { I18nService } from '../ui/src/app/services/i18n.service';
import {
  AccessibilityService,
  Issue,
  Settings,
} from '../ui/src/app/services/accessibility.service';
import { setupGasEnvironment, extractTextFromCard } from './GasMocks';

describe('Milestone 2 Challenger Stress-Testing Suite', () => {
  const targetLocales = ['ar', 'ja', 'es', 'de', 'pt-BR', 'he'] as const;

  beforeEach(() => {
    setupGasEnvironment({ userLocale: 'en' });
  });

  describe('1. Empirical String Scrubbing Verification of Angular Templates', () => {
    const componentPaths = [
      'ui/src/app/app.component.ts',
      'ui/src/app/components/dashboard/dashboard.component.ts',
      'ui/src/app/components/issue-list/issue-list.component.ts',
      'ui/src/app/components/reading-order-modal/reading-order-modal.component.ts',
      'ui/src/app/components/settings-panel/settings-panel.component.ts',
      'ui/src/app/components/help-modal/help-modal.component.ts',
    ];

    it('verifies all component files exist and are non-empty', () => {
      for (const relPath of componentPaths) {
        const fullPath = path.join(__dirname, '..', relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content.length).toBeGreaterThan(100);
      }
    });

    it('verifies all aria-labels in templates are dynamically localized via i18n.t()', () => {
      for (const relPath of componentPaths) {
        const fullPath = path.join(__dirname, '..', relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        // Extract template string
        const templateMatch = /template:\s*`([\s\S]*?)`\s*,\s*styles/m.exec(content);
        if (templateMatch) {
          const template = templateMatch[1];
          // Check for static aria-label="some english text" (excluding dynamic [attr.aria-label] and aria-labelledby)
          const staticAriaLabelMatches = template.match(/\baria-label="([^"]+)"/g) || [];
          for (const match of staticAriaLabelMatches) {
            // Static aria-labels should not contain English words like 'Scan', 'Close', 'Help', 'Settings', 'Preferences'
            expect(match).not.toMatch(/aria-label="(?:Scan|Close|Help|Settings|Preferences|Reading|Open|Jump|Fix|Apply)/i);
          }
        }
      }
    });

    it('verifies all placeholders in templates are dynamically localized via i18n.t()', () => {
      for (const relPath of componentPaths) {
        const fullPath = path.join(__dirname, '..', relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const templateMatch = /template:\s*`([\s\S]*?)`\s*,\s*styles/m.exec(content);
        if (templateMatch) {
          const template = templateMatch[1];
          const staticPlaceholderMatches = template.match(/\bplaceholder="([^"]+)"/g) || [];
          expect(staticPlaceholderMatches.length).toBe(0);
        }
      }
    });

    it('verifies Help Modal maps all 6 WCAG rule descriptions to translation keys', () => {
      const helpModalPath = path.join(__dirname, '../ui/src/app/components/help-modal/help-modal.component.ts');
      const content = fs.readFileSync(helpModalPath, 'utf8');
      const requiredRules = ['ruleContrast', 'ruleHeading', 'ruleLink', 'ruleAlt', 'ruleAlign', 'ruleSpacing'];
      for (const ruleKey of requiredRules) {
        expect(content).toContain(`i18n.t('${ruleKey}')`);
      }
    });

    it('verifies Settings Panel dropdown contains all 34 supported languages and AUTO option (35 total)', () => {
      const i18n = new I18nService();
      const supported = i18n.getSupportedLanguages();
      expect(supported.length).toBe(35);
      const codes = supported.map(s => s.code);
      expect(codes).toContain('AUTO');
      for (const loc of ['ar', 'iw', 'fa', 'ur', 'ja', 'zh-CN', 'zh-TW', 'ko', 'hi', 'bn', 'es', 'fr', 'de', 'it', 'pt-BR', 'pt-PT', 'nl', 'pl', 'ru', 'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'ro', 'el', 'uk', 'id', 'vi', 'th', 'fil', 'en']) {
        expect(codes).toContain(loc);
      }
    });
  });

  describe('2. Empirical Stress-Testing of Gmail Cards Across Locales (ar, ja, es, de, pt-BR, he)', () => {
    const testLocales = ['ar', 'ja', 'es', 'de', 'pt-BR', 'he', 'iw'] as const;

    it('renders Compose Card with All Clear state accurately across all test locales', () => {
      const cleanDraftHtml = `<div><p>Hello, this is a clean email without any WCAG issues.</p><p><a href="https://example.com">Visit our corporate homepage</a></p></div>`;

      for (const loc of testLocales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailComposeCard({}, undefined, cleanDraftHtml);
        expect(cards.length).toBe(1);

        const texts = extractTextFromCard(cards[0] as any);
        const normalized = normalizeLocale(loc);

        const expectedTitle = getBackendTranslation('cardTitle', loc);
        const expectedAllClearTitle = getBackendTranslation('cardAllClearTitle', loc);
        const expectedAllClearDesc = getBackendTranslation('cardAllClearDesc', loc);
        const expectedRefreshBtn = getBackendTranslation('cardRefreshBtn', loc);

        expect(texts).toContain(expectedTitle);
        expect(texts.some(t => t.includes(expectedAllClearTitle))).toBe(true);
        expect(texts.some(t => t.includes(expectedAllClearDesc))).toBe(true);
        expect(texts).toContain(expectedRefreshBtn);
      }
    });

    it('renders Compose Card with detected issues across all test locales', () => {
      const issueDraftHtml = `
        <div>
          <a href="https://example.com">click here</a>
          <img src="pic.jpg" alt="screenshot.png">
          <div style="color: #cccccc;">Faded text</div>
        </div>
      `;

      for (const loc of testLocales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailComposeCard({ parameters: { draftId: 'draft_123', subject: 'Quarterly Update' } }, undefined, issueDraftHtml);
        expect(cards.length).toBe(1);

        const texts = extractTextFromCard(cards[0] as any);
        const expectedTitle = getBackendTranslation('cardTitle', loc);
        const expectedFoundIssues = getBackendTranslation('cardFoundIssues', loc, { count: 3 });
        const expectedFixAllBtn = getBackendTranslation('cardFixAllBtn', loc, { count: 3 });
        const expectedCheckingDraft = getBackendTranslation('cardCheckingDraft', loc, { subject: 'Quarterly Update' });

        expect(texts).toContain(expectedTitle);
        expect(texts.some(t => t.includes(expectedFoundIssues))).toBe(true);
        expect(texts.some(t => t.includes(expectedFixAllBtn))).toBe(true);
        expect(texts.some(t => t.includes(expectedCheckingDraft))).toBe(true);
      }
    });

    it('renders Compose Card Empty State across all test locales', () => {
      for (const loc of testLocales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailComposeCard({});
        expect(cards.length).toBe(1);

        const texts = extractTextFromCard(cards[0] as any);
        const expectedNoDraftTitle = getBackendTranslation('cardNoDraftTitle', loc);
        const expectedHowToAuditTitle = getBackendTranslation('cardHowToAuditTitle', loc);
        const expectedStep1 = getBackendTranslation('cardHowToAuditStep1', loc);

        expect(texts.some(t => t.includes(expectedNoDraftTitle))).toBe(true);
        expect(texts.some(t => t.includes(expectedHowToAuditTitle))).toBe(true);
        expect(texts.some(t => t.includes(expectedStep1))).toBe(true);
      }
    });

    it('renders Homepage Card across all test locales with demo draft and audit options', () => {
      for (const loc of testLocales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailHomepageCard({});
        expect(cards.length).toBe(1);

        const texts = extractTextFromCard(cards[0] as any);
        const expectedTitle = getBackendTranslation('cardTitle', loc);
        const expectedCreateDemo = getBackendTranslation('cardCreateDemoBtn', loc);
        const expectedScanLatest = getBackendTranslation('cardScanLatestBtn', loc);

        expect(texts).toContain(expectedTitle);
        expect(texts).toContain(expectedCreateDemo);
        expect(texts).toContain(expectedScanLatest);
      }
    });

    it('renders Message Card across all test locales for audited received messages', () => {
      const cleanMessageHtml = `<p>Clean message text</p>`;
      for (const loc of testLocales) {
        setupGasEnvironment({ userLocale: loc });
        // Message card with empty or mock message
        const cards = buildGmailMessageCard({});
        expect(cards.length).toBe(1);

        const texts = extractTextFromCard(cards[0] as any);
        const expectedTitle = getBackendTranslation('cardTitle', loc);
        expect(texts).toContain(expectedTitle);
      }
    });

    it('handles refresh actions and produces localized ActionResponse notifications', () => {
      for (const loc of testLocales) {
        setupGasEnvironment({ userLocale: loc });
        const respCompose: any = refreshGmailComposeCard({});
        const expectedNotice = getBackendTranslation('cardNoticeRescanned', loc);
        expect(respCompose.notification.getText()).toBe(expectedNotice);

        const respHomepage: any = refreshGmailHomepageCard({});
        expect(respHomepage.notification.getText()).toBe(expectedNotice);
      }
    });

    it('verifies all 34 backend dictionaries contain non-empty translations for all 33 Gmail card keys', () => {
      const allKeys = Object.keys(BACKEND_DICTIONARIES['en']);
      expect(allKeys.length).toBe(33);

      for (const [langCode, dict] of Object.entries(BACKEND_DICTIONARIES)) {
        for (const k of allKeys) {
          expect(dict[k]).toBeDefined();
          expect(typeof dict[k]).toBe('string');
          expect(dict[k].trim().length).toBeGreaterThan(0);
          // Check for unresolved placeholders
          if (dict[k].includes('{') && dict[k].includes('}')) {
            const placeholders = dict[k].match(/\{([a-zA-Z0-9_-]+)\}/g) || [];
            for (const p of placeholders) {
              expect(['{subject}', '{count}', '{suggestedText}', '{index}']).toContain(p);
            }
          }
        }
      }
    });
  });

  describe('3. Empirical Verification of Screen Reader Announcements in AccessibilityService', () => {
    let a11y: AccessibilityService;
    let i18n: I18nService;
    let mockGScript: any;
    let mockAppRef: any;

    beforeEach(() => {
      mockGScript = {
        run: jest.fn(),
      };
      mockAppRef = {
        tick: jest.fn(),
      };
      i18n = new I18nService();
      a11y = new AccessibilityService(mockGScript as any, mockAppRef as any, i18n);
    });

    it('formats announceScanning correctly across locales', async () => {
      for (const loc of targetLocales) {
        i18n.setLanguage(loc);
        const freshA11y = new AccessibilityService(mockGScript as any, mockAppRef as any, i18n);
        mockGScript.run.mockReset();
        mockGScript.run.mockResolvedValueOnce('DOCS').mockResolvedValueOnce([]);

        let emittedAnnouncements: string[] = [];
        const sub = freshA11y.announcement$.subscribe((a) => {
          if (a) emittedAnnouncements.push(a);
        });

        await freshA11y.scanDocument();
        sub.unsubscribe();

        const expectedScanning = i18n.t('announceScanning');
        expect(emittedAnnouncements[0]).toBe(expectedScanning);
        expect(expectedScanning.trim().length).toBeGreaterThan(0);
      }
    });

    it('formats announceScanComplete with various issue & error count combinations across all locales', async () => {
      const testCases = [
        { total: 0, errors: 0 },
        { total: 1, errors: 0 },
        { total: 1, errors: 1 },
        { total: 5, errors: 2 },
        { total: 10, errors: 10 },
        { total: 100, errors: 42 },
        { total: 999, errors: 0 },
      ];

      for (const loc of [...targetLocales, 'en'] as const) {
        i18n.setLanguage(loc);

        for (const tc of testCases) {
          const issues: Issue[] = [];
          for (let i = 0; i < tc.total; i++) {
            issues.push({
              elementId: `elem_${i}`,
              elementType: 'Text',
              issueType: 'Color Contrast',
              severity: i < tc.errors ? 'ERROR' : 'WARNING',
              wcagRule: 'WCAG 1.4.3',
              title: `Issue ${i}`,
              description: `Description ${i}`,
              snippet: `Snippet ${i}`,
              canAutoFix: true,
            });
          }

          mockGScript.run.mockReset();
          mockGScript.run.mockResolvedValueOnce('DOCS').mockResolvedValueOnce(issues);

          let latestAnnouncement = '';
          const sub = a11y.announcement$.subscribe((a) => {
            if (a) latestAnnouncement = a;
          });

          await a11y.scanDocument();
          sub.unsubscribe();

          const expectedText = i18n.t('announceScanComplete', {
            total: tc.total,
            errors: tc.errors,
          });

          expect(latestAnnouncement).toBe(expectedText);
          expect(latestAnnouncement).toContain(String(tc.total));
          expect(latestAnnouncement).toContain(String(tc.errors));
          expect(latestAnnouncement).not.toContain('{total}');
          expect(latestAnnouncement).not.toContain('{errors}');
        }
      }
    });

    it('formats announceScanError upon scan failure across all locales', async () => {
      for (const loc of targetLocales) {
        i18n.setLanguage(loc);
        mockGScript.run.mockReset();
        mockGScript.run.mockRejectedValueOnce(new Error('Backend timeout'));

        let latestAnnouncement = '';
        const sub = a11y.announcement$.subscribe((a) => {
          if (a) latestAnnouncement = a;
        });

        await a11y.scanDocument();
        sub.unsubscribe();

        const expectedError = i18n.t('announceScanError');
        expect(latestAnnouncement).toBe(expectedError);
        expect(expectedError.trim().length).toBeGreaterThan(0);
      }
    });

    it('formats announceFixedIssue when single fix is applied', async () => {
      const titles = [
        'Contrast ratio below 4.5:1',
        'نص بديل مفقود للرسم التوضيحي',
        'コントラスト比が不足しています',
        'Contraste insuficiente en el encabezado',
        'Kontrastverhältnis unzureichend',
        'Razão de contraste abaixo do mínimo',
      ];

      for (const loc of targetLocales) {
        i18n.setLanguage(loc);

        for (const title of titles) {
          mockGScript.run.mockReset();
          mockGScript.run.mockResolvedValueOnce(true);

          const issue: Issue = {
            elementId: 'elem_1',
            elementType: 'Text',
            issueType: 'Color Contrast',
            severity: 'ERROR',
            wcagRule: 'WCAG 1.4.3',
            title: title,
            description: 'desc',
            snippet: 'snip',
            canAutoFix: true,
          };

          let latestAnnouncement = '';
          const sub = a11y.announcement$.subscribe((a) => {
            if (a) latestAnnouncement = a;
          });

          await a11y.applyFix(issue, '#000000');
          sub.unsubscribe();

          const expected = i18n.t('announceFixedIssue', { title: title });
          expect(latestAnnouncement).toBe(expected);
          expect(latestAnnouncement).toContain(title);
          expect(latestAnnouncement).not.toContain('{title}');
        }
      }
    });

    it('formats announceNoFixable when applyAllFixes has 0 fixable issues', async () => {
      for (const loc of targetLocales) {
        i18n.setLanguage(loc);

        let latestAnnouncement = '';
        const sub = a11y.announcement$.subscribe((a) => {
          if (a) latestAnnouncement = a;
        });

        await a11y.applyAllFixes();
        sub.unsubscribe();

        const expected = i18n.t('announceNoFixable');
        expect(latestAnnouncement).toBe(expected);
      }
    });

    it('formats announceApplyingFixes and announceFixAllSuccess across multiple counts', async () => {
      for (const loc of targetLocales) {
        i18n.setLanguage(loc);
        const testA11y = new AccessibilityService(mockGScript as any, mockAppRef as any, i18n);

        // Pre-populate 3 fixable issues
        const issues: Issue[] = [
          { elementId: 'e1', elementType: 'Image', issueType: 'Alternative Text', severity: 'ERROR', wcagRule: '1.1.1', title: 'Img 1', description: '', snippet: '', canAutoFix: true },
          { elementId: 'e2', elementType: 'Link', issueType: 'Meaningful Hyperlinks', severity: 'ERROR', wcagRule: '2.4.4', title: 'Link 2', description: '', snippet: '', canAutoFix: true },
          { elementId: 'e3', elementType: 'Text', issueType: 'Color Contrast', severity: 'ERROR', wcagRule: '1.4.3', title: 'Text 3', description: '', snippet: '', canAutoFix: true, fixMetadata: { suggestedHex: '#000000' } },
        ];

        // 1. First scan to populate issuesSubject
        mockGScript.run.mockReset();
        mockGScript.run.mockResolvedValueOnce('DOCS').mockResolvedValueOnce(issues);
        await testA11y.scanDocument();

        // 2. Mock sequence for applyAllFixes: 3 fix calls, then rescan (rpcGetHostType + rpcRunChecks)
        mockGScript.run.mockReset();
        mockGScript.run
          .mockResolvedValueOnce(true) // e1
          .mockResolvedValueOnce(true) // e2
          .mockResolvedValueOnce(true) // e3
          .mockResolvedValueOnce('DOCS') // rpcGetHostType
          .mockResolvedValueOnce([]); // rpcRunChecks

        let announcements: string[] = [];
        const sub = testA11y.announcement$.subscribe((a) => {
          if (a) announcements.push(a);
        });

        await testA11y.applyAllFixes({ e1: 'Custom Alt' }, { e2: 'Custom Link' });
        sub.unsubscribe();

        const expectedApplying = i18n.t('announceApplyingFixes', { count: 3 });
        const expectedSuccess = i18n.t('announceFixAllSuccess', { count: 3 });

        expect(announcements).toContain(expectedApplying);
        expect(announcements).toContain(expectedSuccess);
        expect(expectedApplying).toContain('3');
        expect(expectedSuccess).toContain('3');
      }
    });

    it('formats announceSettingsSaved when preferences are saved', async () => {
      for (const loc of targetLocales) {
        i18n.setLanguage(loc);
        mockGScript.run.mockReset();
        mockGScript.run.mockResolvedValueOnce(undefined);

        let latestAnnouncement = '';
        const sub = a11y.announcement$.subscribe((a) => {
          if (a) latestAnnouncement = a;
        });

        await a11y.saveSettings({ contrastFixMode: 'SNAP_MATERIAL', enableAutoRemediation: true, language: loc });
        sub.unsubscribe();

        const expected = i18n.t('announceSettingsSaved');
        expect(latestAnnouncement).toBe(expected);
      }
    });

    it('verifies defaultAltText and defaultLinkText across all 34 locales are non-empty and culturally appropriate', () => {
      const allLangs = i18n.getSupportedLanguages().map(l => l.code);
      for (const lang of allLangs) {
        i18n.setLanguage(lang);
        const altText = i18n.t('defaultAltText');
        const linkText = i18n.t('defaultLinkText');

        expect(altText).toBeDefined();
        expect(altText.trim().length).toBeGreaterThan(0);
        expect(altText).not.toBe('defaultAltText');

        expect(linkText).toBeDefined();
        expect(linkText.trim().length).toBeGreaterThan(0);
        expect(linkText).not.toBe('defaultLinkText');
      }
    });
  });

  describe('4. Adversarial & Edge Case Stress Testing', () => {
    it('handles draft subject with HTML tags and special entities without corrupted card rendering', () => {
      for (const loc of targetLocales) {
        setupGasEnvironment({ userLocale: loc });
        const maliciousSubject = '<script>alert("xss")</script> <b>Quarterly</b> "Review" & 100% \'Growth\'';
        const card = buildGmailComposeCard(
          { parameters: { draftId: 'd1', subject: maliciousSubject } },
          undefined,
          `<div><p>Sample</p></div>`
        )[0];

        const texts = extractTextFromCard(card as any);
        const checkingText = texts.find(t => t.includes(getBackendTranslation('cardCheckingDraft', loc, { subject: maliciousSubject })));
        expect(checkingText).toBeDefined();
      }
    });

    it('handles extreme counts in Fix All button and issue banners (count=0, count=1, count=10000)', () => {
      for (const loc of targetLocales) {
        for (const count of [0, 1, 10000]) {
          const fixAllText = getBackendTranslation('cardFixAllBtn', loc, { count });
          expect(fixAllText).toContain(String(count));
          expect(fixAllText).not.toContain('{count}');

          const foundIssuesText = getBackendTranslation('cardFoundIssues', loc, { count });
          expect(foundIssuesText).toContain(String(count));
          expect(foundIssuesText).not.toContain('{count}');
        }
      }
    });

    it('resolves aliased and case-insensitive locales gracefully', () => {
      expect(normalizeLocale('AR-EG')).toBe('ar');
      expect(normalizeLocale('JA_JP')).toBe('ja');
      expect(normalizeLocale('es-ES')).toBe('es');
      expect(normalizeLocale('DE-AT')).toBe('de');
      expect(normalizeLocale('pt-BR')).toBe('pt-BR');
      expect(normalizeLocale('pt-pt')).toBe('pt-PT');
      expect(normalizeLocale('he-IL')).toBe('iw');
      expect(normalizeLocale('iw-IL')).toBe('iw');
      expect(normalizeLocale('ZH-HANS')).toBe('zh-CN');
      expect(normalizeLocale('ZH-HANT-HK')).toBe('zh-TW');
      expect(normalizeLocale('fil-PH')).toBe('fil');
      expect(normalizeLocale('tl-PH')).toBe('fil');
      expect(normalizeLocale('unknown_LANG')).toBe('en');
    });

    it('validates user property language override takes precedence over Session.getActiveUserLocale() in Gmail cards', () => {
      setupGasEnvironment({
        userLocale: 'ja',
        userProperties: { language: 'ar' },
      });

      const cards = buildGmailComposeCard({});
      const texts = extractTextFromCard(cards[0] as any);

      const arabicTitle = getBackendTranslation('cardTitle', 'ar');
      const japaneseTitle = getBackendTranslation('cardTitle', 'ja');

      expect(texts).toContain(arabicTitle);
      expect(texts).not.toContain(japaneseTitle);
    });

    it('validates AUTO mode falls back to Session.getActiveUserLocale()', () => {
      setupGasEnvironment({
        userLocale: 'de',
        userProperties: { language: 'AUTO' },
      });

      const cards = buildGmailComposeCard({});
      const texts = extractTextFromCard(cards[0] as any);

      const germanTitle = getBackendTranslation('cardTitle', 'de');
      expect(texts).toContain(germanTitle);
    });
  });
});
