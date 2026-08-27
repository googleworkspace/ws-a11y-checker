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

import { Injectable, signal, computed, WritableSignal, Signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  DICTIONARIES,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  SupportedLanguage,
  TranslationDictionary,
} from './translations';

export * from './translations';

/**
 * RTL Language codes: Arabic (ar), Hebrew (iw / he), Persian (fa), Urdu (ur).
 */
const RTL_LANGUAGES = new Set(['ar', 'iw', 'he', 'fa', 'ur']);

/**
 * Normalizes any locale string (BCP47 or POSIX, e.g. "zh_CN", "pt_BR", "fr-CA", "he", "iw", "tl")
 * to the canonical supported dictionary key.
 */
export function normalizeLocale(locale?: string): string {
  if (!locale) return 'en';
  const clean = locale.trim().replace(/_/g, '-');
  const lower = clean.toLowerCase();

  // Explicit mappings and alias overrides
  if (lower === 'he' || lower === 'iw' || lower.startsWith('he-') || lower.startsWith('iw-')) {
    return 'iw';
  }
  if (
    lower === 'zh-cn' ||
    lower === 'zh-hans' ||
    lower.startsWith('zh-hans') ||
    lower.startsWith('zh-cn') ||
    lower === 'zh-sg' ||
    lower === 'zh'
  ) {
    return 'zh-CN';
  }
  if (
    lower === 'zh-tw' ||
    lower === 'zh-hant' ||
    lower.startsWith('zh-hant') ||
    lower.startsWith('zh-tw') ||
    lower.startsWith('zh-hk') ||
    lower.startsWith('zh-mo') ||
    lower === 'zh-hk' ||
    lower === 'zh-mo'
  ) {
    return 'zh-TW';
  }
  if (lower === 'pt-br' || lower === 'pt') {
    return 'pt-BR';
  }
  if (lower === 'pt-pt') {
    return 'pt-PT';
  }
  if (lower === 'tl' || lower === 'fil' || lower.startsWith('fil-') || lower.startsWith('tl-')) {
    return 'fil';
  }
  if (lower === 'in' || lower === 'id' || lower.startsWith('id-') || lower.startsWith('in-')) {
    return 'id';
  }
  if (lower === 'nb' || lower === 'nn' || lower === 'no' || lower.startsWith('no-') || lower.startsWith('nb-') || lower.startsWith('nn-')) {
    return 'no';
  }

  // Direct case-insensitive match against dictionary keys
  const directMatch = Object.keys(DICTIONARIES).find(k => k.toLowerCase() === lower);
  if (directMatch) return directMatch;

  // Language primary subtag match (e.g. "es-419" -> "es", "fr-CA" -> "fr", "en-GB" -> "en")
  const primarySubtag = lower.split('-')[0];
  const primaryMatch = Object.keys(DICTIONARIES).find(k => k.toLowerCase() === primarySubtag);
  if (primaryMatch) return primaryMatch;

  return 'en';
}

/**
 * Checks if a given language or locale string represents a Right-to-Left (RTL) script.
 */
export function isRtlLocale(lang?: string): boolean {
  if (!lang) return false;
  const normalized = normalizeLocale(lang).toLowerCase();
  if (RTL_LANGUAGES.has(normalized)) return true;
  const primary = normalized.split('-')[0];
  return RTL_LANGUAGES.has(primary);
}

/**
 * Substitutes {{param}} or {param} placeholders in a translation template string.
 */
export function interpolateParams(template: string, params?: Record<string, string | number>): string {
  if (!params || typeof template !== 'string') return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    const valStr = String(value);
    result = result.split(`{{${key}}}`).join(valStr);
    result = result.split(`{${key}}`).join(valStr);
  }
  return result;
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  /**
   * User's preference setting ('AUTO' or specific locale code).
   */
  readonly currentLanguage: WritableSignal<string> = signal<string>('AUTO');

  /**
   * Effective resolved language code ('en', 'es', 'ar', etc.).
   */
  readonly resolvedLanguage: WritableSignal<string> = signal<string>('en');

  /**
   * Angular Signal indicating whether current resolved locale is RTL.
   */
  readonly isRtl: Signal<boolean> = computed<boolean>(() => isRtlLocale(this.resolvedLanguage()));

  /**
   * Angular Signal indicating HTML reading direction ('ltr' or 'rtl').
   */
  readonly dir: Signal<'ltr' | 'rtl'> = computed<'ltr' | 'rtl'>(() => (this.isRtl() ? 'rtl' : 'ltr'));

  /**
   * Backward-compatible RxJS Subject for components subscribing via lang$.
   */
  private langSubject = new BehaviorSubject<string>('en');
  readonly lang$: Observable<string> = this.langSubject.asObservable();

  private activeLang = 'en';

  constructor() {
    this.setLanguage('AUTO');
  }

  /**
   * Sets the active language preference and resolves the effective dictionary locale.
   * @param pref User preference ('AUTO' or specific locale)
   * @param workspaceLocale Host Google Workspace locale from Session.getActiveUserLocale()
   */
  setLanguage(pref: string, workspaceLocale?: string): void {
    const targetPref = pref || 'AUTO';
    this.currentLanguage.set(targetPref);

    let effectiveLocale: string;
    if (targetPref === 'AUTO' || targetPref === 'auto') {
      effectiveLocale = normalizeLocale(workspaceLocale || 'en');
    } else {
      effectiveLocale = normalizeLocale(targetPref);
    }

    if (!DICTIONARIES[effectiveLocale]) {
      effectiveLocale = 'en';
    }

    this.activeLang = effectiveLocale;
    this.resolvedLanguage.set(effectiveLocale);
    this.langSubject.next(effectiveLocale);
  }

  /**
   * Translates a given key with optional parameter interpolation.
   * Falls back to English if the key is missing in the active dictionary,
   * and falls back to key name if not found in English.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const dict = DICTIONARIES[this.activeLang] || DICTIONARIES['en'];
    let template = dict[key] ?? DICTIONARIES['en']?.[key] ?? key;
    if (params) {
      template = interpolateParams(template, params);
    }
    return template;
  }

  /**
   * Backward-compatible method to get current active/resolved language.
   */
  getCurrentLang(): string {
    return this.activeLang;
  }

  /**
   * Returns current resolved effective language code.
   */
  getResolvedLang(): string {
    return this.resolvedLanguage();
  }

  /**
   * Returns current reading direction ('ltr' | 'rtl').
   */
  getDirection(): 'ltr' | 'rtl' {
    return this.dir();
  }


  /**
   * Returns list of supported language options for settings UI.
   */
  getSupportedLanguages(): LanguageOption[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Normalizes a locale code.
   */
  normalizeLocale(locale?: string): string {
    return normalizeLocale(locale);
  }

  /**
   * Checks if locale is RTL.
   */
  isRtlLocale(lang?: string): boolean {
    return isRtlLocale(lang);
  }
}
