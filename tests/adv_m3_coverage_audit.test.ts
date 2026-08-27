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
  normalizeLocale,
  isRtlLocale as frontendIsRtlLocale,
  interpolateParams,
} from '../ui/src/app/services/i18n.service';
import {
  DICTIONARIES,
  SUPPORTED_LANGUAGES,
  TranslationDictionary,
} from '../ui/src/app/services/translations';
import {
  isRtlLocale as backendIsRtlLocale,
  normalizeLocale as backendNormalizeLocale,
  resolveEffectiveLanguage,
  BACKEND_DICTIONARIES,
  RTL_LANGUAGES as BACKEND_RTL_LANGUAGES,
} from '../backend/src/utils/i18n';
import {
  isRtlLocale as helperIsRtlLocale,
  getDirection,
  isolateBiDiToken,
  validateCssLogicalProperties,
} from './I18nRtlBiDi.test';

describe('Milestone 3 Challenger 2: Adversarial RTL, BiDi & CSS Logical Property Audit', () => {
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService();
  });

  const componentFiles = [
    { name: 'AppComponent', path: 'ui/src/app/app.component.ts' },
    { name: 'DashboardComponent', path: 'ui/src/app/components/dashboard/dashboard.component.ts' },
    { name: 'IssueListComponent', path: 'ui/src/app/components/issue-list/issue-list.component.ts' },
    { name: 'ReadingOrderModalComponent', path: 'ui/src/app/components/reading-order-modal/reading-order-modal.component.ts' },
    { name: 'SettingsPanelComponent', path: 'ui/src/app/components/settings-panel/settings-panel.component.ts' },
    { name: 'HelpModalComponent', path: 'ui/src/app/components/help-modal/help-modal.component.ts' },
  ];

  // =========================================================================
  // PHASE 1: STATIC CODEBASE AUDIT FOR CSS LOGICAL PROPERTY COMPLIANCE
  // =========================================================================
  describe('Phase 1: CSS Logical Property Compliance across All Components', () => {
    it('verifies zero physical directional CSS properties in all Angular component inline styles', () => {
      const physicalCssRegexes = [
        { regex: /\bmargin-left\s*:/i, name: 'margin-left' },
        { regex: /\bmargin-right\s*:/i, name: 'margin-right' },
        { regex: /\bpadding-left\s*:/i, name: 'padding-left' },
        { regex: /\bpadding-right\s*:/i, name: 'padding-right' },
        { regex: /\bborder-left\s*:/i, name: 'border-left' },
        { regex: /\bborder-right\s*:/i, name: 'border-right' },
        { regex: /\bborder-left-color\s*:/i, name: 'border-left-color' },
        { regex: /\bborder-right-color\s*:/i, name: 'border-right-color' },
        { regex: /\btext-align\s*:\s*left\b/i, name: 'text-align: left' },
        { regex: /\btext-align\s*:\s*right\b/i, name: 'text-align: right' },
        { regex: /\bfloat\s*:\s*left\b/i, name: 'float: left' },
        { regex: /\bfloat\s*:\s*right\b/i, name: 'float: right' },
      ];

      const violations: Array<{ component: string; property: string; line: number; text: string }> = [];

      for (const comp of componentFiles) {
        const fullPath = path.join(__dirname, '..', comp.path);
        expect(fs.existsSync(fullPath)).toBe(true);
        const code = fs.readFileSync(fullPath, 'utf8');

        // Extract styles array content
        const stylesMatch = /styles:\s*\[`([\s\S]*?)`\]/m.exec(code);
        if (stylesMatch) {
          const stylesText = stylesMatch[1];
          const lines = stylesText.split('\n');

          lines.forEach((lineText, idx) => {
            // Ignore comments
            const cleanLine = lineText.replace(/\/\*[\s\S]*?\*\//g, '').trim();
            if (!cleanLine || cleanLine.startsWith('//') || cleanLine.startsWith('/*') || cleanLine.startsWith('*')) {
              return;
            }

            for (const rule of physicalCssRegexes) {
              if (rule.regex.test(cleanLine)) {
                violations.push({
                  component: comp.name,
                  property: rule.name,
                  line: idx + 1,
                  text: cleanLine,
                });
              }
            }
          });
        }
      }

      if (violations.length > 0) {
        console.error('CSS Logical Property Violations Detected:', violations);
      }
      expect(violations).toHaveLength(0);
    });

    it('verifies all modals utilize CSS logical inset: 0 instead of legacy physical top/left/right/bottom coordinates', () => {
      const modalComponents = [
        'ui/src/app/components/reading-order-modal/reading-order-modal.component.ts',
        'ui/src/app/components/settings-panel/settings-panel.component.ts',
        'ui/src/app/components/help-modal/help-modal.component.ts',
      ];

      for (const relPath of modalComponents) {
        const fullPath = path.join(__dirname, '..', relPath);
        const code = fs.readFileSync(fullPath, 'utf8');
        const stylesMatch = /styles:\s*\[`([\s\S]*?)`\]/m.exec(code);
        expect(stylesMatch).not.toBeNull();
        const styles = stylesMatch![1];

        // Should use inset: 0 for fixed overlays
        expect(styles).toMatch(/inset:\s*0/);
        expect(styles).not.toMatch(/top:\s*0;\s*left:\s*0;\s*right:\s*0;\s*bottom:\s*0/);
      }
    });

    it('verifies IssueListComponent uses border-inline-start and border-inline-start-color for severity stripes', () => {
      const fullPath = path.join(__dirname, '../ui/src/app/components/issue-list/issue-list.component.ts');
      const code = fs.readFileSync(fullPath, 'utf8');
      const stylesMatch = /styles:\s*\[`([\s\S]*?)`\]/m.exec(code);
      expect(stylesMatch).not.toBeNull();
      const styles = stylesMatch![1];

      expect(styles).toMatch(/border-inline-start:\s*4px\s+solid/);
      expect(styles).toMatch(/\.issue-card\.error\s*\{\s*border-inline-start-color:\s*#d93025;/);
      expect(styles).toMatch(/\.issue-card\.warning\s*\{\s*border-inline-start-color:\s*#e37400;/);
      expect(styles).toMatch(/\.issue-card\.notice\s*\{\s*border-inline-start-color:\s*#1a73e8;/);
    });
  });

  // =========================================================================
  // PHASE 2: DOM DIR ATTRIBUTE PROPAGATION & COMPONENT TEMPLATES AUDIT
  // =========================================================================
  describe('Phase 2: DOM dir Attribute Switching & Template Bindings', () => {
    it('verifies root index.html has initial dir="ltr" attribute', () => {
      const indexPath = path.join(__dirname, '../ui/src/index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toMatch(/<html[^>]+dir=["']ltr["']/);
      expect(content).toMatch(/<html[^>]+lang=["']en["']/);
    });

    it('verifies AppComponent synchronizes document.documentElement.dir and lang via Angular effect()', () => {
      const appCompPath = path.join(__dirname, '../ui/src/app/app.component.ts');
      const content = fs.readFileSync(appCompPath, 'utf8');

      // Check for effect() injection in constructor
      expect(content).toMatch(/effect\(\s*\(\)\s*=>\s*\{/);
      expect(content).toMatch(/document\.documentElement\.dir\s*=\s*dir;/);
      expect(content).toMatch(/document\.documentElement\.lang\s*=\s*lang;/);

      // Check header and main bindings
      expect(content).toMatch(/<header[^>]+\[attr\.dir\]="i18n\.dir\(\)"/);
      expect(content).toMatch(/<main[^>]+\[attr\.dir\]="i18n\.dir\(\)"/);
    });

    it('verifies all 3 modal backdrops bind [attr.dir]="i18n.dir()" dynamically', () => {
      const modals = [
        'ui/src/app/components/reading-order-modal/reading-order-modal.component.ts',
        'ui/src/app/components/settings-panel/settings-panel.component.ts',
        'ui/src/app/components/help-modal/help-modal.component.ts',
      ];

      for (const relPath of modals) {
        const fullPath = path.join(__dirname, '..', relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).toMatch(/<div class="modal-backdrop"[^>]+\[attr\.dir\]="i18n\.dir\(\)"/);
      }
    });

    it('verifies Angular Signal reactivity: dir() and isRtl() toggle instantly on language switch', () => {
      // Default initial state
      expect(service.resolvedLanguage()).toBe('en');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');
      expect(service.getDirection()).toBe('ltr');

      // Switch to Arabic (RTL)
      service.setLanguage('ar');
      expect(service.resolvedLanguage()).toBe('ar');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');
      expect(service.getDirection()).toBe('rtl');

      // Switch to Hebrew (RTL, canonical 'iw')
      service.setLanguage('he');
      expect(service.resolvedLanguage()).toBe('iw');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Switch to Persian (RTL)
      service.setLanguage('fa');
      expect(service.resolvedLanguage()).toBe('fa');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Switch to Urdu (RTL)
      service.setLanguage('ur');
      expect(service.resolvedLanguage()).toBe('ur');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Switch to French (LTR)
      service.setLanguage('fr');
      expect(service.resolvedLanguage()).toBe('fr');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');

      // Switch to Japanese (LTR)
      service.setLanguage('ja');
      expect(service.resolvedLanguage()).toBe('ja');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');
    });

    it('verifies auto-detection with host workspace RTL locales', () => {
      // Auto with Arabic workspace
      service.setLanguage('AUTO', 'ar-EG');
      expect(service.resolvedLanguage()).toBe('ar');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Auto with Hebrew workspace (he-IL)
      service.setLanguage('AUTO', 'he-IL');
      expect(service.resolvedLanguage()).toBe('iw');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Auto with Persian workspace (fa-IR)
      service.setLanguage('AUTO', 'fa-IR');
      expect(service.resolvedLanguage()).toBe('fa');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Auto with Urdu workspace (ur-PK)
      service.setLanguage('AUTO', 'ur-PK');
      expect(service.resolvedLanguage()).toBe('ur');
      expect(service.isRtl()).toBe(true);
      expect(service.dir()).toBe('rtl');

      // Auto with Spanish (Argentina) - es-AR must remain LTR!
      service.setLanguage('AUTO', 'es-AR');
      expect(service.resolvedLanguage()).toBe('es');
      expect(service.isRtl()).toBe(false);
      expect(service.dir()).toBe('ltr');
    });
  });

  // =========================================================================
  // PHASE 3: BIDI TOKEN ISOLATION AUDIT IN TEMPLATES & STYLES
  // =========================================================================
  describe('Phase 3: BiDi Isolation Rules in Angular Components', () => {
    it('verifies DashboardComponent wraps score, stats, and filter counts in <bdi>', () => {
      const fullPath = path.join(__dirname, '../ui/src/app/components/dashboard/dashboard.component.ts');
      const content = fs.readFileSync(fullPath, 'utf8');

      // Score percentage
      expect(content).toMatch(/<span class="score-num"><bdi>\{\{\s*getScoreDisplay\(\)\s*\}\}<\/bdi><\/span>/);

      // Stat error/warning/notice counts
      expect(content).toMatch(/<span class="count"><bdi>\{\{\s*loading\s*\|\|\s*!hasScanned\s*\?\s*'-'\s*:\s*errors\s*\}\}<\/bdi><\/span>/);
      expect(content).toMatch(/<span class="count"><bdi>\{\{\s*loading\s*\|\|\s*!hasScanned\s*\?\s*'-'\s*:\s*warnings\s*\}\}<\/bdi><\/span>/);
      expect(content).toMatch(/<span class="count"><bdi>\{\{\s*loading\s*\|\|\s*!hasScanned\s*\?\s*'-'\s*:\s*notices\s*\}\}<\/bdi><\/span>/);

      // Filter chips counts
      expect(content).toMatch(/<bdi>\{\{\s*issues\.length\s*\}\}<\/bdi>/);
      expect(content).toMatch(/<bdi>\{\{\s*errors\s*\}\}<\/bdi>/);
      expect(content).toMatch(/<bdi>\{\{\s*warnings\s*\}\}<\/bdi>/);
      expect(content).toMatch(/<bdi>\{\{\s*notices\s*\}\}<\/bdi>/);

      // Fix-all count
      expect(content).toMatch(/<bdi>\{\{\s*fixableCount\s*\}\}<\/bdi>/);

      // CSS isolate rules
      expect(content).toMatch(/\.score-num\s*\{[\s\S]*?direction:\s*ltr;\s*unicode-bidi:\s*isolate;/);
      expect(content).toMatch(/\.stat\s+\.count\s*\{[\s\S]*?direction:\s*ltr;\s*unicode-bidi:\s*isolate;/);
    });

    it('verifies IssueListComponent isolates severity, WCAG rules, chips, snippets, and hex swatches', () => {
      const fullPath = path.join(__dirname, '../ui/src/app/components/issue-list/issue-list.component.ts');
      const content = fs.readFileSync(fullPath, 'utf8');

      // Severity badge
      expect(content).toMatch(/<span class="severity-badge"><bdi>\{\{\s*issue\.severity\s*\}\}<\/bdi><\/span>/);

      // WCAG badge
      expect(content).toMatch(/<span class="wcag-badge"[^>]*><bdi>\{\{\s*issue\.wcagRule\s*\}\}<\/bdi><\/span>/);

      // Element chip
      expect(content).toMatch(/<span class="element-chip"><bdi>\{\{\s*issue\.elementType\s*\}\}<\/bdi><\/span>/);

      // Code snippet with dir="ltr" and <bdi>
      expect(content).toMatch(/<code dir="ltr"><bdi>\{\{\s*issue\.snippet\s*\}\}<\/bdi><\/code>/);

      // Hex swatches
      expect(content).toMatch(/<strong><bdi>\{\{\s*issue\.fixMetadata\.currentHex\s*\}\}<\/bdi><\/strong>/);
      expect(content).toMatch(/<strong><bdi>\{\{\s*issue\.fixMetadata\.suggestedHex\s*\}\}<\/bdi><\/strong>/);

      // Fix all count in banner
      expect(content).toMatch(/<button type="button" class="fix-all-btn"[^>]*>[\s\S]*?<bdi>\{\{\s*fixableCount\s*\}\}<\/bdi>/);

      // CSS isolate rules
      expect(content).toMatch(/\.tech-token,\s*\.wcag-badge,\s*\.element-chip,\s*\.severity-badge,\s*code,\s*\.snippet-box,\s*\.swatch strong\s*\{[\s\S]*?direction:\s*ltr;\s*unicode-bidi:\s*isolate;\s*\}/);
    });

    it('verifies ReadingOrderModalComponent isolates element indices, types, and preview text', () => {
      const fullPath = path.join(__dirname, '../ui/src/app/components/reading-order-modal/reading-order-modal.component.ts');
      const content = fs.readFileSync(fullPath, 'utf8');

      expect(content).toMatch(/<span class="el-index"><bdi>\{\{\s*i\s*\+\s*1\s*\}\}\.<\/bdi><\/span>/);
      expect(content).toMatch(/<span class="el-type"><bdi>\[\{\{\s*el\.objectType\s*\}\}\]<\/bdi><\/span>/);
      expect(content).toMatch(/<strong class="el-preview"><bdi>\{\{\s*el\.previewText\s*\}\}<\/bdi><\/strong>/);

      // CSS isolate rule
      expect(content).toMatch(/\.el-index,\s*\.el-type,\s*\.el-preview\s*\{[\s\S]*?unicode-bidi:\s*isolate;\s*\}/);
    });

    it('verifies HelpModalComponent isolates rule descriptions and definitions in <bdi>', () => {
      const fullPath = path.join(__dirname, '../ui/src/app/components/help-modal/help-modal.component.ts');
      const content = fs.readFileSync(fullPath, 'utf8');

      // Title & defs
      expect(content).toMatch(/<h2 id="help-title"><bdi>\{\{\s*i18n\.t\('helpTitle'\)\s*\}\}<\/bdi><\/h2>/);
      expect(content).toMatch(/<li><strong><bdi>\{\{\s*i18n\.t\('errorDef'\)\s*\}\}<\/bdi><\/strong><\/li>/);
      expect(content).toMatch(/<li><strong><bdi>\{\{\s*i18n\.t\('warningDef'\)\s*\}\}<\/bdi><\/strong><\/li>/);
      expect(content).toMatch(/<li><strong><bdi>\{\{\s*i18n\.t\('noticeDef'\)\s*\}\}<\/bdi><\/strong><\/li>/);

      // Rules
      expect(content).toMatch(/<li><bdi>\{\{\s*i18n\.t\('ruleContrast'\)\s*\}\}<\/bdi><\/li>/);
      expect(content).toMatch(/<li><bdi>\{\{\s*i18n\.t\('ruleHeading'\)\s*\}\}<\/bdi><\/li>/);
      expect(content).toMatch(/<li><bdi>\{\{\s*i18n\.t\('ruleLink'\)\s*\}\}<\/bdi><\/li>/);
      expect(content).toMatch(/<li><bdi>\{\{\s*i18n\.t\('ruleAlt'\)\s*\}\}<\/bdi><\/li>/);
      expect(content).toMatch(/<li><bdi>\{\{\s*i18n\.t\('ruleAlign'\)\s*\}\}<\/bdi><\/li>/);
      expect(content).toMatch(/<li><bdi>\{\{\s*i18n\.t\('ruleSpacing'\)\s*\}\}<\/bdi><\/li>/);

      // CSS isolate rule
      expect(content).toMatch(/\.help-section li,\s*\.help-section li bdi,\s*\.help-section li strong\s*\{[\s\S]*?unicode-bidi:\s*isolate;\s*\}/);
    });
  });

  // =========================================================================
  // PHASE 4: ADVERSARIAL STRESS TESTING & ORACLE VALIDATION
  // =========================================================================
  describe('Phase 4: Adversarial Input Stress Testing & Oracle Validation', () => {
    it('stress-tests RTL detection against 100+ synthetic and adversarial locale inputs', () => {
      const adversarialCases: Array<{ input: any; expectedRtl: boolean; desc: string }> = [
        // Canonical RTL
        { input: 'ar', expectedRtl: true, desc: 'Arabic standard' },
        { input: 'iw', expectedRtl: true, desc: 'Hebrew old' },
        { input: 'he', expectedRtl: true, desc: 'Hebrew modern' },
        { input: 'fa', expectedRtl: true, desc: 'Persian standard' },
        { input: 'ur', expectedRtl: true, desc: 'Urdu standard' },
        // Regional RTL
        { input: 'ar-EG', expectedRtl: true, desc: 'Arabic Egypt' },
        { input: 'ar-SA', expectedRtl: true, desc: 'Arabic Saudi Arabia' },
        { input: 'ar-AE', expectedRtl: true, desc: 'Arabic UAE' },
        { input: 'fa-IR', expectedRtl: true, desc: 'Persian Iran' },
        { input: 'fa-AF', expectedRtl: true, desc: 'Persian Afghanistan' },
        { input: 'ur-PK', expectedRtl: true, desc: 'Urdu Pakistan' },
        { input: 'ur-IN', expectedRtl: true, desc: 'Urdu India' },
        { input: 'iw-IL', expectedRtl: true, desc: 'Hebrew Israel (iw)' },
        { input: 'he-IL', expectedRtl: true, desc: 'Hebrew Israel (he)' },
        // Underscore variants
        { input: 'ar_EG', expectedRtl: true, desc: 'Arabic Egypt underscore' },
        { input: 'fa_IR', expectedRtl: true, desc: 'Persian Iran underscore' },
        { input: 'ur_PK', expectedRtl: true, desc: 'Urdu Pakistan underscore' },
        { input: 'he_IL', expectedRtl: true, desc: 'Hebrew Israel underscore' },
        // Uppercase & Mixed Case
        { input: 'AR', expectedRtl: true, desc: 'Arabic uppercase' },
        { input: 'AR-EG', expectedRtl: true, desc: 'Arabic Egypt uppercase' },
        { input: 'Fa-Ir', expectedRtl: true, desc: 'Persian mixed case' },
        { input: 'UR_pk', expectedRtl: true, desc: 'Urdu mixed case' },
        { input: '  ar  ', expectedRtl: true, desc: 'Arabic with surrounding whitespace' },
        { input: '  he-IL  ', expectedRtl: true, desc: 'Hebrew with surrounding whitespace' },

        // LTR Substring & Suffix Pitfalls
        { input: 'es-AR', expectedRtl: false, desc: 'Spanish in Argentina (country AR, not language ar)' },
        { input: 'es_AR', expectedRtl: false, desc: 'Spanish in Argentina underscore' },
        { input: 'en-US', expectedRtl: false, desc: 'English US' },
        { input: 'en-UR', expectedRtl: false, desc: 'English with hypothetical UR region' },
        { input: 'arm', expectedRtl: false, desc: 'English word arm' },
        { input: 'hero', expectedRtl: false, desc: 'English word hero' },
        { input: 'heart', expectedRtl: false, desc: 'English word heart' },
        { input: 'fast', expectedRtl: false, desc: 'English word fast' },
        { input: 'urban', expectedRtl: false, desc: 'English word urban' },
        { input: 'farm', expectedRtl: false, desc: 'English word farm' },
        { input: 'park', expectedRtl: false, desc: 'English word park' },
        { input: 'start', expectedRtl: false, desc: 'English word start' },
        { input: 'hebrew', expectedRtl: false, desc: 'Full word hebrew instead of ISO code' },
        { input: 'arabic', expectedRtl: false, desc: 'Full word arabic instead of ISO code' },
        { input: 'farsi', expectedRtl: false, desc: 'Full word farsi instead of ISO code' },

        // Edge & Boundary values
        { input: '', expectedRtl: false, desc: 'Empty string' },
        { input: '   ', expectedRtl: false, desc: 'Whitespace string' },
        { input: null, expectedRtl: false, desc: 'Null value' },
        { input: undefined, expectedRtl: false, desc: 'Undefined value' },
        { input: '123', expectedRtl: false, desc: 'Numeric string' },
        { input: '!--?', expectedRtl: false, desc: 'Punctuation string' },
        { input: 'xyz-RTL', expectedRtl: false, desc: 'Invalid language code' },
      ];

      for (const t of adversarialCases) {
        const feResult = frontendIsRtlLocale(t.input);
        const beResult = backendIsRtlLocale(t.input);
        const helperResult = helperIsRtlLocale(t.input);

        expect(feResult).toBe(t.expectedRtl);
        expect(beResult).toBe(t.expectedRtl);
        expect(helperResult).toBe(t.expectedRtl);
      }
    });

    it('validates BiDi isolation for complex mixed-script technical strings', () => {
      const testCases = [
        {
          input: '#1A73E8',
          expected: '<bdi class="tech-token">#1A73E8</bdi>',
        },
        {
          input: '#000000',
          expected: '<bdi class="tech-token">#000000</bdi>',
        },
        {
          input: 'WCAG 2.1 Level AA',
          expected: '<bdi class="tech-token">WCAG 2.1 Level AA</bdi>',
        },
        {
          input: '4.5:1',
          expected: '<bdi class="tech-token">4.5:1</bdi>',
        },
        {
          input: '<img src="test.png" alt="logo">',
          expected: '<bdi class="tech-token"><img src="test.png" alt="logo"></bdi>',
        },
        {
          input: 'doc_heading_01_h2',
          expected: '<bdi class="tech-token">doc_heading_01_h2</bdi>',
        },
        {
          input: '100% Contrast Passed',
          expected: '<bdi class="tech-token">100% Contrast Passed</bdi>',
        },
        {
          input: '-18.5 pts',
          expected: '<bdi class="tech-token">-18.5 pts</bdi>',
        },
      ];

      for (const tc of testCases) {
        const isolated = isolateBiDiToken(tc.input);
        expect(isolated).toBe(tc.expected);
        expect(isolated.startsWith('<bdi')).toBe(true);
        expect(isolated.endsWith('</bdi>')).toBe(true);
      }
    });

    it('validates CSS logical property validator detects edge cases and passes fully valid styles', () => {
      // Valid multi-line complex CSS
      const validCss = `
        .sidebar-container {
          margin-inline: auto;
          padding-block: 12px 16px;
          padding-inline-start: 14px;
          padding-inline-end: 20px;
          border-inline-start: 3px solid #1a73e8;
          border-block-end: 1px solid #dadce0;
          text-align: start;
          inset-inline-start: 0;
        }
      `;
      const validCheck = validateCssLogicalProperties(validCss);
      expect(validCheck.valid).toBe(true);
      expect(validCheck.violations).toHaveLength(0);

      // In-valid multi-line complex CSS with multiple violations
      const invalidCss = `
        .broken-card {
          margin-left: 10px;
          margin-right: 20px;
          padding-left: 5px;
          padding-right: 8px;
          border-left: 1px solid red;
          border-right: 2px solid blue;
          text-align: left;
        }
        .broken-subcard {
          text-align: right;
        }
      `;
      const invalidCheck = validateCssLogicalProperties(invalidCss);
      expect(invalidCheck.valid).toBe(false);
      expect(invalidCheck.violations.length).toBe(8);
    });
  });

  // =========================================================================
  // PHASE 5: MULTI-LOCALE PARITY & DICTIONARY CONSISTENCY
  // =========================================================================
  describe('Phase 5: RTL Locales Dictionary Parity', () => {
    const rtlLocales = ['ar', 'iw', 'fa', 'ur'] as const;

    const requiredKeys = [
      'appTitle', 'googleWorkspace', 'helpBtn', 'helpAriaLabel', 'settingsBtn', 'settingsAriaLabel',
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
    ];

    it('verifies all 4 RTL dictionaries contain 100% of all required translation keys', () => {
      expect(requiredKeys.length).toBeGreaterThan(100);

      for (const loc of rtlLocales) {
        const dict = DICTIONARIES[loc];
        expect(dict).toBeDefined();
        for (const key of requiredKeys) {
          const val = (dict as any)[key];
          expect(val).toBeDefined();
          expect(typeof val).toBe('string');
          expect((val as string).trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('verifies all 4 RTL backend dictionaries contain 100% of Gmail Card keys', () => {
      const enBackendKeys = Object.keys(BACKEND_DICTIONARIES['en']);
      expect(enBackendKeys.length).toBeGreaterThan(30);

      for (const loc of rtlLocales) {
        const dict = BACKEND_DICTIONARIES[loc];
        expect(dict).toBeDefined();
        for (const key of enBackendKeys) {
          const val = dict[key];
          expect(val).toBeDefined();
          expect(typeof val).toBe('string');
          expect(val.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });
});
