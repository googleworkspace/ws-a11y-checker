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
import { setupGasEnvironment } from './GasMocks';

describe('I18nLocaleResolution Test Suite (Opaque-Box E2E)', () => {
  let service: I18nService;

  beforeEach(() => {
    setupGasEnvironment({ userLocale: 'en' });
    service = new I18nService();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (≥10 tests covering all core resolution paths)
  // =========================================================================
  describe('Tier 1: Feature Coverage & Exact Locale Resolution', () => {
    it('T1.1: Resolves exact 2-letter ISO 639-1 primary language codes', () => {
      const standardLocales = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'hi', 'bn', 'it', 'nl', 'pl', 'ru', 'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'ro', 'el', 'uk', 'id', 'vi', 'th'];
      for (const loc of standardLocales) {
        service.setLanguage(loc);
        expect(service.getCurrentLang()).toBe(loc);
      }
    });

    it('T1.2: Resolves RTL language codes correctly (ar, iw, he, fa, ur)', () => {
      const rtlCodes = ['ar', 'iw', 'he', 'fa', 'ur'];
      for (const rtl of rtlCodes) {
        service.setLanguage(rtl);
        const current = service.getCurrentLang();
        expect(['ar', 'iw', 'he', 'fa', 'ur']).toContain(current);
      }
    });

    it('T1.3: Resolves regional language variants with hyphens (zh-CN, zh-TW, pt-BR, pt-PT)', () => {
      const regionalVariants = ['zh-CN', 'zh-TW', 'pt-BR', 'pt-PT'];
      for (const variant of regionalVariants) {
        service.setLanguage(variant);
        expect(service.getCurrentLang()).toBe(variant);
      }
    });

    it('T1.4: Resolves Filipino/Tagalog code fil', () => {
      service.setLanguage('fil');
      expect(service.getCurrentLang()).toBe('fil');
    });

    it('T1.5: Normalizes case insensitivity (uppercase, mixed case)', () => {
      const cases = [
        { input: 'EN', expected: 'en' },
        { input: 'ES', expected: 'es' },
        { input: 'jA', expected: 'ja' },
        { input: 'ZH-CN', expected: 'zh-CN' },
        { input: 'Pt-Br', expected: 'pt-BR' },
        { input: 'FR', expected: 'fr' },
        { input: 'DE', expected: 'de' },
      ];

      for (const { input, expected } of cases) {
        service.setLanguage(input);
        expect(service.getCurrentLang()).toBe(expected);
      }
    });

    it('T1.6: Normalizes underscores to hyphens (e.g. zh_CN -> zh-CN, pt_BR -> pt-BR)', () => {
      service.setLanguage('zh_CN');
      expect(service.getCurrentLang()).toBe('zh-CN');

      service.setLanguage('zh_TW');
      expect(service.getCurrentLang()).toBe('zh-TW');

      service.setLanguage('pt_BR');
      expect(service.getCurrentLang()).toBe('pt-BR');

      service.setLanguage('pt_PT');
      expect(service.getCurrentLang()).toBe('pt-PT');
    });

    it('T1.7: Resolves legacy Hebrew alias iw <-> he', () => {
      service.setLanguage('iw');
      expect(['iw', 'he']).toContain(service.getCurrentLang());

      service.setLanguage('he');
      expect(['iw', 'he']).toContain(service.getCurrentLang());

      service.setLanguage('iw-IL');
      expect(['iw', 'he']).toContain(service.getCurrentLang());

      service.setLanguage('he-IL');
      expect(['iw', 'he']).toContain(service.getCurrentLang());
    });

    it('T1.8: Resolves legacy Tagalog alias tl <-> fil', () => {
      service.setLanguage('tl');
      expect(service.getCurrentLang()).toBe('fil');

      service.setLanguage('tl-PH');
      expect(service.getCurrentLang()).toBe('fil');

      service.setLanguage('fil-PH');
      expect(service.getCurrentLang()).toBe('fil');
    });

    it('T1.9: Resolves legacy Indonesian alias in <-> id', () => {
      service.setLanguage('in');
      expect(service.getCurrentLang()).toBe('id');

      service.setLanguage('in-ID');
      expect(service.getCurrentLang()).toBe('id');

      service.setLanguage('id-ID');
      expect(service.getCurrentLang()).toBe('id');
    });

    it('T1.10: Resolves Norwegian Bokmål / Nynorsk aliases (nb, nn -> no)', () => {
      service.setLanguage('nb');
      expect(service.getCurrentLang()).toBe('no');

      service.setLanguage('nn');
      expect(service.getCurrentLang()).toBe('no');

      service.setLanguage('nb-NO');
      expect(service.getCurrentLang()).toBe('no');
    });

    it('T1.11: Resolves AUTO preference via host Workspace session locale', () => {
      service.setLanguage('AUTO', 'ja');
      expect(service.getCurrentLang()).toBe('ja');

      service.setLanguage('AUTO', 'es_ES');
      expect(service.getCurrentLang()).toBe('es');

      service.setLanguage('AUTO', 'ar-EG');
      expect(service.getCurrentLang()).toBe('ar');

      service.setLanguage('AUTO', 'pt_BR');
      expect(service.getCurrentLang()).toBe('pt-BR');
    });

    it('T1.12: Strips generic regional subtags (e.g. fr-CA -> fr, de-AT -> de, es-419 -> es)', () => {
      const subtagTests = [
        { input: 'fr-CA', expected: 'fr' },
        { input: 'fr-BE', expected: 'fr' },
        { input: 'de-AT', expected: 'de' },
        { input: 'de-CH', expected: 'de' },
        { input: 'es-419', expected: 'es' },
        { input: 'es-MX', expected: 'es' },
        { input: 'en-GB', expected: 'en' },
        { input: 'en-AU', expected: 'en' },
        { input: 'ar-SA', expected: 'ar' },
        { input: 'ru-UA', expected: 'ru' },
      ];

      for (const { input, expected } of subtagTests) {
        service.setLanguage(input);
        expect(service.getCurrentLang()).toBe(expected);
      }
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (≥8 edge cases, malformed and unknown tags)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: Gracefully falls back to en on empty string input', () => {
      service.setLanguage('');
      expect(service.getCurrentLang()).toBe('en');
    });

    it('T2.2: Gracefully falls back to en on whitespace-only input', () => {
      service.setLanguage('   ');
      expect(service.getCurrentLang()).toBe('en');
    });

    it('T2.3: Gracefully falls back to en on null or undefined input', () => {
      service.setLanguage(null as any);
      expect(service.getCurrentLang()).toBe('en');

      service.setLanguage(undefined as any);
      expect(service.getCurrentLang()).toBe('en');
    });

    it('T2.4: Falls back to en on completely unknown 2-letter codes (e.g. xx, zz)', () => {
      service.setLanguage('xx');
      expect(service.getCurrentLang()).toBe('en');

      service.setLanguage('zz');
      expect(service.getCurrentLang()).toBe('en');
    });

    it('T2.5: Falls back to en on malformed BCP 47 strings (special characters, numbers)', () => {
      service.setLanguage('12345');
      expect(service.getCurrentLang()).toBe('en');

      service.setLanguage('!@#$%');
      expect(service.getCurrentLang()).toBe('en');

      service.setLanguage('en_US_POSIX_EXTRA_LONG_INVALID_TAG');
      expect(service.getCurrentLang()).toBe('en');
    });

    it('T2.6: Handles Chinese script subtags (zh-Hans -> zh-CN, zh-Hant -> zh-TW)', () => {
      service.setLanguage('zh-Hans');
      expect(service.getCurrentLang()).toBe('zh-CN');

      service.setLanguage('zh-Hant');
      expect(service.getCurrentLang()).toBe('zh-TW');

      service.setLanguage('zh-HK');
      expect(service.getCurrentLang()).toBe('zh-TW');
    });

    it('T2.7: Handles bare Portuguese code (pt -> pt-BR as default primary)', () => {
      service.setLanguage('pt');
      expect(['pt-BR', 'pt']).toContain(service.getCurrentLang());
    });

    it('T2.8: Resolves AUTO with undefined workspaceLocale safely to en', () => {
      service.setLanguage('AUTO', undefined);
      expect(service.getCurrentLang()).toBe('en');

      service.setLanguage('AUTO', '');
      expect(service.getCurrentLang()).toBe('en');
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise interactions)
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: Explicit user preference overrides host workspace session locale', () => {
      // Host workspace is Japanese ('ja'), but user manually selected German ('de')
      service.setLanguage('de', 'ja');
      expect(service.getCurrentLang()).toBe('de');

      // Host workspace is Arabic ('ar'), but user selected Spanish ('es')
      service.setLanguage('es', 'ar');
      expect(service.getCurrentLang()).toBe('es');
    });

    it('T3.2: Rapid consecutive language switches maintain reactive state correctness', () => {
      const history: string[] = [];
      const sub = service.lang$.subscribe((l) => history.push(l));

      service.setLanguage('es');
      service.setLanguage('ja');
      service.setLanguage('ar');
      service.setLanguage('zh-CN');
      service.setLanguage('en');

      sub.unsubscribe();

      expect(service.getCurrentLang()).toBe('en');
      expect(history.length).toBeGreaterThanOrEqual(5);
    });

    it('T3.3: AUTO mode dynamically adapts when host session locale changes', () => {
      service.setLanguage('AUTO', 'fr_FR');
      expect(service.getCurrentLang()).toBe('fr');

      service.setLanguage('AUTO', 'ko_KR');
      expect(service.getCurrentLang()).toBe('ko');

      service.setLanguage('AUTO', 'iw_IL');
      expect(['iw', 'he']).toContain(service.getCurrentLang());
    });

    it('T3.4: Resolution combined with dictionary key lookup preserves correct translation', () => {
      service.setLanguage('es_MX'); // normalizes to 'es'
      expect(service.t('helpBtn')).toBe('Ayuda');

      service.setLanguage('ja_JP'); // normalizes to 'ja'
      expect(service.t('helpBtn')).toBe('ヘルプ');

      service.setLanguage('de_DE'); // normalizes to 'de'
      expect(service.t('helpBtn')).toBe('Hilfe');
    });

    it('T3.5: Unknown regional variant falls back to base language then resolves strings correctly', () => {
      service.setLanguage('fr-LU'); // Luxembourg French -> 'fr'
      expect(service.getCurrentLang()).toBe('fr');
      expect(service.t('settingsBtn')).toBe('Paramètres');
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (Enterprise user workflows)
  // =========================================================================
  describe('Tier 4: Real-World Application Scenarios', () => {
    it('Scenario 1: Israeli Enterprise User (Session: iw_IL, Manual Override: en)', () => {
      // User's Google Workspace account is set to Hebrew (iw_IL)
      service.setLanguage('AUTO', 'iw_IL');
      expect(['iw', 'he']).toContain(service.getCurrentLang());
      expect(service.t('appTitle')).not.toBe('Accessibility Checker');

      // User switches to English manually in Settings
      service.setLanguage('en', 'iw_IL');
      expect(service.getCurrentLang()).toBe('en');
      expect(service.t('appTitle')).toBe('Accessibility Checker');
    });

    it('Scenario 2: Brazilian vs European Portuguese Enterprise Deployments', () => {
      // São Paulo office user
      service.setLanguage('AUTO', 'pt_BR');
      expect(service.getCurrentLang()).toBe('pt-BR');

      // Lisbon office user
      service.setLanguage('AUTO', 'pt_PT');
      expect(service.getCurrentLang()).toBe('pt-PT');
    });

    it('Scenario 3: Swiss Multilingual User (fr_CH vs de_CH vs it_CH)', () => {
      service.setLanguage('AUTO', 'fr_CH');
      expect(service.getCurrentLang()).toBe('fr');

      service.setLanguage('AUTO', 'de_CH');
      expect(service.getCurrentLang()).toBe('de');

      service.setLanguage('AUTO', 'it_CH');
      expect(service.getCurrentLang()).toBe('it');
    });

    it('Scenario 4: Taiwanese Organization using Traditional Chinese (zh_TW)', () => {
      service.setLanguage('AUTO', 'zh_TW');
      expect(service.getCurrentLang()).toBe('zh-TW');

      service.setLanguage('AUTO', 'zh-Hant-TW');
      expect(service.getCurrentLang()).toBe('zh-TW');
    });
  });
});
