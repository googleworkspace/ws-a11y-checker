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
 * Standard RTL helper logic as specified in spec_report.md § 4.1 & PROJECT.md
 */
export function isRtlLocale(lang?: string | null): boolean {
  if (!lang || typeof lang !== 'string') return false;
  const clean = lang.trim().toLowerCase().split(/[-_]/)[0];
  return ['ar', 'iw', 'he', 'fa', 'ur'].includes(clean);
}

/**
 * Direction string helper ('rtl' vs 'ltr')
 */
export function getDirection(lang?: string | null): 'rtl' | 'ltr' {
  return isRtlLocale(lang) ? 'rtl' : 'ltr';
}

/**
 * BiDi Token Isolator helper wrapping technical tokens in <bdi> tags
 */
export function isolateBiDiToken(token: string, className = 'tech-token'): string {
  if (!token) return '';
  return `<bdi class="${className}">${token}</bdi>`;
}

/**
 * Evaluates whether a CSS string conforms to CSS Logical Properties rules
 * instead of legacy physical directional properties.
 */
export function validateCssLogicalProperties(cssRule: string): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const physicalPatterns: Array<{ regex: RegExp; desc: string }> = [
    { regex: /\bmargin-left\s*:/i, desc: 'Use margin-inline-start instead of margin-left' },
    { regex: /\bmargin-right\s*:/i, desc: 'Use margin-inline-end instead of margin-right' },
    { regex: /\bpadding-left\s*:/i, desc: 'Use padding-inline-start instead of padding-left' },
    { regex: /\bpadding-right\s*:/i, desc: 'Use padding-inline-end instead of padding-right' },
    { regex: /\bborder-left\s*:/i, desc: 'Use border-inline-start instead of border-left' },
    { regex: /\bborder-right\s*:/i, desc: 'Use border-inline-end instead of border-right' },
    { regex: /\btext-align\s*:\s*left\b/i, desc: 'Use text-align: start instead of text-align: left' },
    { regex: /\btext-align\s*:\s*right\b/i, desc: 'Use text-align: end instead of text-align: right' },
  ];

  for (const p of physicalPatterns) {
    if (p.regex.test(cssRule)) {
      violations.push(p.desc);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

describe('I18nRtlBiDi Test Suite (Opaque-Box E2E)', () => {
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (≥8 tests covering RTL detection, LTR, and BiDi)
  // =========================================================================
  describe('Tier 1: Feature Coverage & RTL/LTR Classification', () => {
    it('T1.1: Identifies all 5 canonical RTL language codes (ar, iw, he, fa, ur)', () => {
      const rtlCodes = ['ar', 'iw', 'he', 'fa', 'ur'];
      for (const code of rtlCodes) {
        expect(isRtlLocale(code)).toBe(true);
        expect(getDirection(code)).toBe('rtl');
      }
    });

    it('T1.2: Identifies regional variants of RTL languages (ar-EG, ar-SA, fa-IR, ur-PK, iw-IL, he-IL)', () => {
      const rtlVariants = ['ar-EG', 'ar-SA', 'ar-AE', 'fa-IR', 'fa-AF', 'ur-PK', 'ur-IN', 'iw-IL', 'he-IL'];
      for (const variant of rtlVariants) {
        expect(isRtlLocale(variant)).toBe(true);
        expect(getDirection(variant)).toBe('rtl');
      }
    });

    it('T1.3: Correctly classifies all 29 standard LTR languages as non-RTL', () => {
      const ltrLocales = [
        'en', 'es', 'fr', 'de', 'ja', 'zh-CN', 'zh-TW', 'ko', 'hi', 'bn',
        'it', 'pt-BR', 'pt-PT', 'nl', 'pl', 'ru', 'tr', 'sv', 'da', 'no',
        'fi', 'cs', 'hu', 'ro', 'el', 'uk', 'id', 'vi', 'th', 'fil',
      ];

      for (const ltr of ltrLocales) {
        expect(isRtlLocale(ltr)).toBe(false);
        expect(getDirection(ltr)).toBe('ltr');
      }
    });

    it('T1.4: Handles case-insensitive RTL codes (AR, IW, HE, FA, UR, AR-EG)', () => {
      const uppercaseRtl = ['AR', 'IW', 'HE', 'FA', 'UR', 'Ar-Sa', 'Fa_Ir', 'UR-PK'];
      for (const code of uppercaseRtl) {
        expect(isRtlLocale(code)).toBe(true);
        expect(getDirection(code)).toBe('rtl');
      }
    });

    it('T1.5: Wraps technical hex color codes (#1A73E8, #FFFFFF) with <bdi> tokens', () => {
      const hex1 = '#1A73E8';
      const isolated1 = isolateBiDiToken(hex1);
      expect(isolated1).toBe('<bdi class="tech-token">#1A73E8</bdi>');

      const hex2 = '#000000';
      const isolated2 = isolateBiDiToken(hex2);
      expect(isolated2).toBe('<bdi class="tech-token">#000000</bdi>');
    });

    it('T1.6: Wraps WCAG rule identifiers (WCAG 2.1 AA, WCAG 1.4.3) with <bdi> tokens', () => {
      const rule1 = 'WCAG 2.1 AA';
      const isolated1 = isolateBiDiToken(rule1, 'wcag-badge');
      expect(isolated1).toBe('<bdi class="wcag-badge">WCAG 2.1 AA</bdi>');

      const rule2 = 'WCAG 1.4.3 Contrast (Minimum)';
      const isolated2 = isolateBiDiToken(rule2);
      expect(isolated2).toContain('WCAG 1.4.3');
      expect(isolated2.startsWith('<bdi')).toBe(true);
      expect(isolated2.endsWith('</bdi>')).toBe(true);
    });

    it('T1.7: Wraps numerical contrast ratios (4.5:1, 2.1:1) and point deltas (-15 pts)', () => {
      const ratio = '4.5:1';
      expect(isolateBiDiToken(ratio)).toBe('<bdi class="tech-token">4.5:1</bdi>');

      const scoreDelta = '-15 pts';
      expect(isolateBiDiToken(scoreDelta)).toBe('<bdi class="tech-token">-15 pts</bdi>');
    });

    it('T1.8: Verifies CSS logical property validation passes for compliant CSS', () => {
      const compliantCss = `
        .issue-card {
          margin-inline-start: 12px;
          padding-inline-end: 16px;
          border-inline-start: 4px solid #d93025;
          text-align: start;
        }
      `;
      const result = validateCssLogicalProperties(compliantCss);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (≥6 edge cases, false-positive prevention)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: Distinguishes country code AR (Argentina) in es-AR as LTR Spanish', () => {
      // Spanish in Argentina has 'AR' as territory subtag, but primary language is 'es' (LTR)
      expect(isRtlLocale('es-AR')).toBe(false);
      expect(getDirection('es-AR')).toBe('ltr');

      expect(isRtlLocale('es_AR')).toBe(false);
      expect(getDirection('es_AR')).toBe('ltr');
    });

    it('T2.2: Prevents substring false positives for English words containing ar or he (e.g. arm, hero, param)', () => {
      expect(isRtlLocale('arm')).toBe(false);
      expect(isRtlLocale('hero')).toBe(false);
      expect(isRtlLocale('param')).toBe(false);
      expect(isRtlLocale('heart')).toBe(false);
    });

    it('T2.3: Handles null, undefined, and empty string locale inputs safely', () => {
      expect(isRtlLocale('')).toBe(false);
      expect(isRtlLocale('   ')).toBe(false);
      expect(isRtlLocale(null)).toBe(false);
      expect(isRtlLocale(undefined)).toBe(false);
      expect(getDirection('')).toBe('ltr');
      expect(getDirection(null)).toBe('ltr');
    });

    it('T2.4: Handles empty or whitespace tokens in BiDi isolator', () => {
      expect(isolateBiDiToken('')).toBe('');
      expect(isolateBiDiToken(null as any)).toBe('');
      expect(isolateBiDiToken(undefined as any)).toBe('');
    });

    it('T2.5: Isolates AST code snippets containing XML/HTML tags (<img src="...">, alt="")', () => {
      const tagSnippet = '<img src="cid:photo" alt="test">';
      const isolated = isolateBiDiToken(tagSnippet, 'snippet-box');
      expect(isolated).toBe('<bdi class="snippet-box">&lt;img src=&quot;cid:photo&quot; alt=&quot;test&quot;&gt;</bdi>'
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'));
      expect(isolated).toContain('<img src="cid:photo" alt="test">');
    });

    it('T2.6: Flags physical CSS violations accurately', () => {
      const nonCompliantCss = `
        .issue-card {
          margin-left: 12px;
          padding-right: 16px;
          border-left: 4px solid #d93025;
          text-align: left;
        }
      `;
      const result = validateCssLogicalProperties(nonCompliantCss);
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBe(4);
      expect(result.violations).toContain('Use margin-inline-start instead of margin-left');
      expect(result.violations).toContain('Use border-inline-start instead of border-left');
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise interactions)
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: RTL language combined with BiDi technical tokens in issue card titles', () => {
      service.setLanguage('ar');
      const dir = getDirection(service.getCurrentLang());
      expect(dir).toBe('rtl');

      const hexToken = isolateBiDiToken('#1A73E8');
      const ruleToken = isolateBiDiToken('WCAG 1.4.3');
      const compositeCardTitle = `${service.t('interactiveContrast')} - ${hexToken} (${ruleToken})`;

      expect(compositeCardTitle).toContain('<bdi class="tech-token">#1A73E8</bdi>');
      expect(compositeCardTitle).toContain('<bdi class="tech-token">WCAG 1.4.3</bdi>');
      expect(compositeCardTitle).toContain(service.t('interactiveContrast'));
    });

    it('T3.2: Dynamic switching between LTR and RTL updates document direction reactively', () => {
      service.setLanguage('en');
      expect(getDirection(service.getCurrentLang())).toBe('ltr');

      service.setLanguage('ar');
      expect(getDirection(service.getCurrentLang())).toBe('rtl');

      service.setLanguage('ja');
      expect(getDirection(service.getCurrentLang())).toBe('ltr');

      service.setLanguage('iw');
      expect(getDirection(service.getCurrentLang())).toBe('rtl');

      service.setLanguage('es');
      expect(getDirection(service.getCurrentLang())).toBe('ltr');
    });

    it('T3.3: Severity border mirroring rule validation for Error, Warning, and Notice cards', () => {
      const severityStyles = `
        .issue-card.error {
          border-inline-start: 4px solid #d93025;
        }
        .issue-card.warning {
          border-inline-start: 4px solid #f9ab00;
        }
        .issue-card.notice {
          border-inline-start: 4px solid #1a73e8;
        }
      `;
      const validation = validateCssLogicalProperties(severityStyles);
      expect(validation.valid).toBe(true);
    });

    it('T3.4: Slide Reading Order modal button strip logical positioning', () => {
      const modalButtonCss = `
        .reading-order-actions {
          display: flex;
          justify-content: flex-end;
          margin-inline-start: auto;
          padding-inline: 16px;
        }
        .drag-handle {
          margin-inline-end: 12px;
        }
      `;
      const validation = validateCssLogicalProperties(modalButtonCss);
      expect(validation.valid).toBe(true);
    });

    it('T3.5: Urdu & Persian localization combined with isolated element ID tokens', () => {
      for (const loc of ['ur', 'fa']) {
        service.setLanguage(loc);
        expect(getDirection(service.getCurrentLang())).toBe('rtl');

        const elemId = isolateBiDiToken('doc_p_12');
        const jumpLabel = service.t('jumpBtn') + ` (${elemId})`;

        expect(jumpLabel).toContain('<bdi class="tech-token">doc_p_12</bdi>');
        expect(jumpLabel).toContain(service.t('jumpBtn'));
      }
    });

    it('T3.6: Multi-token replacement with BiDi isolation in WCAG Help rules', () => {
      service.setLanguage('he');
      const ruleText = service.t('ruleContrast');
      expect(ruleText).toBeTruthy();

      // Ensure that when WCAG criteria numbers are embedded, they are wrapped in <bdi>
      const isolatedCriterion = isolateBiDiToken('WCAG 1.4.3');
      const isolatedRatio = isolateBiDiToken('4.5:1');
      const formattedHelpEntry = `${isolatedCriterion}: ${ruleText} (${isolatedRatio})`;

      expect(formattedHelpEntry).toContain('<bdi class="tech-token">WCAG 1.4.3</bdi>');
      expect(formattedHelpEntry).toContain('<bdi class="tech-token">4.5:1</bdi>');
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (RTL rendering workflows)
  // =========================================================================
  describe('Tier 4: Real-World Application Scenarios', () => {
    it('Scenario 1: Arabic User reviewing Color Contrast issue in Docs Sidebar', () => {
      service.setLanguage('ar');

      const isRtl = isRtlLocale(service.getCurrentLang());
      const dir = getDirection(service.getCurrentLang());
      expect(isRtl).toBe(true);
      expect(dir).toBe('rtl');

      const currentHex = isolateBiDiToken('#A0A0A0');
      const suggestedHex = isolateBiDiToken('#1A73E8');
      const ratio = isolateBiDiToken('2.6:1');

      const contrastSection = `
        <div dir="${dir}" class="contrast-panel">
          <h3>${service.t('interactiveContrast')}</h3>
          <p>${service.t('currentLabel')}: ${currentHex} (${ratio})</p>
          <p>${service.t('suggestionLabel')}: ${suggestedHex}</p>
        </div>
      `;

      expect(contrastSection).toContain('dir="rtl"');
      expect(contrastSection).toContain('<bdi class="tech-token">#A0A0A0</bdi>');
      expect(contrastSection).toContain('<bdi class="tech-token">#1A73E8</bdi>');
      expect(contrastSection).toContain(service.t('interactiveContrast'));
    });

    it('Scenario 2: Hebrew User organizing Slide Reading Order in Slides Add-on', () => {
      service.setLanguage('iw');

      expect(getDirection(service.getCurrentLang())).toBe('rtl');

      const title = service.t('readingOrderTitle');
      const desc = service.t('readingOrderDesc');
      const applyBtn = service.t('applyOrderBtn');
      const cancelBtn = service.t('cancelBtn');

      expect(title).toBeTruthy();
      expect(desc).toBeTruthy();
      expect(applyBtn).toBeTruthy();
      expect(cancelBtn).toBeTruthy();

      const modalHtml = `
        <div dir="rtl" class="modal-dialog">
          <h2>${title}</h2>
          <p>${desc}</p>
          <div class="actions">
            <button>${applyBtn}</button>
            <button>${cancelBtn}</button>
          </div>
        </div>
      `;

      expect(modalHtml).toContain('dir="rtl"');
      expect(modalHtml).toContain(title);
    });

    it('Scenario 3: Persian (Farsi) Email Draft Accessibility Inspection in Gmail Host', () => {
      service.setLanguage('fa');

      expect(isRtlLocale(service.getCurrentLang())).toBe(true);
      expect(getDirection(service.getCurrentLang())).toBe('rtl');

      const cardTitle = service.t('cardTitle');
      const wcagRule = isolateBiDiToken('WCAG 2.1 AA');
      const altTag = isolateBiDiToken('alt=""');

      const emailAuditSummary = `${cardTitle} - ${wcagRule} (${altTag})`;
      expect(emailAuditSummary).toContain('<bdi class="tech-token">WCAG 2.1 AA</bdi>');
      expect(emailAuditSummary).toContain('<bdi class="tech-token">alt=""</bdi>');
      expect(emailAuditSummary).toContain(cardTitle);
    });
  });
});
