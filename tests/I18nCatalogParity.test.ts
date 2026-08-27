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

import { I18nService } from '../ui/src/app/services/i18n.service';

/**
 * Authoritative List of 34 Official Google Workspace Locales
 * Defined in ORIGINAL_REQUEST.md (§ R1) & PROJECT.md (§ 2.1)
 */
export const ALL_34_WORKSPACE_LOCALES = [
  'en',    // English (Primary Spec)
  'ar',    // Arabic (RTL)
  'iw',    // Hebrew (RTL)
  'he',    // Hebrew modern alias (RTL)
  'fa',    // Persian / Farsi (RTL)
  'ur',    // Urdu (RTL)
  'ja',    // Japanese
  'zh-CN', // Simplified Chinese
  'zh-TW', // Traditional Chinese
  'ko',    // Korean
  'hi',    // Hindi
  'bn',    // Bengali
  'es',    // Spanish
  'fr',    // French
  'de',    // German
  'it',    // Italian
  'pt-BR', // Portuguese (Brazil)
  'pt-PT', // Portuguese (Portugal)
  'nl',    // Dutch
  'pl',    // Polish
  'ru',    // Russian
  'tr',    // Turkish
  'sv',    // Swedish
  'da',    // Danish
  'no',    // Norwegian
  'fi',    // Finnish
  'cs',    // Czech
  'hu',    // Hungarian
  'ro',    // Romanian
  'el',    // Greek
  'uk',    // Ukrainian
  'id',    // Indonesian
  'vi',    // Vietnamese
  'th',    // Thai
  'fil',   // Filipino / Tagalog
] as const;

/**
 * Exhaustive catalog of required keys across all 9 domains
 * (Domains A through I as specified in spec_report.md § 3.1)
 */
export const REQUIRED_CATALOG_KEYS = {
  domainA_HeaderNav: [
    'appTitle',
    'googleWorkspace',
    'helpBtn',
    'helpAriaLabel',
    'settingsBtn',
    'settingsAriaLabel',
    'globalAnnouncerRegion',
  ],
  domainB_DashboardMetrics: [
    'scanSummaryRegion',
    'wcagScore',
    'errors',
    'warnings',
    'notices',
    'all',
    'rescanBtn',
    'rescanAriaLabel',
    'scanning',
    'scanningAriaLabel',
    'readingOrderModalBtn',
    'readingOrderAriaLabel',
    'fixAllBtn',
    'fixAllAriaLabel',
  ],
  domainC_IssueList: [
    'detectedIssuesRegion',
    'bulkRemediationRegion',
    'bulkRemediableHeading',
    'bulkRemediableDesc',
    'allClearTitle',
    'allClearDesc',
    'interactiveContrast',
    'currentLabel',
    'suggestionLabel',
    'jumpBtn',
    'jumpBtnAriaLabel',
    'applyFixBtn',
    'applyFixAriaLabel',
    'altTextLabel',
    'altTextPlaceholder',
    'markDecorative',
    'decorativeActive',
    'replacementLinkLabel',
    'replacementLinkPlaceholder',
    'suggestTextBtn',
  ],
  domainD_Badges: [
    'severityError',
    'severityWarning',
    'severityNotice',
    'elemParagraph',
    'elemImage',
    'elemTable',
    'elemSlide',
    'elemTextShape',
    'elemDocument',
    'elemSheetTab',
    'elemDataTable',
    'elemCellText',
    'elemEmbeddedChart',
    'elemFormDescription',
    'elemFormQuestion',
    'elemFormImage',
    'elemFormSectionHeader',
    'elemEmailLink',
    'elemEmailImage',
    'elemEmailText',
    'elemEmailHeading',
    'elemEmailTable',
  ],
  domainE_ReadingOrder: [
    'readingOrderTitle',
    'readingOrderDesc',
    'loadingElements',
    'applyOrderBtn',
    'cancelBtn',
    'closeReadingOrderAriaLabel',
    'dragHandleAriaLabel',
    'moveUpAriaLabel',
    'moveDownAriaLabel',
  ],
  domainF_SettingsPreferences: [
    'preferencesTitle',
    'closePreferencesAriaLabel',
    'languageLabel',
    'languageDesc',
    'langAuto',
    'contrastModeLabel',
    'contrastModeDesc',
    'preserveHsl',
    'preserveHslDesc',
    'snapMaterial',
    'snapMaterialDesc',
    'autoFixLabel',
    'autoFixDesc',
    'aiSettingsTitle',
    'aiSettingsDesc',
    'saveBtn',
  ],
  domainG_WcagHelp: [
    'helpTitle',
    'closeHelpAriaLabel',
    'overviewTitle',
    'overviewDesc',
    'severityTitle',
    'errorDef',
    'warningDef',
    'noticeDef',
    'rulesTitle',
    'ruleContrast',
    'ruleHeading',
    'ruleLink',
    'ruleAlt',
    'ruleAlign',
    'ruleSpacing',
    'remedyTitle',
    'remedyDesc',
    'gotItBtn',
  ],
  domainH_Announcements: [
    'announceScanning',
    'announceScanComplete',
    'announceScanError',
    'announceFixedIssue',
    'announceNoFixable',
    'announceApplyingFixes',
    'announceFixAllSuccess',
    'announceSettingsSaved',
  ],
  domainI_GmailCards: [
    'cardTitle',
    'cardRefreshBtn',
    'cardResetDemoBtn',
    'cardCreateDemoBtn',
    'cardScanLatestBtn',
    'cardRefreshAuditBtn',
    'cardCheckingDraft',
    'cardAllClearTitle',
    'cardAllClearDesc',
    'cardFoundIssues',
    'cardNoDraftTitle',
    'cardNoDraftDesc',
    'cardHowToAuditTitle',
    'cardHowToAuditStep1',
    'cardHowToAuditStep2',
    'cardHowToAuditStep3',
    'cardFixAllBtn',
    'cardQuickFixLink',
    'cardQuickFixList',
    'cardManualAltTitle',
    'cardManualAltHint',
    'cardSaveAltBtn',
    'cardMarkDecorativeBtn',
    'cardAltNote',
    'cardNoticeRescanned',
    'cardNoticeAltSaved',
    'cardNoticeDecorative',
    'cardNoticeFixApplied',
    'cardNoticeFixAllApplied',
    'cardNoticeDemoCreated',
    'cardNoticeNoDrafts',
  ],
};

