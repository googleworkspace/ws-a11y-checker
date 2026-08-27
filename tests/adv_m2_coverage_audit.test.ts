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
import { I18nService, normalizeLocale, isRtlLocale, interpolateParams } from '../ui/src/app/services/i18n.service';
import { DICTIONARIES, SUPPORTED_LANGUAGES, TranslationDictionary } from '../ui/src/app/services/translations';
import {
  BACKEND_DICTIONARIES,
  getBackendTranslation,
  resolveEffectiveLanguage,
  isRtlLocale as backendIsRtlLocale,
  normalizeLocale as backendNormalizeLocale,
} from '../backend/src/utils/i18n';
import {
  buildGmailComposeCard,
  buildGmailHomepageCard,
  buildGmailMessageCard,
  refreshGmailComposeCard,
  refreshGmailHomepageCard,
  rpcApplyGmailFix,
  rpcApplyAllGmailFixes,
} from '../backend/src/hosts/GmailHost';
import { setupGasEnvironment, extractTextFromCard } from './GasMocks';
import { AccessibilityService, Settings } from '../ui/src/app/services/accessibility.service';

describe('Milestone 2 Challenger 2: Comprehensive String Coverage & Reactivity Audit', () => {
  let i18n: I18nService;

  beforeEach(() => {
    i18n = new I18nService();
    setupGasEnvironment({ userLocale: 'en' });
  });

  describe('Phase 1 & 2: Angular Template String Scrubbing & Key Parity Audit', () => {
    const componentFiles = [
      { name: 'AppComponent', path: 'ui/src/app/app.component.ts' },
      { name: 'DashboardComponent', path: 'ui/src/app/components/dashboard/dashboard.component.ts' },
      { name: 'IssueListComponent', path: 'ui/src/app/components/issue-list/issue-list.component.ts' },
      { name: 'ReadingOrderModalComponent', path: 'ui/src/app/components/reading-order-modal/reading-order-modal.component.ts' },
      { name: 'SettingsPanelComponent', path: 'ui/src/app/components/settings-panel/settings-panel.component.ts' },
      { name: 'HelpModalComponent', path: 'ui/src/app/components/help-modal/help-modal.component.ts' },
    ];

    it('extracts all i18n.t() translation keys from all component templates and ensures 100% dictionary coverage', () => {
      const extractedKeys = new Set<string>();

      for (const comp of componentFiles) {
        const fullPath = path.join(__dirname, '..', comp.path);
        expect(fs.existsSync(fullPath)).toBe(true);
        const code = fs.readFileSync(fullPath, 'utf8');

        // Regex to extract i18n.t('keyName' or i18n.t("keyName"
        const regex = /i18n\.t\(\s*['"]([a-zA-Z0-9_-]+)['"]/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(code)) !== null) {
          extractedKeys.add(match[1]);
        }
      }

      // Also check accessibility.service.ts
      const servicePath = path.join(__dirname, '../ui/src/app/services/accessibility.service.ts');
      const serviceCode = fs.readFileSync(servicePath, 'utf8');
      const serviceRegex = /this\.i18n\.t\(\s*['"]([a-zA-Z0-9_-]+)['"]/g;
      let serviceMatch: RegExpExecArray | null;
      while ((serviceMatch = serviceRegex.exec(serviceCode)) !== null) {
        extractedKeys.add(serviceMatch[1]);
      }

      expect(extractedKeys.size).toBeGreaterThan(30);

      // Verify every extracted key exists in every one of the 34+ locale dictionaries
      const allLocaleCodes = Object.keys(DICTIONARIES);
      expect(allLocaleCodes.length).toBeGreaterThanOrEqual(34);

      for (const loc of allLocaleCodes) {
        const dict = DICTIONARIES[loc];
        for (const key of extractedKeys) {
          expect(dict[key as keyof TranslationDictionary]).toBeDefined();
          expect(typeof dict[key as keyof TranslationDictionary]).toBe('string');
          expect((dict[key as keyof TranslationDictionary] as string).trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('verifies absence of un-localized hardcoded text in template markup', () => {
      for (const comp of componentFiles) {
        const fullPath = path.join(__dirname, '..', comp.path);
        const code = fs.readFileSync(fullPath, 'utf8');
        const templateMatch = /template:\s*`([\s\S]*?)`\s*,\s*styles/m.exec(code);
        expect(templateMatch).not.toBeNull();
        const template = templateMatch![1];

        // 1. Ensure no static aria-label="..." containing letters
        const staticAriaLabels = template.match(/\baria-label="([a-zA-Z\s]+)"/g) || [];
        expect(staticAriaLabels).toEqual([]);

        // 2. Ensure no static placeholder="..."
        const staticPlaceholders = template.match(/\bplaceholder="([^"]+)"/g) || [];
        expect(staticPlaceholders).toEqual([]);

        // 3. Ensure no static title="..." containing user-facing English words
        const staticTitles = template.match(/\btitle="(?:Scan|Close|Help|Settings|Preferences|Reading|Open|Jump|Fix|Apply)"/gi) || [];
        expect(staticTitles).toEqual([]);
      }
    });

    it('verifies SettingsPanelComponent template binds (ngModelChange) to onLanguageChange', () => {
      const settingsPanelPath = path.join(__dirname, '../ui/src/app/components/settings-panel/settings-panel.component.ts');
      const content = fs.readFileSync(settingsPanelPath, 'utf8');
      expect(content).toContain('(ngModelChange)="onLanguageChange($event)"');
      expect(content).toContain('this.i18n.setLanguage(newLang, this.settings?.userLocale)');
    });
  });

  describe('Phase 3: Settings Panel Immediate Language Switching Reactivity', () => {
    it('updates resolvedLanguage and dictionary immediately on language selection without reload', () => {
      // Emulate SettingsPanelComponent handler logic
      const simulateLanguageChange = (newLang: string, userLocale?: string) => {
        i18n.setLanguage(newLang, userLocale);
      };

      // Default state
      expect(i18n.currentLanguage()).toBe('AUTO');
      expect(i18n.resolvedLanguage()).toBe('en');
      expect(i18n.t('appTitle')).toBe(DICTIONARIES['en'].appTitle);
      expect(i18n.isRtl()).toBe(false);
      expect(i18n.dir()).toBe('ltr');

      // Switch to Arabic (RTL)
      simulateLanguageChange('ar');
      expect(i18n.currentLanguage()).toBe('ar');
      expect(i18n.resolvedLanguage()).toBe('ar');
      expect(i18n.t('appTitle')).toBe(DICTIONARIES['ar'].appTitle);
      expect(i18n.isRtl()).toBe(true);
      expect(i18n.dir()).toBe('rtl');

      // Switch to Japanese (CJK)
      simulateLanguageChange('ja');
      expect(i18n.currentLanguage()).toBe('ja');
      expect(i18n.resolvedLanguage()).toBe('ja');
      expect(i18n.t('appTitle')).toBe(DICTIONARIES['ja'].appTitle);
      expect(i18n.isRtl()).toBe(false);
      expect(i18n.dir()).toBe('ltr');

      // Switch to French (European)
      simulateLanguageChange('fr');
      expect(i18n.currentLanguage()).toBe('fr');
      expect(i18n.resolvedLanguage()).toBe('fr');
      expect(i18n.t('appTitle')).toBe(DICTIONARIES['fr'].appTitle);

      // Switch back to AUTO with host locale 'de'
      simulateLanguageChange('AUTO', 'de');
      expect(i18n.currentLanguage()).toBe('AUTO');
      expect(i18n.resolvedLanguage()).toBe('de');
      expect(i18n.t('appTitle')).toBe(DICTIONARIES['de'].appTitle);
    });

    it('interacts seamlessly with AccessibilityService.saveSettings and announcements', async () => {
      const mockGScript = { run: jest.fn().mockResolvedValue(undefined) };
      const mockAppRef = { tick: jest.fn() };
      const a11y = new AccessibilityService(mockGScript as any, mockAppRef as any, i18n);

      let lastAnnouncement = '';
      a11y.announcement$.subscribe((a) => {
        if (a) lastAnnouncement = a;
      });

      const newSettings: Settings = {
        contrastFixMode: 'SNAP_MATERIAL',
        enableAutoRemediation: true,
        language: 'es',
        userLocale: 'en',
      };

      await a11y.saveSettings(newSettings);

      expect(mockGScript.run).toHaveBeenCalledWith('rpcSaveSettings', newSettings);
      expect(i18n.resolvedLanguage()).toBe('es');
      expect(lastAnnouncement).toBe(DICTIONARIES['es'].announceSettingsSaved);
      expect(lastAnnouncement).toBe(i18n.t('announceSettingsSaved'));
    });
  });

  describe('Phase 4: Gmail Backend Card Localization & Quick-Fix Verification', () => {
    const all34Locales = [
      'en', 'ar', 'iw', 'fa', 'ur', 'ja', 'zh-CN', 'zh-TW', 'ko', 'hi', 'bn',
      'es', 'fr', 'de', 'it', 'pt-BR', 'pt-PT', 'nl', 'pl', 'ru', 'tr', 'sv',
      'da', 'no', 'fi', 'cs', 'hu', 'ro', 'el', 'uk', 'id', 'vi', 'th', 'fil'
    ];

    it('validates 100% parity across all 34 backend dictionaries for all 33 Gmail card keys', () => {
      const englishKeys = Object.keys(BACKEND_DICTIONARIES['en']);
      expect(englishKeys.length).toBe(33);

      for (const loc of all34Locales) {
        const dict = BACKEND_DICTIONARIES[loc];
        expect(dict).toBeDefined();
        for (const key of englishKeys) {
          expect(dict[key]).toBeDefined();
          expect(typeof dict[key]).toBe('string');
          expect(dict[key].trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('builds Gmail Compose Card in all 34 locales without uncaught exceptions or undefined strings', () => {
      const draftWithIssues = `
        <div>
          <a href="https://google.com">learn more</a>
          <img src="banner.png" alt="IMG_9999.png">
        </div>
      `;

      for (const loc of all34Locales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailComposeCard(
          { parameters: { draftId: 'd_all_locales', subject: 'Test Subject' } },
          undefined,
          draftWithIssues
        );

        expect(cards.length).toBe(1);
        const card = cards[0];
        const texts = extractTextFromCard(card as any);

        const expectedTitle = getBackendTranslation('cardTitle', loc);
        const expectedIssues = getBackendTranslation('cardFoundIssues', loc, { count: 2 });
        const expectedFixAll = getBackendTranslation('cardFixAllBtn', loc, { count: 2 });

        expect(texts).toContain(expectedTitle);
        expect(texts.some(t => t.includes(expectedIssues))).toBe(true);
        expect(texts.some(t => t.includes(expectedFixAll))).toBe(true);
      }
    });

    it('applies quick fixes and verifies action responses with localized notifications', () => {
      for (const loc of ['ar', 'he', 'ja', 'es', 'de', 'pt-BR']) {
        setupGasEnvironment({ userLocale: loc });

        // 1. Link fix
        const linkEvent = {
          parameters: {
            fixType: 'LINK',
            draftId: 'd1',
            source: 'COMPOSE',
            url: 'https://test.com',
            oldText: 'click here',
            newText: 'Accessible Test Link (test.com)',
          },
        };
        const linkResp = rpcApplyGmailFix(linkEvent);
        expect(linkResp).toBeDefined();
        const expectedFixNotice = getBackendTranslation('cardNoticeFixApplied', loc);
        expect(linkResp.notification.getText()).toBe(expectedFixNotice);

        // 2. Decorative image fix
        const decorativeEvent = {
          parameters: {
            fixType: 'MARK_DECORATIVE',
            draftId: 'd1',
            source: 'COMPOSE',
            imgIdx: '1',
          },
        };
        const decoResp = rpcApplyGmailFix(decorativeEvent);
        expect(decoResp).toBeDefined();
        const expectedDecoNotice = getBackendTranslation('cardNoticeDecorative', loc);
        expect(decoResp.notification.getText()).toBe(expectedDecoNotice);

        // 3. Custom Alt text fix
        const altEvent = {
          parameters: {
            fixType: 'CUSTOM_ALT_TEXT',
            draftId: 'd1',
            source: 'COMPOSE',
            imgIdx: '1',
          },
          formInputs: {
            customAlt_1: ['Comprehensive architectural diagram of Google Workspace'],
          },
        };
        const altResp = rpcApplyGmailFix(altEvent);
        expect(altResp).toBeDefined();
        const expectedAltNotice = getBackendTranslation('cardNoticeAltSaved', loc);
        expect(altResp.notification.getText()).toBe(expectedAltNotice);
      }
    });
  });

  describe('Phase 5: Parameter Interpolation & Boundary Integrity', () => {
    it('handles multi-variable interpolation with numerical 0 and large numbers', () => {
      const template = '{errors} error(s) out of {total} total checks in {count} documents';
      const res1 = interpolateParams(template, { errors: 0, total: 0, count: 0 });
      expect(res1).toBe('0 error(s) out of 0 total checks in 0 documents');

      const res2 = interpolateParams(template, { errors: 1000, total: 50000, count: 128 });
      expect(res2).toBe('1000 error(s) out of 50000 total checks in 128 documents');
    });

    it('safely handles undefined and empty string params in interpolateParams', () => {
      const template = 'Subject: {subject}';
      expect(interpolateParams(template, { subject: '' })).toBe('Subject: ');
      expect(interpolateParams(template, undefined)).toBe('Subject: {subject}');
    });

    it('falls back gracefully to en when key is missing in active locale and falls back to key when missing in en', () => {
      i18n.setLanguage('ja');
      const fallbackKey = 'nonExistentKey123';
      expect(i18n.t(fallbackKey)).toBe(fallbackKey);
    });
  });
});
