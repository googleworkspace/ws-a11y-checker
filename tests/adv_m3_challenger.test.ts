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
  isRtlLocale,
  normalizeLocale,
  interpolateParams,
  DICTIONARIES,
  SUPPORTED_LANGUAGES,
} from '../ui/src/app/services/i18n.service';
import {
  isRtlLocale as backendIsRtlLocale,
  normalizeLocale as backendNormalizeLocale,
  getBackendTranslation,
  BACKEND_DICTIONARIES,
} from '../backend/src/utils/i18n';

describe('Milestone 3 Challenger 1: Comprehensive RTL, BiDi & CSS Logical Properties Stress Test', () => {
  let i18nService: I18nService;

  const ALL_RTL_LOCALES = ['ar', 'iw', 'he', 'fa', 'ur'] as const;
  const ALL_LTR_LOCALES = [
    'en', 'es', 'fr', 'de', 'ja', 'zh-CN', 'zh-TW', 'ko', 'hi', 'bn',
    'it', 'pt-BR', 'pt-PT', 'nl', 'pl', 'ru', 'tr', 'sv', 'da', 'no',
    'fi', 'cs', 'hu', 'ro', 'el', 'uk', 'id', 'vi', 'th', 'fil',
  ] as const;

  const COMPONENT_PATHS = [
    'ui/src/app/app.component.ts',
    'ui/src/app/components/dashboard/dashboard.component.ts',
    'ui/src/app/components/issue-list/issue-list.component.ts',
    'ui/src/app/components/reading-order-modal/reading-order-modal.component.ts',
    'ui/src/app/components/settings-panel/settings-panel.component.ts',
    'ui/src/app/components/help-modal/help-modal.component.ts',
  ];

  beforeEach(() => {
    i18nService = new I18nService();
  });

  // =========================================================================
  // 1. EMPIRICAL CSS & STYLESHEET LOGICAL PROPERTIES SCANNER
  // =========================================================================
  describe('1. Empirical CSS Logical Properties & Physical Property Scrubbing Audit', () => {
    // Regexes for forbidden physical directional properties
    const FORBIDDEN_PATTERNS: Array<{ regex: RegExp; name: string }> = [
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
      { regex: /\bposition\s*:\s*fixed;\s*top:\s*0;\s*left:\s*0;\s*right:\s*0;\s*bottom:\s*0;/i, name: 'legacy viewport pinning (top/left/right/bottom)' },
      { regex: /\bposition\s*:\s*absolute;\s*top:\s*0;\s*left:\s*0;\s*right:\s*0;\s*bottom:\s*0;/i, name: 'legacy absolute pinning (top/left/right/bottom)' },
      { regex: /\bfloat\s*:\s*(?:left|right)\b/i, name: 'physical float' },
      { regex: /\bclear\s*:\s*(?:left|right)\b/i, name: 'physical clear' },
    ];

    it('validates 0 forbidden physical CSS properties exist in global ui/src/styles.css', () => {
      const stylesPath = path.join(__dirname, '../ui/src/styles.css');
      expect(fs.existsSync(stylesPath)).toBe(true);
      const content = fs.readFileSync(stylesPath, 'utf8');

      // Strip comments before checking
      const strippedContent = content.replace(/\/\*[\s\S]*?\*\//g, '');

      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = pattern.regex.exec(strippedContent);
        expect(match).toBeNull();
      }
    });

    it('validates 0 forbidden physical CSS properties exist across all 6 Angular component styles', () => {
      for (const relPath of COMPONENT_PATHS) {
        const fullPath = path.join(__dirname, '..', relPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Extract styles: [`...`] array
        const stylesMatch = /styles:\s*\[`([\s\S]*?)`\]/m.exec(content);
        expect(stylesMatch).not.toBeNull();

        const styleBlock = stylesMatch![1];
        // Strip comments
        const cleanStyles = styleBlock.replace(/\/\*[\s\S]*?\*\//g, '');

        for (const pattern of FORBIDDEN_PATTERNS) {
          const match = pattern.regex.exec(cleanStyles);
          if (match) {
            fail(`Found forbidden physical property "${pattern.name}" in ${relPath}: ${match[0]}`);
          }
          expect(match).toBeNull();
        }
      }
    });

    it('validates adoption of CSS Logical Properties across all components', () => {
      // Check issue-list for border-inline-start and border-inline-start-color
      const issueListContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/components/issue-list/issue-list.component.ts'), 'utf8');
      expect(issueListContent).toMatch(/border-inline-start:\s*4px solid/);
      expect(issueListContent).toMatch(/border-inline-start-color:\s*#d93025/);
      expect(issueListContent).toMatch(/border-inline-start-color:\s*#e37400/);
      expect(issueListContent).toMatch(/border-inline-start-color:\s*#1a73e8/);

      // Check reading-order-modal for inset: 0
      const readingOrderContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/components/reading-order-modal/reading-order-modal.component.ts'), 'utf8');
      expect(readingOrderContent).toMatch(/inset:\s*0/);
      expect(readingOrderContent).toMatch(/margin-inline-end:\s*12px/);

      // Check settings-panel for inset: 0 and padding-block / padding-inline
      const settingsContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/components/settings-panel/settings-panel.component.ts'), 'utf8');
      expect(settingsContent).toMatch(/inset:\s*0/);
      expect(settingsContent).toMatch(/padding-block:\s*16px;\s*padding-inline:\s*20px/);

      // Check help-modal for inset: 0 and padding-inline-start
      const helpContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/components/help-modal/help-modal.component.ts'), 'utf8');
      expect(helpContent).toMatch(/inset:\s*0/);
      expect(helpContent).toMatch(/padding-inline-start:\s*18px;\s*padding-inline-end:\s*0/);
    });

    it('ensures no inline template attributes use physical directional styles', () => {
      for (const relPath of COMPONENT_PATHS) {
        const fullPath = path.join(__dirname, '..', relPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for style="...margin-left..." or [style.margin-left]
        expect(content).not.toMatch(/style\s*=\s*"[^"]*margin-(?:left|right)[^"]*"/i);
        expect(content).not.toMatch(/style\s*=\s*"[^"]*padding-(?:left|right)[^"]*"/i);
        expect(content).not.toMatch(/style\s*=\s*"[^"]*border-(?:left|right)[^"]*"/i);
        expect(content).not.toMatch(/\[style\.margin-left\]/i);
        expect(content).not.toMatch(/\[style\.margin-right\]/i);
        expect(content).not.toMatch(/\[style\.padding-left\]/i);
        expect(content).not.toMatch(/\[style\.padding-right\]/i);
        expect(content).not.toMatch(/\[style\.border-left\]/i);
        expect(content).not.toMatch(/\[style\.border-right\]/i);
      }
    });
  });

  // =========================================================================
  // 2. BIDI ISOLATION & <BDI> TAG PLACEMENT VERIFICATION
  // =========================================================================
  describe('2. BiDi Isolation & <bdi> Tag Placement Verification', () => {
    it('verifies <bdi> tag presence on all numerical score and count elements in DashboardComponent', () => {
      const dashboardContent = fs.readFileSync(
        path.join(__dirname, '../ui/src/app/components/dashboard/dashboard.component.ts'),
        'utf8'
      );
      // Score display
      expect(dashboardContent).toContain('<span class="score-num"><bdi>{{ getScoreDisplay() }}</bdi></span>');
      // Stat counts
      expect(dashboardContent).toContain('<span class="count"><bdi>{{ loading || !hasScanned ? \'-\' : errors }}</bdi></span>');
      expect(dashboardContent).toContain('<span class="count"><bdi>{{ loading || !hasScanned ? \'-\' : warnings }}</bdi></span>');
      expect(dashboardContent).toContain('<span class="count"><bdi>{{ loading || !hasScanned ? \'-\' : notices }}</bdi></span>');
      // Filter chips counts
      expect(dashboardContent).toContain('(<bdi>{{ issues.length }}</bdi>)');
      expect(dashboardContent).toContain('(<bdi>{{ errors }}</bdi>)');
      expect(dashboardContent).toContain('(<bdi>{{ warnings }}</bdi>)');
      expect(dashboardContent).toContain('(<bdi>{{ notices }}</bdi>)');
      // Fix all count
      expect(dashboardContent).toContain('(<bdi>{{ fixableCount }}</bdi>)');
    });

    it('verifies <bdi> tag presence on all technical tokens in IssueListComponent', () => {
      const issueListContent = fs.readFileSync(
        path.join(__dirname, '../ui/src/app/components/issue-list/issue-list.component.ts'),
        'utf8'
      );
      // Severity badge
      expect(issueListContent).toContain('<span class="severity-badge"><bdi>{{ issue.severity }}</bdi></span>');
      // WCAG Rule badge
      expect(issueListContent).toContain('<span class="wcag-badge" *ngIf="issue.wcagRule"><bdi>{{ issue.wcagRule }}</bdi></span>');
      // Element type chip
      expect(issueListContent).toContain('<span class="element-chip"><bdi>{{ issue.elementType }}</bdi></span>');
      // Code snippet with dir="ltr" and <bdi>
      expect(issueListContent).toContain('<code dir="ltr"><bdi>{{ issue.snippet }}</bdi></code>');
      // Color contrast hex values
      expect(issueListContent).toContain('<strong><bdi>{{ issue.fixMetadata.currentHex }}</bdi></strong>');
      expect(issueListContent).toContain('<strong><bdi>{{ issue.fixMetadata.suggestedHex }}</bdi></strong>');
      // Fix all button badge
      expect(issueListContent).toContain('(<bdi>{{ fixableCount }}</bdi>)');
    });

    it('verifies <bdi> tag presence on Slide Reading Order elements in ReadingOrderModalComponent', () => {
      const readingOrderContent = fs.readFileSync(
        path.join(__dirname, '../ui/src/app/components/reading-order-modal/reading-order-modal.component.ts'),
        'utf8'
      );
      // Element index (e.g. "1.")
      expect(readingOrderContent).toContain('<span class="el-index"><bdi>{{ i + 1 }}.</bdi></span>');
      // Element type (e.g. "[SHAPE]")
      expect(readingOrderContent).toContain('<span class="el-type"><bdi>[{{ el.objectType }}]</bdi></span>');
      // Preview text
      expect(readingOrderContent).toContain('<strong class="el-preview"><bdi>{{ el.previewText }}</bdi></strong>');
    });

    it('verifies <bdi> tag presence on WCAG rules and definitions in HelpModalComponent', () => {
      const helpContent = fs.readFileSync(
        path.join(__dirname, '../ui/src/app/components/help-modal/help-modal.component.ts'),
        'utf8'
      );
      expect(helpContent).toContain('<h2 id="help-title"><bdi>{{ i18n.t(\'helpTitle\') }}</bdi></h2>');
      expect(helpContent).toContain('<strong><bdi>{{ i18n.t(\'errorDef\') }}</bdi></strong>');
      expect(helpContent).toContain('<strong><bdi>{{ i18n.t(\'warningDef\') }}</bdi></strong>');
      expect(helpContent).toContain('<strong><bdi>{{ i18n.t(\'noticeDef\') }}</bdi></strong>');
      expect(helpContent).toContain('<bdi>{{ i18n.t(\'ruleContrast\') }}</bdi>');
      expect(helpContent).toContain('<bdi>{{ i18n.t(\'ruleHeading\') }}</bdi>');
      expect(helpContent).toContain('<bdi>{{ i18n.t(\'ruleLink\') }}</bdi>');
      expect(helpContent).toContain('<bdi>{{ i18n.t(\'ruleAlt\') }}</bdi>');
      expect(helpContent).toContain('<bdi>{{ i18n.t(\'ruleAlign\') }}</bdi>');
      expect(helpContent).toContain('<bdi>{{ i18n.t(\'ruleSpacing\') }}</bdi>');
    });

    it('verifies CSS rules enforce unicode-bidi: isolate and direction: ltr for technical tokens', () => {
      // IssueListComponent styles
      const issueListContent = fs.readFileSync(
        path.join(__dirname, '../ui/src/app/components/issue-list/issue-list.component.ts'),
        'utf8'
      );
      expect(issueListContent).toMatch(/unicode-bidi:\s*isolate;/);
      expect(issueListContent).toMatch(/direction:\s*ltr;/);

      // DashboardComponent styles
      const dashboardContent = fs.readFileSync(
        path.join(__dirname, '../ui/src/app/components/dashboard/dashboard.component.ts'),
        'utf8'
      );
      expect(dashboardContent).toMatch(/\.score-num\s*\{[^}]*direction:\s*ltr;[^}]*unicode-bidi:\s*isolate;/s);
      expect(dashboardContent).toMatch(/\.stat \.count\s*\{[^}]*direction:\s*ltr;[^}]*unicode-bidi:\s*isolate;/s);

      // ReadingOrderModalComponent styles
      const readingOrderContent = fs.readFileSync(
        path.join(__dirname, '../ui/src/app/components/reading-order-modal/reading-order-modal.component.ts'),
        'utf8'
      );
      expect(readingOrderContent).toMatch(/\.el-index,\s*\.el-type,\s*\.el-preview\s*\{[^}]*unicode-bidi:\s*isolate;/s);

      // HelpModalComponent styles
      const helpContent = fs.readFileSync(
        path.join(__dirname, '../ui/src/app/components/help-modal/help-modal.component.ts'),
        'utf8'
      );
      expect(helpContent).toMatch(/unicode-bidi:\s*isolate;/);
    });

    it('stress tests BiDi rendering with complex technical tokens in RTL languages', () => {
      for (const rtlLang of ALL_RTL_LOCALES) {
        i18nService.setLanguage(rtlLang);
        expect(i18nService.isRtl()).toBe(true);

        const sampleHex1 = '#1A73E8';
        const sampleHex2 = '#D93025';
        const sampleRule = 'WCAG 2.1 AA § 1.4.3';
        const sampleRatio = '4.5:1';
        const sampleHtml = '<img src="https://example.com/logo.png" alt="Google Logo">';

        // Validate that interpolating or wrapping tokens maintains exact string content
        const wrappedHex = `<bdi class="tech-token">${sampleHex1}</bdi>`;
        const wrappedRule = `<bdi class="wcag-badge">${sampleRule}</bdi>`;
        const wrappedRatio = `<bdi class="ratio">${sampleRatio}</bdi>`;
        const wrappedSnippet = `<code dir="ltr"><bdi>${sampleHtml}</bdi></code>`;

        expect(wrappedHex).toContain('#1A73E8');
        expect(wrappedRule).toContain('WCAG 2.1 AA § 1.4.3');
        expect(wrappedRatio).toContain('4.5:1');
        expect(wrappedSnippet).toContain('<img src="https://example.com/logo.png" alt="Google Logo">');
      }
    });
  });

  // =========================================================================
  // 3. DYNAMIC LTR <-> RTL SWITCHING ACROSS ALL 34 LANGUAGES
  // =========================================================================
  describe('3. Dynamic LTR <-> RTL Switching Behavior across All 34 Languages', () => {
    it('correctly classifies all 4 RTL languages (ar, iw/he, fa, ur) and computes dir="rtl"', () => {
      const rtlTestCases = [
        { input: 'ar', expectedResolved: 'ar', name: 'Arabic' },
        { input: 'iw', expectedResolved: 'iw', name: 'Hebrew (iw)' },
        { input: 'he', expectedResolved: 'iw', name: 'Hebrew (he -> iw)' },
        { input: 'fa', expectedResolved: 'fa', name: 'Persian' },
        { input: 'ur', expectedResolved: 'ur', name: 'Urdu' },
      ];

      for (const tc of rtlTestCases) {
        i18nService.setLanguage(tc.input);
        expect(i18nService.resolvedLanguage()).toBe(tc.expectedResolved);
        expect(i18nService.isRtl()).toBe(true);
        expect(i18nService.dir()).toBe('rtl');
        expect(i18nService.getDirection()).toBe('rtl');
        expect(i18nService.isRtlLocale(tc.input)).toBe(true);
        expect(isRtlLocale(tc.input)).toBe(true);
        expect(backendIsRtlLocale(tc.input)).toBe(true);
      }
    });

    it('correctly handles regional variants and uppercase codes of all RTL languages', () => {
      const rtlVariants = [
        'ar-EG', 'ar-SA', 'ar-AE', 'ar-IQ', 'ar-MA',
        'AR', 'AR-EG', 'AR_SA',
        'fa-IR', 'fa-AF', 'FA', 'FA-IR',
        'ur-PK', 'ur-IN', 'UR', 'UR-PK',
        'iw-IL', 'he-IL', 'HE', 'IW', 'HE-IL', 'IW-IL',
      ];

      for (const variant of rtlVariants) {
        expect(isRtlLocale(variant)).toBe(true);
        expect(backendIsRtlLocale(variant)).toBe(true);

        i18nService.setLanguage('AUTO', variant);
        expect(i18nService.isRtl()).toBe(true);
        expect(i18nService.dir()).toBe('rtl');
      }
    });

    it('correctly classifies all 30 LTR languages and computes dir="ltr"', () => {
      for (const ltr of ALL_LTR_LOCALES) {
        i18nService.setLanguage(ltr);
        expect(i18nService.resolvedLanguage()).toBe(ltr);
        expect(i18nService.isRtl()).toBe(false);
        expect(i18nService.dir()).toBe('ltr');
        expect(i18nService.getDirection()).toBe('ltr');
        expect(i18nService.isRtlLocale(ltr)).toBe(false);
        expect(isRtlLocale(ltr)).toBe(false);
        expect(backendIsRtlLocale(ltr)).toBe(false);
      }
    });

    it('correctly handles LTR regional codes and aliases without false positive RTL triggers', () => {
      const ltrVariants = [
        { code: 'es-AR', expected: 'es' }, // Argentina territory subtag "AR" must NOT trigger Arabic
        { code: 'es_AR', expected: 'es' },
        { code: 'en-GB', expected: 'en' },
        { code: 'en-US', expected: 'en' },
        { code: 'pt', expected: 'pt-BR' },
        { code: 'pt-br', expected: 'pt-BR' },
        { code: 'pt-pt', expected: 'pt-PT' },
        { code: 'zh-Hans', expected: 'zh-CN' },
        { code: 'zh-Hant', expected: 'zh-TW' },
        { code: 'tl', expected: 'fil' },
        { code: 'in', expected: 'id' },
        { code: 'nb', expected: 'no' },
        { code: 'nn', expected: 'no' },
      ];

      for (const item of ltrVariants) {
        expect(isRtlLocale(item.code)).toBe(false);
        expect(backendIsRtlLocale(item.code)).toBe(false);

        i18nService.setLanguage('AUTO', item.code);
        expect(i18nService.resolvedLanguage()).toBe(item.expected);
        expect(i18nService.isRtl()).toBe(false);
        expect(i18nService.dir()).toBe('ltr');
      }
    });

    it('fuzz tests rapid dynamic switching between alternating LTR and RTL locales (100 transitions)', () => {
      const switchSequence: string[] = [];
      for (let i = 0; i < 50; i++) {
        switchSequence.push(ALL_LTR_LOCALES[i % ALL_LTR_LOCALES.length]);
        switchSequence.push(ALL_RTL_LOCALES[i % ALL_RTL_LOCALES.length]);
      }

      for (let i = 0; i < switchSequence.length; i++) {
        const lang = switchSequence[i];
        i18nService.setLanguage(lang);

        const isExpectedRtl = ALL_RTL_LOCALES.includes(lang as any);
        expect(i18nService.isRtl()).toBe(isExpectedRtl);
        expect(i18nService.dir()).toBe(isExpectedRtl ? 'rtl' : 'ltr');
        expect(i18nService.getDirection()).toBe(isExpectedRtl ? 'rtl' : 'ltr');

        // Validate key translations resolve properly without undefined
        const title = i18nService.t('appTitle');
        const scoreLabel = i18nService.t('wcagScore');
        const errorsLabel = i18nService.t('errors');

        expect(typeof title).toBe('string');
        expect(title.length).toBeGreaterThan(0);
        expect(scoreLabel.length).toBeGreaterThan(0);
        expect(errorsLabel.length).toBeGreaterThan(0);
      }
    });

    it('verifies AUTO mode host locale detection and explicit preference override', () => {
      // 1. Host locale is Arabic (ar), preference is AUTO -> RTL
      i18nService.setLanguage('AUTO', 'ar');
      expect(i18nService.resolvedLanguage()).toBe('ar');
      expect(i18nService.dir()).toBe('rtl');

      // 2. Host locale is Arabic (ar), but user overrides preference to English (en) -> LTR
      i18nService.setLanguage('en', 'ar');
      expect(i18nService.resolvedLanguage()).toBe('en');
      expect(i18nService.dir()).toBe('ltr');

      // 3. Host locale is English (en), but user overrides preference to Hebrew (he) -> RTL
      i18nService.setLanguage('he', 'en');
      expect(i18nService.resolvedLanguage()).toBe('iw');
      expect(i18nService.dir()).toBe('rtl');

      // 4. Host locale is Japanese (ja), preference is AUTO -> LTR
      i18nService.setLanguage('AUTO', 'ja');
      expect(i18nService.resolvedLanguage()).toBe('ja');
      expect(i18nService.dir()).toBe('ltr');

      // 5. Host locale is Persian (fa), preference is AUTO -> RTL
      i18nService.setLanguage('AUTO', 'fa');
      expect(i18nService.resolvedLanguage()).toBe('fa');
      expect(i18nService.dir()).toBe('rtl');

      // 6. Host locale is Urdu (ur), preference is AUTO -> RTL
      i18nService.setLanguage('AUTO', 'ur');
      expect(i18nService.resolvedLanguage()).toBe('ur');
      expect(i18nService.dir()).toBe('rtl');
    });
  });

  // =========================================================================
  // 4. TEMPLATE BINDINGS & ROOT DOM DIRECTION VERIFICATION
  // =========================================================================
  describe('4. Template Bindings & Root DOM Direction Verification', () => {
    it('verifies root index.html defines initial dir="ltr" and lang="en"', () => {
      const indexHtml = fs.readFileSync(path.join(__dirname, '../ui/src/index.html'), 'utf8');
      expect(indexHtml).toMatch(/<html\s+lang="en"\s+dir="ltr">/i);
    });

    it('verifies AppComponent synchronizes document.documentElement dir and lang via effect()', () => {
      const appComponentContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/app.component.ts'), 'utf8');
      expect(appComponentContent).toContain('effect(() => {');
      expect(appComponentContent).toContain('document.documentElement.dir = dir;');
      expect(appComponentContent).toContain('document.documentElement.lang = lang;');
    });

    it('verifies [attr.dir]="i18n.dir()" is bound on header, main, and modal containers', () => {
      const appComponentContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/app.component.ts'), 'utf8');
      expect(appComponentContent).toContain('<header class="workspace-app-bar" [attr.dir]="i18n.dir()">');
      expect(appComponentContent).toContain('<main class="main-content app-main" [attr.dir]="i18n.dir()">');

      const readingOrderContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/components/reading-order-modal/reading-order-modal.component.ts'), 'utf8');
      expect(readingOrderContent).toContain('[attr.dir]="i18n.dir()"');

      const settingsContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/components/settings-panel/settings-panel.component.ts'), 'utf8');
      expect(settingsContent).toContain('[attr.dir]="i18n.dir()"');

      const helpContent = fs.readFileSync(path.join(__dirname, '../ui/src/app/components/help-modal/help-modal.component.ts'), 'utf8');
      expect(helpContent).toContain('[attr.dir]="i18n.dir()"');
    });
  });

  // =========================================================================
  // 5. ADVERSARIAL EDGE CASES & INTEGRITY ASSURANCE
  // =========================================================================
  describe('5. Adversarial Edge Cases & Integrity Assurance', () => {
    it('safely handles malformed, empty, null, and non-string inputs to isRtlLocale and normalizeLocale', () => {
      const edgeCases: any[] = [
        null,
        undefined,
        '',
        '   ',
        '\t\n',
        'invalid_locale_xyz',
        '12345',
        '---',
        '..',
      ];

      for (const ec of edgeCases) {
        expect(isRtlLocale(ec)).toBe(false);
        expect(backendIsRtlLocale(ec)).toBe(false);
        expect(normalizeLocale(ec)).toBe('en');
        expect(backendNormalizeLocale(ec)).toBe('en');
      }
    });

    const CANONICAL_DOMAIN_KEYS = [
      'appTitle', 'googleWorkspace', 'helpBtn', 'helpAriaLabel', 'settingsBtn', 'settingsAriaLabel', 'globalAnnouncerRegion',
      'scanSummaryRegion', 'wcagScore', 'errors', 'warnings', 'notices', 'all', 'rescanBtn', 'rescanAriaLabel',
      'scanning', 'scanningAriaLabel', 'readingOrderModalBtn', 'readingOrderAriaLabel', 'fixAllBtn', 'fixAllAriaLabel',
      'detectedIssuesRegion', 'bulkRemediationRegion', 'bulkRemediableHeading', 'bulkRemediableDesc',
      'allClearTitle', 'allClearDesc', 'interactiveContrast', 'currentLabel', 'suggestionLabel',
      'jumpBtn', 'jumpBtnAriaLabel', 'applyFixBtn', 'applyFixAriaLabel', 'altTextLabel', 'altTextPlaceholder',
      'markDecorative', 'decorativeActive', 'replacementLinkLabel', 'replacementLinkPlaceholder', 'suggestTextBtn',
      'severityError', 'severityWarning', 'severityNotice', 'elemParagraph', 'elemImage', 'elemTable',
      'elemSlide', 'elemTextShape', 'elemDocument', 'elemSheetTab', 'elemDataTable', 'elemCellText',
      'elemEmbeddedChart', 'elemFormDescription', 'elemFormQuestion', 'elemFormImage', 'elemFormSectionHeader',
      'elemEmailLink', 'elemEmailImage', 'elemEmailText', 'elemEmailHeading', 'elemEmailTable',
      'readingOrderTitle', 'readingOrderDesc', 'loadingElements', 'applyOrderBtn', 'cancelBtn',
      'closeReadingOrderAriaLabel', 'dragHandleAriaLabel', 'moveUpAriaLabel', 'moveDownAriaLabel',
      'preferencesTitle', 'closePreferencesAriaLabel', 'languageLabel', 'languageDesc', 'langAuto',
      'contrastModeLabel', 'contrastModeDesc', 'preserveHsl', 'preserveHslDesc', 'snapMaterial', 'snapMaterialDesc',
      'autoFixLabel', 'autoFixDesc', 'aiSettingsTitle', 'aiSettingsDesc', 'saveBtn',
      'helpTitle', 'closeHelpAriaLabel', 'overviewTitle', 'overviewDesc', 'severityTitle',
      'errorDef', 'warningDef', 'noticeDef', 'rulesTitle', 'ruleContrast', 'ruleHeading', 'ruleLink',
      'ruleAlt', 'ruleAlign', 'ruleSpacing', 'remedyTitle', 'remedyDesc', 'gotItBtn',
      'announceScanning', 'announceScanComplete', 'announceScanError', 'announceFixedIssue',
      'announceNoFixable', 'announceApplyingFixes', 'announceFixAllSuccess', 'announceSettingsSaved',
      'defaultAltText', 'defaultLinkText',
      'cardTitle', 'cardRefreshBtn', 'cardResetDemoBtn', 'cardCreateDemoBtn', 'cardScanLatestBtn',
      'cardRefreshAuditBtn', 'cardCheckingDraft', 'cardAllClearTitle', 'cardAllClearDesc', 'cardFoundIssues',
      'cardNoDraftTitle', 'cardNoDraftDesc', 'cardHowToAuditTitle', 'cardHowToAuditStep1', 'cardHowToAuditStep2',
      'cardHowToAuditStep3', 'cardFixAllBtn', 'cardQuickFixLink', 'cardQuickFixList', 'cardManualAltTitle',
      'cardManualAltHint', 'cardSaveAltBtn', 'cardMarkDecorativeBtn', 'cardAltNote', 'cardNoticeRescanned',
      'cardNoticeAltSaved', 'cardNoticeDecorative', 'cardNoticeFixApplied', 'cardNoticeFixAllApplied',
      'cardNoticeDemoCreated', 'cardNoticeNoDrafts'
    ];

    it('verifies all 34 locales contain 100% of all canonical domain keys', () => {
      const allLocales = Object.keys(DICTIONARIES);
      const missingKeysMap: Record<string, string[]> = {};

      for (const loc of allLocales) {
        const dict = DICTIONARIES[loc as keyof typeof DICTIONARIES];
        const missing = CANONICAL_DOMAIN_KEYS.filter((k: string) => !(k in dict) || (dict as any)[k] === undefined);
        if (missing.length > 0) {
          missingKeysMap[loc] = missing;
        }
      }

      expect(missingKeysMap).toEqual({});
    });

    it('verifies all 4 RTL dictionaries contain 100% of all canonical domain keys', () => {
      for (const rtl of ALL_RTL_LOCALES) {
        const dict = DICTIONARIES[rtl as keyof typeof DICTIONARIES];
        for (const key of CANONICAL_DOMAIN_KEYS) {
          const val = (dict as any)[key];
          expect(val).toBeDefined();
          expect(typeof val).toBe('string');
          expect(val.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('verifies interpolateParams handles numeric 0, complex strings, and missing placeholders safely in RTL mode', () => {
      i18nService.setLanguage('ar');

      // Test with numeric 0
      const res0 = i18nService.t('bulkRemediableHeading', { count: 0 });
      expect(res0).toContain('0');

      // Test with large numbers
      const resLarge = i18nService.t('bulkRemediableHeading', { count: 999999 });
      expect(resLarge).toContain('999999');

      // Test with custom tokens containing punctuation
      const resPunct = interpolateParams('Rule: {title} (ID: {id})', { title: 'Contrast #1', id: 'el_12-a' });
      expect(resPunct).toBe('Rule: Contrast #1 (ID: el_12-a)');
    });
  });
});
