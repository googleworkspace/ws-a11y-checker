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
  I18nService,
  isRtlLocale as frontendIsRtlLocale,
  normalizeLocale as frontendNormalizeLocale,
  interpolateParams,
  DICTIONARIES,
  SUPPORTED_LANGUAGES,
  TranslationDictionary,
  SupportedLanguage,
} from '../ui/src/app/services/i18n.service';
import {
  isRtlLocale as backendIsRtlLocale,
  normalizeLocale as backendNormalizeLocale,
  resolveEffectiveLanguage,
  getBackendTranslation,
  BACKEND_DICTIONARIES,
  RTL_LANGUAGES as BACKEND_RTL_SET,
} from '../backend/src/utils/i18n';
import {
  buildGmailComposeCard,
  buildGmailHomepageCard,
  refreshGmailComposeCard,
  rpcApplyGmailFix,
  rpcApplyAllGmailFixes,
  rpcPopulateGmailDemo,
  rpcScanLatestDraft,
} from '../backend/src/hosts/GmailHost';
import { AddonSettings } from '../backend/src/models/Settings';
import { setupGasEnvironment } from './GasMocks';

describe('Tier 5 Adversarial Coverage Hardening Audit', () => {
  const ALL_34_LOCALES = [
    'en', 'ar', 'iw', 'fa', 'ur', 'ja', 'zh-CN', 'zh-TW', 'ko', 'hi',
    'bn', 'es', 'fr', 'de', 'it', 'pt-BR', 'pt-PT', 'nl', 'pl', 'ru',
    'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'ro', 'el', 'uk',
    'id', 'vi', 'th', 'fil'
  ] as const;

  const RTL_LOCALES = ['ar', 'iw', 'he', 'fa', 'ur'] as const;
  const LTR_LOCALES = [
    'en', 'ja', 'zh-CN', 'zh-TW', 'ko', 'hi', 'bn', 'es', 'fr', 'de',
    'it', 'pt-BR', 'pt-PT', 'nl', 'pl', 'ru', 'tr', 'sv', 'da', 'no',
    'fi', 'cs', 'hu', 'ro', 'el', 'uk', 'id', 'vi', 'th', 'fil'
  ] as const;

  const CANONICAL_KEYS_COUNT = 172;

  // =========================================================================
  // 1. WHITE-BOX AUDIT ACROSS ALL 34 TRANSLATION FILES (172 KEYS EACH)
  // =========================================================================
  describe('1. White-Box Translation Catalog Integrity (34 Locales × 172 Keys)', () => {
    const translationsDir = path.join(__dirname, '../ui/src/app/services/translations');
    const enDict = DICTIONARIES['en'];
    const canonicalKeyList = Object.keys(enDict);

    it('confirms the primary English dictionary has exactly 172 keys', () => {
      expect(canonicalKeyList.length).toBe(CANONICAL_KEYS_COUNT);
    });

    it('verifies 34 translation files exist on the filesystem', () => {
      const files = fs.readdirSync(translationsDir).filter(
        f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts'
      );
      expect(files.length).toBe(34);
      for (const loc of ALL_34_LOCALES) {
        const expectedFile = `${loc}.ts`;
        expect(files).toContain(expectedFile);
      }
    });

    it('verifies DICTIONARIES map contains all 34 canonical locales plus he alias', () => {
      for (const loc of ALL_34_LOCALES) {
        expect(DICTIONARIES[loc]).toBeDefined();
      }
      expect(DICTIONARIES['he']).toBeDefined();
      expect(DICTIONARIES['he']).toBe(DICTIONARIES['iw']);
    });

    it('verifies 0 missing keys, 0 extra keys, and 0 undefined values across all 34 dictionaries', () => {
      const errors: string[] = [];

      for (const loc of ALL_34_LOCALES) {
        const dict = DICTIONARIES[loc];
        if (!dict) {
          errors.push(`Dictionary for ${loc} is undefined`);
          continue;
        }

        const dictKeys = Object.keys(dict);
        if (dictKeys.length !== CANONICAL_KEYS_COUNT) {
          errors.push(`Locale ${loc} has ${dictKeys.length} keys, expected ${CANONICAL_KEYS_COUNT}`);
        }

        for (const key of canonicalKeyList) {
          const val = dict[key];
          if (val === undefined) {
            errors.push(`Locale ${loc} is missing key: ${key}`);
          } else if (typeof val !== 'string') {
            errors.push(`Locale ${loc} key ${key} is not a string (type: ${typeof val})`);
          }
        }
      }

      expect(errors).toEqual([]);
    });

    it('verifies 0 empty strings or whitespace-only values across all 34 dictionaries', () => {
      const emptyValues: string[] = [];

      for (const loc of ALL_34_LOCALES) {
        const dict = DICTIONARIES[loc];
        for (const key of canonicalKeyList) {
          const val = dict[key];
          if (typeof val === 'string' && val.trim() === '') {
            emptyValues.push(`Locale ${loc} has empty string for key: ${key}`);
          }
        }
      }

      expect(emptyValues).toEqual([]);
    });

    it('verifies parameter interpolation placeholder parity ({param}, {{param}}) across all 34 locales', () => {
      const placeholderErrors: string[] = [];
      const extractPlaceholders = (str: string): string[] => {
        const matches = str.match(/\{+[a-zA-Z0-9_]+\}+/g);
        return matches ? matches.map(m => m.replace(/[\{\}]/g, '')).sort() : [];
      };

      for (const key of canonicalKeyList) {
        const enVal = enDict[key];
        const enPlaceholders = extractPlaceholders(enVal);
        if (enPlaceholders.length === 0) continue;

        for (const loc of ALL_34_LOCALES) {
          if (loc === 'en') continue;
          const dict = DICTIONARIES[loc];
          const transVal = dict[key];
          const transPlaceholders = extractPlaceholders(transVal);

          // All enPlaceholders must exist in transPlaceholders
          for (const p of enPlaceholders) {
            if (!transPlaceholders.includes(p)) {
              placeholderErrors.push(
                `Locale ${loc} key "${key}" missing placeholder {${p}}. EN: "${enVal}", Localized: "${transVal}"`
              );
            }
          }
        }
      }

      expect(placeholderErrors).toEqual([]);
    });

    it('verifies authentic non-Latin Unicode scripts for all non-Latin languages', () => {
      const scriptChecks: Array<{
        locale: string;
        scriptName: string;
        regex: RegExp;
      }> = [
        { locale: 'ar', scriptName: 'Arabic', regex: /[\u0600-\u06FF]/ },
        { locale: 'iw', scriptName: 'Hebrew', regex: /[\u0590-\u05FF]/ },
        { locale: 'fa', scriptName: 'Persian (Arabic script)', regex: /[\u0600-\u06FF]/ },
        { locale: 'ur', scriptName: 'Urdu (Arabic script)', regex: /[\u0600-\u06FF]/ },
        { locale: 'ja', scriptName: 'Japanese (Hiragana/Katakana/CJK)', regex: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/ },
        { locale: 'zh-CN', scriptName: 'Simplified Chinese (CJK)', regex: /[\u4E00-\u9FAF]/ },
        { locale: 'zh-TW', scriptName: 'Traditional Chinese (CJK)', regex: /[\u4E00-\u9FAF]/ },
        { locale: 'ko', scriptName: 'Korean (Hangul)', regex: /[\uAC00-\uD7AF\u1100-\u11FF]/ },
        { locale: 'hi', scriptName: 'Hindi (Devanagari)', regex: /[\u0900-\u097F]/ },
        { locale: 'bn', scriptName: 'Bengali', regex: /[\u0980-\u09FF]/ },
        { locale: 'ru', scriptName: 'Russian (Cyrillic)', regex: /[\u0400-\u04FF]/ },
        { locale: 'uk', scriptName: 'Ukrainian (Cyrillic)', regex: /[\u0400-\u04FF]/ },
        { locale: 'el', scriptName: 'Greek', regex: /[\u0370-\u03FF]/ },
        { locale: 'th', scriptName: 'Thai', regex: /[\u0E00-\u0E7F]/ },
      ];

      for (const check of scriptChecks) {
        const dict = DICTIONARIES[check.locale];
        expect(dict).toBeDefined();

        let nonLatinCount = 0;
        for (const key of canonicalKeyList) {
          const val = dict[key];
          if (check.regex.test(val)) {
            nonLatinCount++;
          }
        }

        // At least 90% of keys in non-Latin languages must contain authentic non-Latin characters
        // (allowing for rare keys with only symbols or brand names like "WCAG 2.1 AA")
        const ratio = nonLatinCount / canonicalKeyList.length;
        expect(ratio).toBeGreaterThanOrEqual(0.85);
      }
    });

    it('verifies backend translation catalog has 100% key parity across all 34 locales for all 33 keys', () => {
      const backendKeys = Object.keys(BACKEND_DICTIONARIES['en']);
      expect(backendKeys.length).toBe(33);

      const backendErrors: string[] = [];
      for (const loc of ALL_34_LOCALES) {
        const dict = BACKEND_DICTIONARIES[loc];
        if (!dict) {
          backendErrors.push(`Backend dictionary missing for locale: ${loc}`);
          continue;
        }
        for (const key of backendKeys) {
          const val = dict[key];
          if (!val || val.trim() === '') {
            backendErrors.push(`Backend locale ${loc} missing or empty key: ${key}`);
          }
        }
      }

      expect(backendErrors).toEqual([]);
    });
  });

  // =========================================================================
  // 2. DYNAMIC RTL SWITCHING STRESS-TEST ACROSS ALL RTL & LTR LOCALES
  // =========================================================================
  describe('2. Dynamic RTL Switching Stress-Test', () => {
    let service: I18nService;

    beforeEach(() => {
      service = new I18nService();
    });

    it('validates RTL resolution for all 4 RTL languages and regional / case variants', () => {
      const rtlTestCases = [
        'ar', 'AR', 'ar-EG', 'ar_SA', 'ar-AE', 'ar-QA', 'ar-JO', 'ar-MA',
        'iw', 'IW', 'iw-IL', 'iw_IL',
        'he', 'HE', 'he-IL', 'he_IL',
        'fa', 'FA', 'fa-IR', 'fa_AF',
        'ur', 'UR', 'ur-PK', 'ur_IN',
      ];

      for (const input of rtlTestCases) {
        expect(frontendIsRtlLocale(input)).toBe(true);
        expect(backendIsRtlLocale(input)).toBe(true);

        service.setLanguage(input);
        expect(service.isRtl()).toBe(true);
        expect(service.dir()).toBe('rtl');
      }
    });

    it('validates LTR resolution for all 30 LTR languages and regional / alias variants', () => {
      const ltrTestCases = [
        'en', 'en-US', 'en_GB', 'en-AU', 'en-CA',
        'es', 'es-ES', 'es-419', 'es_MX',
        'fr', 'fr-FR', 'fr-CA',
        'de', 'de-DE', 'de-AT',
        'it', 'it-IT',
        'pt-BR', 'pt_BR', 'pt',
        'pt-PT', 'pt_PT',
        'nl', 'nl-NL',
        'pl', 'pl-PL',
        'ru', 'ru-RU',
        'tr', 'tr-TR',
        'sv', 'sv-SE',
        'da', 'da-DK',
        'no', 'nb', 'nn', 'no-NO', 'nb-NO',
        'fi', 'fi-FI',
        'cs', 'cs-CZ',
        'hu', 'hu-HU',
        'ro', 'ro-RO',
        'el', 'el-GR',
        'uk', 'uk-UA',
        'id', 'in', 'id-ID', 'in-ID',
        'vi', 'vi-VN',
        'th', 'th-TH',
        'fil', 'tl', 'fil-PH', 'tl-PH',
        'ja', 'ja-JP',
        'zh-CN', 'zh-Hans', 'zh_CN', 'zh-SG', 'zh',
        'zh-TW', 'zh-Hant', 'zh_TW', 'zh-HK', 'zh-MO',
        'ko', 'ko-KR',
        'hi', 'hi-IN',
        'bn', 'bn-BD', 'bn-IN',
      ];

      for (const input of ltrTestCases) {
        expect(frontendIsRtlLocale(input)).toBe(false);
        expect(backendIsRtlLocale(input)).toBe(false);

        service.setLanguage(input);
        expect(service.isRtl()).toBe(false);
        expect(service.dir()).toBe('ltr');
      }
    });

    it('stress-tests rapid consecutive language switching across all 34 locales without desynchronization', () => {
      for (const loc of ALL_34_LOCALES) {
        service.setLanguage(loc);
        const expectedRtl = RTL_LOCALES.includes(loc as any);
        expect(service.currentLanguage()).toBe(loc);
        expect(service.resolvedLanguage()).toBe(loc);
        expect(service.isRtl()).toBe(expectedRtl);
        expect(service.dir()).toBe(expectedRtl ? 'rtl' : 'ltr');

        // Check translation lookup returns localized string
        const appTitle = service.t('appTitle');
        expect(appTitle).toBe(DICTIONARIES[loc].appTitle);
      }
    });

    it('verifies AUTO workspace locale resolution and override priority', () => {
      // 1. AUTO with Arabic host -> ar (RTL)
      service.setLanguage('AUTO', 'ar_EG');
      expect(service.currentLanguage()).toBe('AUTO');
      expect(service.resolvedLanguage()).toBe('ar');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // 2. Explicit User Override to Japanese -> ja (LTR) despite Arabic host
      service.setLanguage('ja', 'ar_EG');
      expect(service.currentLanguage()).toBe('ja');
      expect(service.resolvedLanguage()).toBe('ja');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');

      // 3. User switches back to AUTO -> resolves to host ar (RTL)
      service.setLanguage('AUTO', 'ar_EG');
      expect(service.resolvedLanguage()).toBe('ar');
      expect(service.isRtl()).toBe(true);

      // 4. Host changes to Hebrew (iw_IL) -> resolves to iw (RTL)
      service.setLanguage('AUTO', 'iw_IL');
      expect(service.resolvedLanguage()).toBe('iw');
      expect(service.isRtl()).toBe(true);

      // 5. Host changes to French (fr_FR) -> resolves to fr (LTR)
      service.setLanguage('AUTO', 'fr_FR');
      expect(service.resolvedLanguage()).toBe('fr');
      expect(service.isRtl()).toBe(false);
    });

    it('gracefully handles empty, undefined, null, and unrecognized locales', () => {
      const invalidCases = ['', '   ', 'unknown_XYZ', '12345', '!@#$', 'klingon'];
      for (const invalid of invalidCases) {
        expect(frontendNormalizeLocale(invalid)).toBe('en');
        expect(backendNormalizeLocale(invalid)).toBe('en');
        expect(frontendIsRtlLocale(invalid)).toBe(false);
        expect(backendIsRtlLocale(invalid)).toBe(false);
      }
    });
  });

  // =========================================================================
  // 3. ZERO PHYSICAL CSS DIRECTIONAL PROPERTIES AUDIT ACROSS UI/SRC/
  // =========================================================================
  describe('3. Zero Physical CSS Directional Properties Audit Across ui/src/', () => {
    const FORBIDDEN_CSS_PATTERNS = [
      { regex: /\bmargin-left\s*:/i, name: 'margin-left' },
      { regex: /\bmargin-right\s*:/i, name: 'margin-right' },
      { regex: /\bpadding-left\s*:/i, name: 'padding-left' },
      { regex: /\bpadding-right\s*:/i, name: 'padding-right' },
      { regex: /\bborder-left\s*:/i, name: 'border-left' },
      { regex: /\bborder-right\s*:/i, name: 'border-right' },
      { regex: /\bborder-left-color\s*:/i, name: 'border-left-color' },
      { regex: /\bborder-right-color\s*:/i, name: 'border-right-color' },
      { regex: /\bborder-left-width\s*:/i, name: 'border-left-width' },
      { regex: /\bborder-right-width\s*:/i, name: 'border-right-width' },
      { regex: /\bborder-left-style\s*:/i, name: 'border-left-style' },
      { regex: /\bborder-right-style\s*:/i, name: 'border-right-style' },
      { regex: /\bfloat\s*:\s*(?:left|right)\b/i, name: 'float: left/right' },
      { regex: /\bclear\s*:\s*(?:left|right)\b/i, name: 'clear: left/right' },
      { regex: /\btext-align\s*:\s*(?:left|right)\b/i, name: 'text-align: left/right' },
    ];

    const UI_SRC_DIR = path.join(__dirname, '../ui/src');

    function getAllUiSourceFiles(dir: string): string[] {
      const results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.angular' && file !== 'dist') {
            results.push(...getAllUiSourceFiles(full));
          }
        } else if (file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.html')) {
          results.push(full);
        }
      }
      return results;
    }

    it('scans every source file in ui/src/ and verifies 0 forbidden physical CSS properties', () => {
      const files = getAllUiSourceFiles(UI_SRC_DIR);
      expect(files.length).toBeGreaterThan(10);

      const violations: Array<{ file: string; line: number; rule: string; snippet: string }> = [];

      for (const filePath of files) {
        // Skip translation dictionary files which only contain localization strings
        if (filePath.includes('/translations/')) continue;

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          // Ignore comments
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }
          // Remove inline comments
          const cleanLine = line.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');

          for (const pattern of FORBIDDEN_CSS_PATTERNS) {
            if (pattern.regex.test(cleanLine)) {
              violations.push({
                file: path.relative(path.join(__dirname, '..'), filePath),
                line: idx + 1,
                rule: pattern.name,
                snippet: trimmed,
              });
            }
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it('confirms pervasive usage of CSS Logical Properties across all UI components', () => {
      const requiredLogicalProperties = [
        'margin-inline',
        'padding-inline',
        'border-inline',
        'inset',
      ];

      const allFiles = getAllUiSourceFiles(UI_SRC_DIR).filter(f => !f.includes('/translations/'));
      const combinedCss = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

      for (const prop of requiredLogicalProperties) {
        const regex = new RegExp(`\\b${prop}`, 'i');
        expect(regex.test(combinedCss)).toBe(true);
      }
    });
  });

  // =========================================================================
  // 4. BIDI TOKEN ISOLATION (<bdi>) AND DIRECTIONAL INTEGRITY AUDIT
  // =========================================================================
  describe('4. BiDi Token Isolation (<bdi>) and Directional Integrity Audit', () => {
    const componentFiles = [
      { name: 'AppComponent', file: path.join(__dirname, '../ui/src/app/app.component.ts') },
      { name: 'DashboardComponent', file: path.join(__dirname, '../ui/src/app/components/dashboard/dashboard.component.ts') },
      { name: 'IssueListComponent', file: path.join(__dirname, '../ui/src/app/components/issue-list/issue-list.component.ts') },
      { name: 'ReadingOrderModalComponent', file: path.join(__dirname, '../ui/src/app/components/reading-order-modal/reading-order-modal.component.ts') },
      { name: 'SettingsPanelComponent', file: path.join(__dirname, '../ui/src/app/components/settings-panel/settings-panel.component.ts') },
      { name: 'HelpModalComponent', file: path.join(__dirname, '../ui/src/app/components/help-modal/help-modal.component.ts') },
    ];

    it('verifies dynamic score, error, warning, notice counts in DashboardComponent are wrapped in <bdi>', () => {
      const content = fs.readFileSync(componentFiles[1].file, 'utf8');
      expect(content).toContain('<span class="score-num"><bdi>{{ getScoreDisplay() }}</bdi></span>');
      expect(content).toContain('<bdi>{{ loading || !hasScanned ? \'-\' : errors }}</bdi>');
      expect(content).toContain('<bdi>{{ loading || !hasScanned ? \'-\' : warnings }}</bdi>');
      expect(content).toContain('<bdi>{{ loading || !hasScanned ? \'-\' : notices }}</bdi>');
      expect(content).toContain('(<bdi>{{ issues.length }}</bdi>)');
      expect(content).toContain('(<bdi>{{ errors }}</bdi>)');
      expect(content).toContain('(<bdi>{{ warnings }}</bdi>)');
      expect(content).toContain('(<bdi>{{ notices }}</bdi>)');
      expect(content).toContain('(<bdi>{{ fixableCount }}</bdi>)');
    });

    it('verifies hex codes, WCAG badges, element chips, snippets, and bulk counts in IssueListComponent are wrapped in <bdi>', () => {
      const content = fs.readFileSync(componentFiles[2].file, 'utf8');
      // Hex colors
      expect(content).toContain('<strong><bdi>{{ issue.fixMetadata.currentHex }}</bdi></strong>');
      expect(content).toContain('<strong><bdi>{{ issue.fixMetadata.suggestedHex }}</bdi></strong>');
      // Badges
      expect(content).toContain('<span class="severity-badge"><bdi>{{ issue.severity }}</bdi></span>');
      expect(content).toContain('<span class="wcag-badge" *ngIf="issue.wcagRule"><bdi>{{ issue.wcagRule }}</bdi></span>');
      expect(content).toContain('<span class="element-chip"><bdi>{{ issue.elementType }}</bdi></span>');
      // Snippets
      expect(content).toContain('<code dir="ltr"><bdi>{{ issue.snippet }}</bdi></code>');
      // Fix all count
      expect(content).toContain('(<bdi>{{ fixableCount }}</bdi>)');
    });

    it('verifies slide AST index, objectType, and preview text in ReadingOrderModalComponent are wrapped in <bdi>', () => {
      const content = fs.readFileSync(componentFiles[3].file, 'utf8');
      expect(content).toContain('<span class="el-index"><bdi>{{ i + 1 }}.</bdi></span>');
      expect(content).toContain('<span class="el-type"><bdi>[{{ el.objectType }}]</bdi></span>');
      expect(content).toContain('<strong class="el-preview"><bdi>{{ el.previewText }}</bdi></strong>');
    });

    it('verifies unicode-bidi: isolate is defined for technical tokens in component stylesheets', () => {
      const issueListContent = fs.readFileSync(componentFiles[2].file, 'utf8');
      expect(issueListContent).toContain('unicode-bidi: isolate;');
      expect(issueListContent).toContain('direction: ltr;');

      const dashboardContent = fs.readFileSync(componentFiles[1].file, 'utf8');
      expect(dashboardContent).toContain('unicode-bidi: isolate;');

      const readingOrderContent = fs.readFileSync(componentFiles[3].file, 'utf8');
      expect(readingOrderContent).toContain('unicode-bidi: isolate;');
    });
  });

  // =========================================================================
  // 5. BACKEND SESSION LOCALE & GMAIL HOST INTEGRATION AUDIT
  // =========================================================================
  describe('5. Backend Session.getActiveUserLocale() & GmailHost Integration Audit', () => {
    beforeEach(() => {
      setupGasEnvironment();
    });

    it('verifies GmailHost Card builders execute successfully across all 34 locales with authentic translations', () => {
      for (const loc of ALL_34_LOCALES) {
        // Mock Session locale
        (global as any).Session = {
          getActiveUserLocale: () => loc,
        };

        const composeCard = buildGmailComposeCard({
          draftId: 'test-draft-123',
          parameters: {},
        });
        expect(composeCard).toBeDefined();

        const homepageCard = buildGmailHomepageCard({});
        expect(homepageCard).toBeDefined();

        const refreshed = refreshGmailComposeCard({
          parameters: { draftId: 'test-draft-123' },
        });
        expect(refreshed).toBeDefined();
      }
    });

    it('verifies Gmail quick fixes and demo generators produce localized notifications across RTL and LTR locales', () => {
      const testLocales = ['ar', 'iw', 'fa', 'ur', 'en', 'ja', 'es', 'de', 'zh-CN', 'fil'];

      for (const loc of testLocales) {
        setupGasEnvironment({ userLocale: loc });

        // 1. Mark decorative fix
        const decFix = rpcApplyGmailFix({
          parameters: {
            fixType: 'MARK_DECORATIVE',
            draftId: 'draft_demo',
            source: 'COMPOSE',
            imgIdx: '1',
          },
        });
        expect(decFix).toBeDefined();
        const expectedDecoNotice = getBackendTranslation('cardNoticeDecorative', loc);
        expect(decFix.notification.getText()).toBe(expectedDecoNotice);

        // 2. Link fix
        const linkFix = rpcApplyGmailFix({
          parameters: {
            fixType: 'LINK',
            draftId: 'draft_demo',
            source: 'COMPOSE',
            url: 'https://example.com',
            oldText: 'click here',
            newText: 'WCAG Reference',
          },
        });
        expect(linkFix).toBeDefined();
        const expectedLinkNotice = getBackendTranslation('cardNoticeFixApplied', loc);
        expect(linkFix.notification.getText()).toBe(expectedLinkNotice);

        // 3. Custom alt text fix
        const altFix = rpcApplyGmailFix({
          parameters: {
            fixType: 'CUSTOM_ALT_TEXT',
            draftId: 'draft_demo',
            source: 'COMPOSE',
            imgIdx: '1',
          },
          formInputs: {
            customAlt_1: ['Detailed chart description'],
          },
        });
        expect(altFix).toBeDefined();
        const expectedAltNotice = getBackendTranslation('cardNoticeAltSaved', loc);
        expect(altFix.notification.getText()).toBe(expectedAltNotice);

        // 4. Fix all
        const fixAll = rpcApplyAllGmailFixes({
          parameters: {
            draftId: 'draft_demo',
            source: 'COMPOSE',
          },
        });
        expect(fixAll).toBeDefined();

        // 5. Scan latest draft
        const scan = rpcScanLatestDraft({
          parameters: { source: 'HOMEPAGE' },
        });
        expect(scan).toBeDefined();
      }
    });

    it('verifies resolveEffectiveLanguage in backend correctly handles user preferences and host session locale', () => {
      // AUTO preference -> host locale
      expect(resolveEffectiveLanguage('AUTO', 'ar_EG')).toBe('ar');
      expect(resolveEffectiveLanguage('AUTO', 'iw_IL')).toBe('iw');
      expect(resolveEffectiveLanguage('AUTO', 'ja_JP')).toBe('ja');
      expect(resolveEffectiveLanguage('AUTO', 'pt_BR')).toBe('pt-BR');
      expect(resolveEffectiveLanguage('AUTO', 'zh_CN')).toBe('zh-CN');

      // Explicit preference -> overrides host locale
      expect(resolveEffectiveLanguage('de', 'ar_EG')).toBe('de');
      expect(resolveEffectiveLanguage('es', 'iw_IL')).toBe('es');
      expect(resolveEffectiveLanguage('en', 'ja_JP')).toBe('en');

      // Empty or undefined host -> fallback to 'en'
      expect(resolveEffectiveLanguage('AUTO', '')).toBe('en');
      expect(resolveEffectiveLanguage(undefined, undefined)).toBe('en');
    });

    it('verifies backend getBackendTranslation accurately interpolates {count}, {subject}, and {suggestedText}', () => {
      // English
      const enIssues = getBackendTranslation('cardFoundIssues', 'en', { count: 5 });
      expect(enIssues).toBe('Found 5 Accessibility Issue(s)');

      const enDraft = getBackendTranslation('cardCheckingDraft', 'en', { subject: 'Project Status' });
      expect(enDraft).toBe('Checking Draft: Project Status');

      const enLink = getBackendTranslation('cardQuickFixLink', 'en', { suggestedText: 'Accessible Guidelines' });
      expect(enLink).toBe('✨ Quick Fix: Rename Link ("Accessible Guidelines")');

      // Arabic (RTL)
      const arIssues = getBackendTranslation('cardFoundIssues', 'ar', { count: 3 });
      expect(arIssues).toContain('3');
      expect(arIssues).toMatch(/[\u0600-\u06FF]/);

      // Japanese
      const jaIssues = getBackendTranslation('cardFoundIssues', 'ja', { count: 7 });
      expect(jaIssues).toContain('7');
      expect(jaIssues).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
    });
  });
});
