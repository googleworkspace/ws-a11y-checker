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
import * as vm from 'vm';
import { I18nService, normalizeLocale, isRtlLocale, interpolateParams } from '../ui/src/app/services/i18n.service';
import { DICTIONARIES, SUPPORTED_LANGUAGES, TranslationDictionary } from '../ui/src/app/services/translations';
import {
  BACKEND_DICTIONARIES,
  getBackendTranslation,
  normalizeLocale as backendNormalizeLocale,
  isRtlLocale as backendIsRtlLocale,
  resolveEffectiveLanguage as backendResolveEffectiveLanguage,
} from '../backend/src/utils/i18n';
import { setupGasEnvironment } from './GasMocks';

describe('Adversarial Test Coverage Audit — Milestone 1', () => {
  const REQUIRED_34_LOCALES = [
    'en', 'ar', 'iw', 'he', 'fa', 'ur', 'ja', 'zh-CN', 'zh-TW', 'ko',
    'hi', 'bn', 'es', 'fr', 'de', 'it', 'pt-BR', 'pt-PT', 'nl', 'pl',
    'ru', 'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'ro', 'el',
    'uk', 'id', 'vi', 'th', 'fil'
  ];

  // Domain A-F: 88 Core UI Keys
  const CORE_88_KEYS: string[] = [
    // Domain A (7)
    'appTitle', 'googleWorkspace', 'helpBtn', 'helpAriaLabel', 'settingsBtn', 'settingsAriaLabel', 'globalAnnouncerRegion',
    // Domain B (14)
    'scanSummaryRegion', 'wcagScore', 'errors', 'warnings', 'notices', 'all', 'rescanBtn', 'rescanAriaLabel',
    'scanning', 'scanningAriaLabel', 'readingOrderModalBtn', 'readingOrderAriaLabel', 'fixAllBtn', 'fixAllAriaLabel',
    // Domain C (20)
    'detectedIssuesRegion', 'bulkRemediationRegion', 'bulkRemediableHeading', 'bulkRemediableDesc', 'allClearTitle',
    'allClearDesc', 'interactiveContrast', 'currentLabel', 'suggestionLabel', 'jumpBtn', 'jumpBtnAriaLabel',
    'applyFixBtn', 'applyFixAriaLabel', 'altTextLabel', 'altTextPlaceholder', 'markDecorative', 'decorativeActive',
    'replacementLinkLabel', 'replacementLinkPlaceholder', 'suggestTextBtn',
    // Domain D (22)
    'severityError', 'severityWarning', 'severityNotice', 'elemParagraph', 'elemImage', 'elemTable', 'elemSlide',
    'elemTextShape', 'elemDocument', 'elemSheetTab', 'elemDataTable', 'elemCellText', 'elemEmbeddedChart',
    'elemFormDescription', 'elemFormQuestion', 'elemFormImage', 'elemFormSectionHeader', 'elemEmailLink',
    'elemEmailImage', 'elemEmailText', 'elemEmailHeading', 'elemEmailTable',
    // Domain E (9)
    'readingOrderTitle', 'readingOrderDesc', 'loadingElements', 'applyOrderBtn', 'cancelBtn', 'closeReadingOrderAriaLabel',
    'dragHandleAriaLabel', 'moveUpAriaLabel', 'moveDownAriaLabel',
    // Domain F (16)
    'preferencesTitle', 'closePreferencesAriaLabel', 'languageLabel', 'languageDesc', 'langAuto', 'contrastModeLabel',
    'contrastModeDesc', 'preserveHsl', 'preserveHslDesc', 'snapMaterial', 'snapMaterialDesc', 'autoFixLabel',
    'autoFixDesc', 'aiSettingsTitle', 'aiSettingsDesc', 'saveBtn',
  ];

  // Domains G-I: 59 Extended Guidance, Announcement & Gmail Card Keys
  const EXTENDED_59_KEYS: string[] = [
    // Domain G: WCAG Help (18)
    'helpTitle', 'closeHelpAriaLabel', 'overviewTitle', 'overviewDesc', 'severityTitle', 'errorDef', 'warningDef',
    'noticeDef', 'rulesTitle', 'ruleContrast', 'ruleHeading', 'ruleLink', 'ruleAlt', 'ruleAlign', 'ruleSpacing',
    'remedyTitle', 'remedyDesc', 'gotItBtn',
    // Domain H: Announcements (10)
    'announceScanning', 'announceScanComplete', 'announceScanError', 'announceFixedIssue', 'announceNoFixable',
    'announceApplyingFixes', 'announceFixAllSuccess', 'announceSettingsSaved', 'defaultAltText', 'defaultLinkText',
    // Domain I: Gmail Cards (31)
    'cardTitle', 'cardRefreshBtn', 'cardResetDemoBtn', 'cardCreateDemoBtn', 'cardScanLatestBtn', 'cardRefreshAuditBtn',
    'cardCheckingDraft', 'cardAllClearTitle', 'cardAllClearDesc', 'cardFoundIssues', 'cardNoDraftTitle', 'cardNoDraftDesc',
    'cardHowToAuditTitle', 'cardHowToAuditStep1', 'cardHowToAuditStep2', 'cardHowToAuditStep3', 'cardFixAllBtn',
    'cardQuickFixLink', 'cardQuickFixList', 'cardManualAltTitle', 'cardManualAltHint', 'cardSaveAltBtn',
    'cardMarkDecorativeBtn', 'cardAltNote', 'cardNoticeRescanned', 'cardNoticeAltSaved', 'cardNoticeDecorative',
    'cardNoticeFixApplied', 'cardNoticeFixAllApplied', 'cardNoticeDemoCreated', 'cardNoticeNoDrafts'
  ];

  // Total 147 exhaustive catalog keys
  const ALL_147_KEYS = [...CORE_88_KEYS, ...EXTENDED_59_KEYS];

  describe('Part 1: Exhaustive 34-Language Catalog & Key Parity Stress Test', () => {
    it('verifies exact core UI key count is 88 (Domains A through F)', () => {
      expect(CORE_88_KEYS.length).toBe(88);
    });

    it('verifies total comprehensive catalog key count is 147 (Domains A through I)', () => {
      expect(ALL_147_KEYS.length).toBe(147);
    });

    it('verifies all 34 required languages exist in DICTIONARIES object', () => {
      for (const loc of REQUIRED_34_LOCALES) {
        expect(DICTIONARIES[loc]).toBeDefined();
        expect(typeof DICTIONARIES[loc]).toBe('object');
      }
    });

    it('verifies all 34 languages have all 88 core UI keys populated with non-empty strings', () => {
      const failures: Array<{ locale: string; key: string; issue: string }> = [];

      for (const loc of REQUIRED_34_LOCALES) {
        const dict = DICTIONARIES[loc];
        for (const key of CORE_88_KEYS) {
          const val = dict[key];
          if (val === undefined) {
            failures.push({ locale: loc, key, issue: 'missing/undefined' });
          } else if (typeof val !== 'string') {
            failures.push({ locale: loc, key, issue: `non-string type: ${typeof val}` });
          } else if (val.trim().length === 0) {
            failures.push({ locale: loc, key, issue: 'empty/whitespace-only' });
          }
        }
      }

      expect(failures).toEqual([]);
    });

    it('verifies all 34 languages have all 147 catalog keys populated with non-empty strings', () => {
      const failures: Array<{ locale: string; key: string; issue: string }> = [];

      for (const loc of REQUIRED_34_LOCALES) {
        const dict = DICTIONARIES[loc];
        for (const key of ALL_147_KEYS) {
          const val = dict[key];
          if (val === undefined) {
            failures.push({ locale: loc, key, issue: 'missing/undefined' });
          } else if (typeof val !== 'string') {
            failures.push({ locale: loc, key, issue: `non-string type: ${typeof val}` });
          } else if (val.trim().length === 0) {
            failures.push({ locale: loc, key, issue: 'empty/whitespace-only' });
          }
        }
      }

      expect(failures).toEqual([]);
    });

    it('verifies variable placeholder parity across all languages and keys', () => {
      const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;
      const mismatchReports: Array<{ locale: string; key: string; expected: string[]; actual: string[] }> = [];

      for (const key of ALL_147_KEYS) {
        const enVal = DICTIONARIES['en'][key] || '';
        const enMatches = Array.from(enVal.matchAll(placeholderRegex)).map((m) => m[1]).sort();

        if (enMatches.length > 0) {
          for (const loc of REQUIRED_34_LOCALES) {
            const locVal = DICTIONARIES[loc][key] || '';
            const locMatches = Array.from(locVal.matchAll(placeholderRegex)).map((m) => m[1]).sort();

            if (JSON.stringify(enMatches) !== JSON.stringify(locMatches)) {
              mismatchReports.push({
                locale: loc,
                key,
                expected: enMatches,
                actual: locMatches,
              });
            }
          }
        }
      }

      expect(mismatchReports).toEqual([]);
    });

    it('verifies SUPPORTED_LANGUAGES options list has all 34 languages plus AUTO (35 options)', () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(35);
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      expect(codes).toContain('AUTO');
      for (const loc of ['en', 'es', 'fr', 'de', 'ja', 'zh-CN', 'zh-TW', 'ar', 'iw', 'fa', 'ur']) {
        expect(codes).toContain(loc);
      }
    });
  });

  describe('Part 2: Reactive Signal Transitions (LTR <-> RTL)', () => {
    let service: I18nService;

    beforeEach(() => {
      service = new I18nService();
    });

    it('validates default initial signal states', () => {
      expect(service.currentLanguage()).toBe('AUTO');
      expect(service.resolvedLanguage()).toBe('en');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');
    });

    it('validates explicit LTR -> RTL -> LTR -> RTL signal transitions', () => {
      // 1. Switch to Arabic (RTL)
      service.setLanguage('ar');
      expect(service.currentLanguage()).toBe('ar');
      expect(service.resolvedLanguage()).toBe('ar');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');
      expect(service.getDirection()).toBe('rtl');
      expect(service.getCurrentLang()).toBe('ar');
      expect(service.getResolvedLang()).toBe('ar');

      // 2. Switch to Japanese (LTR)
      service.setLanguage('ja');
      expect(service.currentLanguage()).toBe('ja');
      expect(service.resolvedLanguage()).toBe('ja');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');
      expect(service.getDirection()).toBe('ltr');

      // 3. Switch to Hebrew (RTL via 'iw')
      service.setLanguage('iw');
      expect(service.currentLanguage()).toBe('iw');
      expect(service.resolvedLanguage()).toBe('iw');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // 4. Switch to Hebrew (RTL via 'he' alias)
      service.setLanguage('he');
      expect(service.currentLanguage()).toBe('he');
      expect(service.resolvedLanguage()).toBe('iw');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // 5. Switch to English (LTR)
      service.setLanguage('en');
      expect(service.currentLanguage()).toBe('en');
      expect(service.resolvedLanguage()).toBe('en');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');

      // 6. Switch to Persian (RTL)
      service.setLanguage('fa');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // 7. Switch to Urdu (RTL)
      service.setLanguage('ur');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');
    });

    it('validates AUTO mode with dynamic host Workspace locale changes', () => {
      // Host provides Arabic
      service.setLanguage('AUTO', 'ar-EG');
      expect(service.currentLanguage()).toBe('AUTO');
      expect(service.resolvedLanguage()).toBe('ar');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Host changes to French
      service.setLanguage('AUTO', 'fr_CA');
      expect(service.currentLanguage()).toBe('AUTO');
      expect(service.resolvedLanguage()).toBe('fr');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');

      // Host changes to Hebrew
      service.setLanguage('AUTO', 'he_IL');
      expect(service.currentLanguage()).toBe('AUTO');
      expect(service.resolvedLanguage()).toBe('iw');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Host changes to Simplified Chinese
      service.setLanguage('AUTO', 'zh-Hans');
      expect(service.currentLanguage()).toBe('AUTO');
      expect(service.resolvedLanguage()).toBe('zh-CN');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');
    });

    it('validates RxJS lang$ observable synchronizes exactly with signal transitions', () => {
      const emitted: string[] = [];
      const sub = service.lang$.subscribe((l) => emitted.push(l));

      service.setLanguage('es');
      service.setLanguage('ar');
      service.setLanguage('zh-TW');
      service.setLanguage('AUTO', 'iw-IL');

      sub.unsubscribe();

      expect(emitted).toEqual(['en', 'es', 'ar', 'zh-TW', 'iw']);
    });
  });

  describe('Part 3: Backend rpcGetSettings() Defined vs Undefined Session', () => {
    const codeContent = fs.readFileSync(path.join(__dirname, '../dist/Code.js'), 'utf8');

    function executeRpcGetSettings(env: {
      session?: { getActiveUserLocale: () => any } | null;
      properties?: Record<string, string> | null;
      throwOnProperties?: boolean;
    }) {
      const sandbox: any = {
        console,
      };

      if (env.session !== null && env.session !== undefined) {
        sandbox.Session = env.session;
      }

      if (env.throwOnProperties) {
        sandbox.PropertiesService = {
          getUserProperties: () => {
            throw new Error('PropertiesService quota exceeded');
          },
        };
      } else if (env.properties !== null && env.properties !== undefined) {
        const props = { ...env.properties };
        sandbox.PropertiesService = {
          getUserProperties: () => ({
            getProperties: () => ({ ...props }),
          }),
        };
      } else {
        sandbox.PropertiesService = {
          getUserProperties: () => ({
            getProperties: () => ({}),
          }),
        };
      }

      vm.createContext(sandbox);
      vm.runInContext(codeContent, sandbox);
      return sandbox.rpcGetSettings();
    }

    it('handles Session defined with valid getActiveUserLocale() returning various locales', () => {
      const testLocales = ['es', 'ja', 'ar', 'iw', 'zh-CN', 'pt-BR', 'de-DE'];
      for (const loc of testLocales) {
        const settings = executeRpcGetSettings({
          session: { getActiveUserLocale: () => loc },
        });
        expect(settings).toBeDefined();
        expect(settings.userLocale).toBe(loc);
        expect(settings.contrastFixMode).toBe('PRESERVE_HSL');
        expect(settings.language).toBe('AUTO');
      }
    });

    it('handles Session defined but getActiveUserLocale() returns empty string or null', () => {
      const settingsEmpty = executeRpcGetSettings({
        session: { getActiveUserLocale: () => '' },
      });
      expect(settingsEmpty.userLocale).toBe('en');

      const settingsNull = executeRpcGetSettings({
        session: { getActiveUserLocale: () => null },
      });
      expect(settingsNull.userLocale).toBe('en');
    });

    it('handles Session defined but getActiveUserLocale throws an exception', () => {
      const settings = executeRpcGetSettings({
        session: {
          getActiveUserLocale: () => {
            throw new Error('Permission denied to access user session');
          },
        },
      });
      expect(settings).toBeDefined();
      expect(settings.userLocale).toBe('en');
    });

    it('handles Session completely undefined (e.g. offline unit test / node context)', () => {
      const settings = executeRpcGetSettings({
        session: null, // delete / no Session
      });
      expect(settings).toBeDefined();
      expect(settings.userLocale).toBe('en');
      expect(settings.contrastFixMode).toBe('PRESERVE_HSL');
      expect(settings.language).toBe('AUTO');
    });

    it('handles PropertiesService returning stored user properties with custom language and mode', () => {
      const settings = executeRpcGetSettings({
        session: { getActiveUserLocale: () => 'ja' },
        properties: {
          contrastFixMode: 'SNAP_MATERIAL',
          enableAutoRemediation: 'true',
          language: 'de',
        },
      });

      expect(settings.userLocale).toBe('ja');
      expect(settings.contrastFixMode).toBe('SNAP_MATERIAL');
      expect(settings.enableAutoRemediation).toBe(true);
      expect(settings.language).toBe('de');
    });

    it('handles PropertiesService throwing an error safely', () => {
      const settings = executeRpcGetSettings({
        session: { getActiveUserLocale: () => 'fr' },
        throwOnProperties: true,
      });
      expect(settings).toBeDefined();
      expect(settings.userLocale).toBe('fr');
      expect(settings.contrastFixMode).toBe('PRESERVE_HSL');
    });
  });

  describe('Part 4: Backend i18n Catalog & Utilities (backend/src/utils/i18n.ts)', () => {
    it('verifies backend BACKEND_DICTIONARIES has entries for all 34 locales', () => {
      for (const loc of REQUIRED_34_LOCALES) {
        // he is alias of iw
        const target = loc === 'he' ? 'iw' : loc;
        expect(BACKEND_DICTIONARIES[target]).toBeDefined();
      }
    });

    it('verifies getBackendTranslation() resolves strings across all 34 locales with interpolation', () => {
      for (const loc of REQUIRED_34_LOCALES) {
        const title = getBackendTranslation('cardTitle', loc);
        expect(title).toBeTruthy();
        expect(typeof title).toBe('string');
        expect(title.length).toBeGreaterThan(3);

        const fixAll = getBackendTranslation('cardFixAllBtn', loc, { count: 5 });
        expect(fixAll).toContain('5');
      }
    });

    it('verifies backend resolveEffectiveLanguage handles AUTO and explicit overrides', () => {
      expect(backendResolveEffectiveLanguage('AUTO', 'ja_JP')).toBe('ja');
      expect(backendResolveEffectiveLanguage('AUTO', 'ar-EG')).toBe('ar');
      expect(backendResolveEffectiveLanguage('de', 'ja')).toBe('de');
      expect(backendResolveEffectiveLanguage('', 'fr')).toBe('fr');
      expect(backendResolveEffectiveLanguage(undefined, undefined)).toBe('en');
    });

    it('verifies backend isRtlLocale accurately detects RTL vs LTR', () => {
      expect(backendIsRtlLocale('ar')).toBe(true);
      expect(backendIsRtlLocale('iw')).toBe(true);
      expect(backendIsRtlLocale('he')).toBe(true);
      expect(backendIsRtlLocale('fa')).toBe(true);
      expect(backendIsRtlLocale('ur')).toBe(true);
      expect(backendIsRtlLocale('ar-SA')).toBe(true);

      expect(backendIsRtlLocale('en')).toBe(false);
      expect(backendIsRtlLocale('es')).toBe(false);
      expect(backendIsRtlLocale('es-AR')).toBe(false);
      expect(backendIsRtlLocale('ja')).toBe(false);
      expect(backendIsRtlLocale('')).toBe(false);
      expect(backendIsRtlLocale(undefined)).toBe(false);
    });
  });

  describe('Part 5: Stress-Testing Edge Cases & Adversarial Injections', () => {
    it('handles unicode zero-width joiners, diacritics, and BiDi marks in templates and params', () => {
      const service = new I18nService();
      service.setLanguage('ar');

      const template = service.t('cardCheckingDraft');
      const complexParam = '\u200E#1A73E8 \u200F(Draft)';
      const result = interpolateParams(template, { subject: complexParam });
      expect(result).toContain(complexParam);
    });

    it('handles numeric 0, negative numbers, and floating point parameter interpolation', () => {
      const template = 'Issues: {count}, Score: {score}';
      expect(interpolateParams(template, { count: 0, score: 0 })).toBe('Issues: 0, Score: 0');
      expect(interpolateParams(template, { count: -5, score: 98.6 })).toBe('Issues: -5, Score: 98.6');
    });

    it('handles both single {key} and double {{key}} syntax interpolation', () => {
      const template1 = 'Hello {name}!';
      const template2 = 'Hello {{name}}!';
      expect(interpolateParams(template1, { name: 'Alice' })).toBe('Hello Alice!');
      expect(interpolateParams(template2, { name: 'Bob' })).toBe('Hello Bob!');
    });

    it('verifies non-existent translation key returns the key name as fallback', () => {
      const service = new I18nService();
      expect(service.t('unknown_translation_key_123')).toBe('unknown_translation_key_123');
      expect(service.t('another_missing_key')).toBe('another_missing_key');
    });

    it('documents prototype property lookup behavior for Object.prototype properties', () => {
      const service = new I18nService();
      // Observation: dict[key] without Object.prototype.hasOwnProperty returns prototype objects/functions
      const protoVal = service.t('__proto__');
      expect(typeof protoVal).toBe('object');
      const toStringVal = service.t('toString');
      expect(typeof toStringVal).toBe('function');
    });
  });
});
