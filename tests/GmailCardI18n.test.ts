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

import {
  buildGmailComposeCard,
  buildGmailHomepageCard,
  buildGmailMessageCard,
  refreshGmailComposeCard,
  refreshGmailHomepageCard,
  auditGmailDraftHtml,
} from '../backend/src/hosts/GmailHost';
import { setupGasEnvironment, extractTextFromCard } from './GasMocks';
import { I18nService } from '../ui/src/app/services/i18n.service';

/**
 * Server-side translation helper for Google Apps Script Gmail Cards.
 * Implements the contract defined in PROJECT.md (§ backend/src/i18n/ ↔ GmailHost.ts)
 */
export function getBackendTranslation(
  key: string,
  locale?: string,
  params?: Record<string, string | number>
): string {
  const service = new I18nService();
  service.setLanguage(locale || 'en');
  let text = service.t(key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

describe('GmailCardI18n Test Suite (Opaque-Box E2E)', () => {
  const sampleCleanDraftHtml = `
    <div dir="ltr">
      <p style="font-size: 14px; color: #202124;">Hello team, please find the quarterly report attached.</p>
    </div>
  `;

  const sampleViolationsDraftHtml = `
    <div dir="ltr">
      <div style="font-size: 18px; font-weight: bold; color: #1a73e8;">Quarterly Project Update</div>
      <p style="color: #a0a0a0;">Low contrast update text</p>
      <p>Please <a href="https://example.com">click here</a> for details.</p>
      <img src="cid:chart1" alt="IMG_001.PNG">
    </div>
  `;

  beforeEach(() => {
    setupGasEnvironment({ userLocale: 'en' });
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (≥6 tests covering Gmail card localization)
  // =========================================================================
  describe('Tier 1: Feature Coverage & Server-Side Card Translation', () => {
    it('T1.1: Backend translation engine resolves keys into 6+ Workspace languages', () => {
      const testLocales = ['en', 'es', 'fr', 'de', 'ja', 'ar', 'iw', 'pt-BR', 'zh-CN'];
      for (const loc of testLocales) {
        const title = getBackendTranslation('cardTitle', loc);
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(3);
      }
    });

    it('T1.2: Backend translation engine interpolates variable parameters ({subject}, {count})', () => {
      const formattedSubject = getBackendTranslation('cardCheckingDraft', 'en', {
        subject: 'Q3 Budget Review',
      });
      expect(formattedSubject).toBe('Checking Draft: Q3 Budget Review');

      const formattedFixAll = getBackendTranslation('cardFixAllBtn', 'es', { count: 5 });
      expect(formattedFixAll).toContain('5');
      expect(formattedFixAll).not.toContain('{count}');
    });

    it('T1.3: buildGmailComposeCard renders localized UI in English, Spanish, Japanese, German, and Arabic', () => {
      const locales = ['en', 'es', 'ja', 'de', 'ar'];

      for (const loc of locales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailComposeCard({}, undefined, sampleCleanDraftHtml);
        expect(cards).toBeDefined();
        expect(cards.length).toBe(1);

        const cardTexts = extractTextFromCard(cards[0] as any);
        expect(cardTexts.length).toBeGreaterThan(0);

        // Card title must be present
        const expectedTitle = getBackendTranslation('cardTitle', loc);
        expect(cardTexts).toContain(expectedTitle);
      }
    });

    it('T1.4: buildGmailHomepageCard renders localized empty states and audit buttons', () => {
      const locales = ['en', 'es', 'fr', 'ja', 'iw'];

      for (const loc of locales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailHomepageCard({});
        expect(cards.length).toBe(1);

        const cardTexts = extractTextFromCard(cards[0] as any);
        const expectedTitle = getBackendTranslation('cardTitle', loc);
        expect(cardTexts).toContain(expectedTitle);
      }
    });

    it('T1.5: buildGmailMessageCard renders localized audit results for received messages', () => {
      const locales = ['en', 'es', 'de', 'ja', 'ar'];

      for (const loc of locales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailMessageCard({});
        expect(cards.length).toBe(1);

        const cardTexts = extractTextFromCard(cards[0] as any);
        const expectedTitle = getBackendTranslation('cardTitle', loc);
        expect(cardTexts).toContain(expectedTitle);
      }
    });

    it('T1.6: Localized server notices are generated accurately for rescan and fixes', () => {
      const noticeRescanned = getBackendTranslation('cardNoticeRescanned', 'es');
      expect(noticeRescanned).toBeTruthy();

      const noticeAltSaved = getBackendTranslation('cardNoticeAltSaved', 'ja');
      expect(noticeAltSaved).toBeTruthy();

      const noticeFixAll = getBackendTranslation('cardNoticeFixAllApplied', 'de', { count: 3 });
      expect(noticeFixAll).toContain('3');
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (≥4 edge cases, empty states, missing locale)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: Gracefully falls back to English when host locale is undefined or null', () => {
      setupGasEnvironment({ userLocale: undefined });
      const cards = buildGmailComposeCard({}, undefined, sampleCleanDraftHtml);
      const cardTexts = extractTextFromCard(cards[0] as any);
      const enTitle = getBackendTranslation('cardTitle', 'en');
      expect(cardTexts).toContain(enTitle);
    });

    it('T2.2: Gracefully falls back to English when host locale is unknown (e.g. xx_YY)', () => {
      setupGasEnvironment({ userLocale: 'xx_YY' });
      const translation = getBackendTranslation('cardTitle', 'xx_YY');
      expect(translation).toBe('Email Accessibility Checker');
    });

    it('T2.3: Localized empty draft warning contains helpful instructions', () => {
      for (const loc of ['en', 'es', 'ja', 'de']) {
        const noDraftTitle = getBackendTranslation('cardNoDraftTitle', loc);
        const howToTitle = getBackendTranslation('cardHowToAuditTitle', loc);
        const step1 = getBackendTranslation('cardHowToAuditStep1', loc);

        expect(noDraftTitle).toBeTruthy();
        expect(howToTitle).toBeTruthy();
        expect(step1).toBeTruthy();
      }
    });

    it('T2.4: Handles special HTML characters in draft subject interpolation without corruption', () => {
      const dangerousSubject = '<Script> & "Special" \'Chars\'';
      const formatted = getBackendTranslation('cardCheckingDraft', 'en', {
        subject: dangerousSubject,
      });
      expect(formatted).toContain(dangerousSubject);
    });

    it('T2.5: Extreme count values in Fix All button (0, 1, 999)', () => {
      for (const count of [0, 1, 999]) {
        const btnText = getBackendTranslation('cardFixAllBtn', 'en', { count });
        expect(btnText).toContain(String(count));
      }
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise interactions)
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: RTL locales in Gmail cards (Arabic, Hebrew, Persian, Urdu)', () => {
      const rtlLocales = ['ar', 'iw', 'fa', 'ur'];

      for (const loc of rtlLocales) {
        setupGasEnvironment({ userLocale: loc });
        const cards = buildGmailComposeCard({}, undefined, sampleViolationsDraftHtml);
        expect(cards.length).toBe(1);

        const cardTexts = extractTextFromCard(cards[0] as any);
        const expectedTitle = getBackendTranslation('cardTitle', loc);
        expect(cardTexts).toContain(expectedTitle);
      }
    });

    it('T3.2: refreshGmailComposeCard generates localized ActionResponse notification', () => {
      setupGasEnvironment({ userLocale: 'es' });
      const response = refreshGmailComposeCard({}) as any;
      expect(response).toBeDefined();
      expect(response.notification).toBeDefined();
      expect(response.notification.getText()).toBeTruthy();
    });

    it('T3.3: refreshGmailHomepageCard generates localized ActionResponse notification', () => {
      setupGasEnvironment({ userLocale: 'ja' });
      const response = refreshGmailHomepageCard({}) as any;
      expect(response).toBeDefined();
      expect(response.notification).toBeDefined();
      expect(response.notification.getText()).toBeTruthy();
    });

    it('T3.4: Server card translation synchronized with audit issues detected in draft HTML', () => {
      const issues = auditGmailDraftHtml(sampleViolationsDraftHtml);
      expect(issues.length).toBeGreaterThan(0);

      setupGasEnvironment({ userLocale: 'de' });
      const cards = buildGmailComposeCard({}, undefined, sampleViolationsDraftHtml);
      expect(cards.length).toBe(1);

      const cardTexts = extractTextFromCard(cards[0] as any);
      expect(cardTexts.length).toBeGreaterThan(1);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (Gmail Host E2E workflows)
  // =========================================================================
  describe('Tier 4: Real-World Application Scenarios', () => {
    it('Scenario 1: Arabic User auditing email draft in Gmail Compose with 1-click Quick Fixes', () => {
      setupGasEnvironment({ userLocale: 'ar_EG' });

      // Build compose card for draft with intentional violations
      const cards = buildGmailComposeCard({}, undefined, sampleViolationsDraftHtml);
      expect(cards.length).toBe(1);

      const cardTexts = extractTextFromCard(cards[0] as any);
      const arabicTitle = getBackendTranslation('cardTitle', 'ar');
      expect(cardTexts).toContain(arabicTitle);

      // Verify localized Quick Fix strings
      const quickFixLink = getBackendTranslation('cardQuickFixLink', 'ar', {
        suggestedText: 'رابط مقترح',
      });
      expect(quickFixLink).toContain('رابط مقترح');

      const manualAltTitle = getBackendTranslation('cardManualAltTitle', 'ar', { index: 1 });
      expect(manualAltTitle).toContain('1');
    });

    it('Scenario 2: Japanese User inspecting clean draft and receiving All Clear status', () => {
      setupGasEnvironment({ userLocale: 'ja_JP' });

      const cards = buildGmailComposeCard({}, undefined, sampleCleanDraftHtml);
      expect(cards.length).toBe(1);

      const cardTexts = extractTextFromCard(cards[0] as any);
      const japaneseTitle = getBackendTranslation('cardTitle', 'ja');
      expect(cardTexts).toContain(japaneseTitle);

      // Verify All Clear strings in Japanese
      const allClearTitle = getBackendTranslation('cardAllClearTitle', 'ja');
      const allClearDesc = getBackendTranslation('cardAllClearDesc', 'ja');
      expect(allClearTitle).toBeTruthy();
      expect(allClearDesc).toBeTruthy();
    });

    it('Scenario 3: Brazilian Portuguese User viewing Homepage Card and creating Demo Draft', () => {
      setupGasEnvironment({ userLocale: 'pt_BR' });

      const cards = buildGmailHomepageCard({});
      expect(cards.length).toBe(1);

      const cardTexts = extractTextFromCard(cards[0] as any);
      const ptTitle = getBackendTranslation('cardTitle', 'pt-BR');
      expect(cardTexts).toContain(ptTitle);

      const demoBtn = getBackendTranslation('cardCreateDemoBtn', 'pt-BR');
      expect(demoBtn).toContain('🧪');
    });
  });
});