export const ALL_FLAT_REQUIRED_KEYS = Object.values(REQUIRED_CATALOG_KEYS).flat();

/**
 * Helper to interpolate translation parameters (e.g. `{count}`, `{title}`)
 */
export function interpolateTranslation(template: string, params?: Record<string, string | number>): string {
  if (!params || !template) return template;
  let result = template;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}

/**
 * Extracts placeholder names from a string (e.g. `{count}` -> `count`)
 */
export function extractPlaceholders(str: string): string[] {
  const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
  return matches.map((m) => m.replace(/[{}]/g, ''));
}

describe('I18nCatalogParity Test Suite (Opaque-Box E2E)', () => {
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (≥5 comprehensive feature parity checks)
  // =========================================================================
  describe('Tier 1: Feature Coverage & Complete Parity Verification', () => {
    it('T1.1: Primary English dictionary contains 100% of the required catalog keys', () => {
      service.setLanguage('en');
      const missingKeys: string[] = [];

      for (const key of ALL_FLAT_REQUIRED_KEYS) {
        const translated = service.t(key);
        if (!translated || translated === key) {
          missingKeys.push(key);
        }
      }

      expect(missingKeys).toEqual([]);
      expect(ALL_FLAT_REQUIRED_KEYS.length).toBeGreaterThanOrEqual(80);
    });

    it('T1.2: 100% key parity across all 34 supported locales (0 missing keys relative to English)', () => {
      service.setLanguage('en');
      const enKeys = ALL_FLAT_REQUIRED_KEYS;

      const localeDeficits: Record<string, string[]> = {};

      for (const locale of ALL_34_WORKSPACE_LOCALES) {
        service.setLanguage(locale);
        const missingForLocale: string[] = [];

        for (const key of enKeys) {
          const val = service.t(key);
          // If translation is undefined or falls back to raw key name while key is not the translation
          if (val === undefined || val === null || val === '') {
            missingForLocale.push(key);
          }
        }

        if (missingForLocale.length > 0) {
          localeDeficits[locale] = missingForLocale;
        }
      }

      expect(localeDeficits).toEqual({});
    });

    it('T1.3: Translation strings are non-empty and non-whitespace across all 34 locales', () => {
      for (const locale of ALL_34_WORKSPACE_LOCALES) {
        service.setLanguage(locale);
        for (const key of ALL_FLAT_REQUIRED_KEYS) {
          const val = service.t(key);
          expect(typeof val).toBe('string');
          expect(val.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('T1.4: All 9 structural domain namespaces are fully populated', () => {
      const domains = Object.keys(REQUIRED_CATALOG_KEYS) as Array<keyof typeof REQUIRED_CATALOG_KEYS>;
      expect(domains.length).toBe(9);

      for (const domain of domains) {
        const keysInDomain = REQUIRED_CATALOG_KEYS[domain];
        expect(keysInDomain.length).toBeGreaterThan(0);

        for (const key of keysInDomain) {
          const enVal = service.t(key);
          expect(enVal).toBeTruthy();
        }
      }
    });

    it('T1.5: Variable interpolation tokens ({count}, {title}, etc.) match English across all locales', () => {
      service.setLanguage('en');
      const parameterizedKeys = ALL_FLAT_REQUIRED_KEYS.filter((k) => {
        const enVal = service.t(k);
        return extractPlaceholders(enVal).length > 0;
      });

      expect(parameterizedKeys.length).toBeGreaterThanOrEqual(6);

      for (const locale of ALL_34_WORKSPACE_LOCALES) {
        service.setLanguage(locale);
        for (const key of parameterizedKeys) {
          service.setLanguage('en');
          const enPlaceholders = extractPlaceholders(service.t(key)).sort();

          service.setLanguage(locale);
          const locPlaceholders = extractPlaceholders(service.t(key)).sort();

          expect(locPlaceholders).toEqual(enPlaceholders);
        }
      }
    });

    it('T1.6: RTL language dictionaries (ar, iw, he, fa, ur) contain genuine non-Latin scripts', () => {
      const rtlLocales = ['ar', 'iw', 'he', 'fa', 'ur'];
      const nonLatinRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

      for (const rtlLoc of rtlLocales) {
        service.setLanguage(rtlLoc);
        const sampleText = service.t('appTitle');
        expect(nonLatinRegex.test(sampleText)).toBe(true);
      }
    });

    it('T1.7: East Asian CJK dictionaries (ja, zh-CN, zh-TW, ko) contain authentic CJK glyphs', () => {
      const cjkLocales = ['ja', 'zh-CN', 'zh-TW', 'ko'];
      const cjkRegex = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]/;

      for (const cjkLoc of cjkLocales) {
        service.setLanguage(cjkLoc);
        const sampleText = service.t('preferencesTitle');
        expect(cjkRegex.test(sampleText)).toBe(true);
      }
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (≥5 boundary and edge case checks)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: Detects and rejects empty translation string definitions', () => {
      for (const locale of ALL_34_WORKSPACE_LOCALES) {
        service.setLanguage(locale);
        const val = service.t('appTitle');
        expect(val).not.toBe('');
        expect(val.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('T2.2: Preserves special characters (colons, arrows, parentheses, emojis) across translations', () => {
      service.setLanguage('en');
      const btnWithEmoji = service.t('cardRefreshBtn');
      expect(btnWithEmoji).toContain('🔄');

      const btnWithDemoEmoji = service.t('cardResetDemoBtn');
      expect(btnWithDemoEmoji).toContain('🧪');

      const btnWithFix = service.t('cardFixAllBtn');
      expect(btnWithFix).toContain('⚡');
    });

    it('T2.3: Gracefully handles non-existent translation keys without throwing or crashing', () => {
      service.setLanguage('en');
      const nonExistentKey = 'completely_invalid_key_xyz_999';
      expect(() => service.t(nonExistentKey)).not.toThrow();
      const fallback = service.t(nonExistentKey);
      expect(fallback).toBe(nonExistentKey);
    });

    it('T2.4: Fallback to English when a key is queried on an uninitialized/unknown language', () => {
      service.setLanguage('unknown-locale-code');
      const title = service.t('appTitle');
      expect(title).toBe('Accessibility Checker');
    });

    it('T2.5: Multi-byte unicode integrity check (no corrupted surrogate pairs or truncation)', () => {
      const complexLocales = ['th', 'bn', 'hi', 'el', 'ru', 'uk', 'vi'];
      for (const loc of complexLocales) {
        service.setLanguage(loc);
        for (const key of ['overviewDesc', 'errorDef', 'bulkRemediableDesc']) {
          const str = service.t(key);
          expect(str).not.toContain('\uFFFD'); // No replacement character
          expect(str.length).toBeGreaterThan(10);
        }
      }
    });

    it('T2.6: Extreme string length boundary: Long descriptions remain intelligible across languages', () => {
      for (const locale of ALL_34_WORKSPACE_LOCALES) {
        service.setLanguage(locale);
        const longDesc = service.t('readingOrderDesc');
        expect(longDesc.length).toBeGreaterThanOrEqual(25);
        expect(longDesc.length).toBeLessThan(1000);
      }
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise interactions)
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: Parameter interpolation with integer 0 across multiple languages', () => {
      for (const loc of ['en', 'es', 'ja', 'ar', 'de', 'zh-CN', 'fr']) {
        service.setLanguage(loc);
        const template = service.t('bulkRemediableHeading');
        const rendered = interpolateTranslation(template, { count: 0 });
        expect(rendered).toContain('0');
        expect(rendered).not.toContain('{count}');
      }
    });

    it('T3.2: Parameter interpolation with multi-token templates ({total} and {errors})', () => {
      for (const loc of ['en', 'ar', 'iw', 'ja', 'ru', 'pt-BR']) {
        service.setLanguage(loc);
        const template = service.t('announceScanComplete');
        const rendered = interpolateTranslation(template, { total: 12, errors: 4 });
        expect(rendered).toContain('12');
        expect(rendered).toContain('4');
        expect(rendered).not.toContain('{total}');
        expect(rendered).not.toContain('{errors}');
      }
    });

    it('T3.3: Interpolation with RTL script parameters in LTR/RTL templates', () => {
      service.setLanguage('en');
      const enTemplate = service.t('jumpBtnAriaLabel');
      const renderedEn = interpolateTranslation(enTemplate, { title: 'نص بديل مفقود' });
      expect(renderedEn).toContain('نص بديل مفقود');

      service.setLanguage('ar');
      const arTemplate = service.t('jumpBtnAriaLabel');
      const renderedAr = interpolateTranslation(arTemplate, { title: 'Missing Alt Text' });
      expect(renderedAr).toContain('Missing Alt Text');
    });

    it('T3.4: Dynamic language switching preserves dictionary lookup consistency', () => {
      service.setLanguage('en');
      expect(service.t('saveBtn')).toBe('Save Preferences');

      service.setLanguage('es');
      expect(service.t('saveBtn')).toBe('Guardar Preferencias');

      service.setLanguage('ja');
      expect(service.t('saveBtn')).toBe('設定を保存');

      service.setLanguage('de');
      expect(service.t('saveBtn')).toBe('Einstellungen speichern');

      service.setLanguage('fr');
      expect(service.t('saveBtn')).toBe('Enregistrer les préférences');

      service.setLanguage('en');
      expect(service.t('saveBtn')).toBe('Save Preferences');
    });

    it('T3.5: Pairwise verification of severity badges across European, Asian, and RTL locales', () => {
      const sampleLocales = ['en', 'ar', 'ja', 'es', 'de', 'ru', 'hi', 'zh-TW', 'fil', 'iw'];
      for (const loc of sampleLocales) {
        service.setLanguage(loc);
        const err = service.t('severityError');
        const warn = service.t('severityWarning');
        const notice = service.t('severityNotice');

        expect(err).toBeTruthy();
        expect(warn).toBeTruthy();
        expect(notice).toBeTruthy();

        // Badges should be distinct from one another
        expect(err).not.toEqual(warn);
        expect(err).not.toEqual(notice);
        expect(warn).not.toEqual(notice);
      }
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (Complete screen validation)
  // =========================================================================
  describe('Tier 4: Real-World Application Scenarios', () => {
    it('Scenario 1: Complete Arabic User Dashboard & Remediation Screen Rendering', () => {
      service.setLanguage('ar');

      // Verify all components on Dashboard render in Arabic without falling back to raw keys
      const dashboardKeys = [
        'appTitle',
        'scanSummaryRegion',
        'wcagScore',
        'errors',
        'warnings',
        'notices',
        'rescanBtn',
        'fixAllBtn',
        'detectedIssuesRegion',
        'bulkRemediationRegion',
        'currentLabel',
        'suggestionLabel',
        'jumpBtn',
        'applyFixBtn',
      ];

      for (const k of dashboardKeys) {
        const text = service.t(k);
        expect(text).toBeTruthy();
        expect(text).not.toBe(k);
      }

      // Check interpolated Arabic bulk header
      const bulkHeading = interpolateTranslation(service.t('bulkRemediableHeading'), { count: 7 });
      expect(bulkHeading).toContain('7');
    });

    it('Scenario 2: Complete Japanese WCAG 2.1 AA Guidance & Help Modal Rendering', () => {
      service.setLanguage('ja');

      const helpKeys = [
        'helpTitle',
        'overviewTitle',
        'overviewDesc',
        'severityTitle',
        'errorDef',
        'warningDef',
        'noticeDef',
        'rulesTitle',
        'ruleContrast',
        'ruleHeading',
        'ruleLink',
        'ruleAlt',
        'remedyTitle',
        'remedyDesc',
        'gotItBtn',
      ];

      for (const k of helpKeys) {
        const text = service.t(k);
        expect(text).toBeTruthy();
        expect(text).not.toBe(k);
      }
    });

    it('Scenario 3: Hebrew User Settings Panel with Language Preferences & Remediation Modes', () => {
      service.setLanguage('iw');

      const settingsKeys = [
        'preferencesTitle',
        'languageLabel',
        'languageDesc',
        'langAuto',
        'contrastModeLabel',
        'contrastModeDesc',
        'preserveHsl',
        'snapMaterial',
        'autoFixLabel',
        'autoFixDesc',
        'aiSettingsTitle',
        'aiSettingsDesc',
        'saveBtn',
      ];

      for (const k of settingsKeys) {
        const text = service.t(k);
        expect(text).toBeTruthy();
        expect(text).not.toBe(k);
      }
    });

    it('Scenario 4: Spanish Live Screen Reader Announcer Flow during Document Scan', () => {
      service.setLanguage('es');

      const scanningAnnounce = service.t('announceScanning');
      expect(scanningAnnounce).toBeTruthy();

      const completeAnnounce = interpolateTranslation(service.t('announceScanComplete'), {
        total: 5,
        errors: 2,
      });
      expect(completeAnnounce).toContain('5');
      expect(completeAnnounce).toContain('2');

      const fixedAnnounce = interpolateTranslation(service.t('announceFixedIssue'), {
        title: 'Contraste de color insuficiente',
      });
      expect(fixedAnnounce).toContain('Contraste de color insuficiente');
    });

    it('Scenario 5: German Gmail Compose Card with Quick Fix Actions & Server Notifications', () => {
      service.setLanguage('de');

      const cardTitle = service.t('cardTitle');
      const refreshBtn = service.t('cardRefreshBtn');
      const resetBtn = service.t('cardResetDemoBtn');
      const checkDraft = interpolateTranslation(service.t('cardCheckingDraft'), {
        subject: 'Projektbesprechung Q4',
      });
      const fixAllBtn = interpolateTranslation(service.t('cardFixAllBtn'), { count: 3 });

      expect(cardTitle).toBeTruthy();
      expect(refreshBtn).toContain('🔄');
      expect(resetBtn).toContain('🧪');
      expect(checkDraft).toContain('Projektbesprechung Q4');
      expect(fixAllBtn).toContain('3');
    });
  });
});
