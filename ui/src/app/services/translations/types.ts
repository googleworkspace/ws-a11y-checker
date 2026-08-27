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

export type SupportedLanguage =
  | 'AUTO'
  | 'en'
  | 'ar'
  | 'iw'
  | 'he'
  | 'fa'
  | 'ur'
  | 'ja'
  | 'zh-CN'
  | 'zh-TW'
  | 'ko'
  | 'hi'
  | 'bn'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt-BR'
  | 'pt-PT'
  | 'nl'
  | 'pl'
  | 'ru'
  | 'tr'
  | 'sv'
  | 'da'
  | 'no'
  | 'fi'
  | 'cs'
  | 'hu'
  | 'ro'
  | 'el'
  | 'uk'
  | 'id'
  | 'vi'
  | 'th'
  | 'fil';

export interface LanguageOption {
  code: string;
  name: string;
  englishName: string;
  rtl?: boolean;
}

export interface TranslationDictionary {
  // Domain A: Application Header & Top Navigation
  appTitle: string;
  googleWorkspace: string;
  helpBtn: string;
  helpAriaLabel: string;
  settingsBtn: string;
  settingsAriaLabel: string;
  globalAnnouncerRegion: string;

  // Domain B: Dashboard, Metrics & Action Bar
  scanSummaryRegion: string;
  wcagScore: string;
  errors: string;
  warnings: string;
  notices: string;
  all: string;
  rescanBtn: string;
  rescanAriaLabel: string;
  scanning: string;
  scanningAriaLabel: string;
  readingOrderModalBtn: string;
  readingOrderAriaLabel: string;
  fixAllBtn: string;
  fixAllAriaLabel: string;

  // Domain C: Issue List & Remediation Feed
  detectedIssuesRegion: string;
  bulkRemediationRegion: string;
  bulkRemediableHeading: string;
  bulkRemediableDesc: string;
  allClearTitle: string;
  allClearDesc: string;
  interactiveContrast: string;
  currentLabel: string;
  suggestionLabel: string;
  jumpBtn: string;
  jumpBtnAriaLabel: string;
  applyFixBtn: string;
  applyFixAriaLabel: string;
  altTextLabel: string;
  altTextPlaceholder: string;
  markDecorative: string;
  decorativeActive: string;
  replacementLinkLabel: string;
  replacementLinkPlaceholder: string;
  suggestTextBtn: string;

  // Domain D: Severity Tiers & Element Type Badges
  severityError: string;
  severityWarning: string;
  severityNotice: string;
  elemParagraph: string;
  elemImage: string;
  elemTable: string;
  elemSlide: string;
  elemTextShape: string;
  elemDocument: string;
  elemSheetTab: string;
  elemDataTable: string;
  elemCellText: string;
  elemEmbeddedChart: string;
  elemFormDescription: string;
  elemFormQuestion: string;
  elemFormImage: string;
  elemFormSectionHeader: string;
  elemEmailLink: string;
  elemEmailImage: string;
  elemEmailText: string;
  elemEmailHeading: string;
  elemEmailTable: string;

  // Domain E: Slide Reading Order Modal
  readingOrderTitle: string;
  readingOrderDesc: string;
  loadingElements: string;
  applyOrderBtn: string;
  cancelBtn: string;
  closeReadingOrderAriaLabel: string;
  dragHandleAriaLabel: string;
  moveUpAriaLabel: string;
  moveDownAriaLabel: string;

  // Domain F: Settings & Preferences Modal
  preferencesTitle: string;
  closePreferencesAriaLabel: string;
  languageLabel: string;
  languageDesc: string;
  langAuto: string;
  contrastModeLabel: string;
  contrastModeDesc: string;
  preserveHsl: string;
  preserveHslDesc: string;
  snapMaterial: string;
  snapMaterialDesc: string;
  autoFixLabel: string;
  autoFixDesc: string;
  aiSettingsTitle: string;
  aiSettingsDesc: string;
  saveBtn: string;

  // Domain G: WCAG 2.1 AA Help & Guidance Modal
  helpTitle: string;
  closeHelpAriaLabel: string;
  overviewTitle: string;
  overviewDesc: string;
  severityTitle: string;
  errorDef: string;
  warningDef: string;
  noticeDef: string;
  rulesTitle: string;
  ruleContrast: string;
  ruleHeading: string;
  ruleLink: string;
  ruleAlt: string;
  ruleAlign: string;
  ruleSpacing: string;
  remedyTitle: string;
  remedyDesc: string;
  gotItBtn: string;

  // Domain H: Screen Reader Live Announcements
  announceScanning: string;
  announceScanComplete: string;
  announceScanError: string;
  announceFixedIssue: string;
  announceNoFixable: string;
  announceApplyingFixes: string;
  announceFixAllSuccess: string;
  announceSettingsSaved: string;
  defaultAltText: string;
  defaultLinkText: string;

  // Domain I: Google Apps Script Gmail Cards
  cardTitle: string;
  cardRefreshBtn: string;
  cardResetDemoBtn: string;
  cardCreateDemoBtn: string;
  cardScanLatestBtn: string;
  cardRefreshAuditBtn: string;
  cardCheckingDraft: string;
  cardAllClearTitle: string;
  cardAllClearDesc: string;
  cardFoundIssues: string;
  cardNoDraftTitle: string;
  cardNoDraftDesc: string;
  cardHowToAuditTitle: string;
  cardHowToAuditStep1: string;
  cardHowToAuditStep2: string;
  cardHowToAuditStep3: string;
  cardFixAllBtn: string;
  cardQuickFixLink: string;
  cardQuickFixList: string;
  cardManualAltTitle: string;
  cardManualAltHint: string;
  cardSaveAltBtn: string;
  cardMarkDecorativeBtn: string;
  cardAltNote: string;
  cardNoticeRescanned: string;
  cardNoticeAltSaved: string;
  cardNoticeDecorative: string;
  cardNoticeFixApplied: string;
  cardNoticeFixAllApplied: string;
  cardNoticeDemoCreated: string;
  cardNoticeNoDrafts: string;

  // Optional compatibility aliases
  [key: string]: string;
}
