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

/**
 * User customizable settings stored via PropertiesService.getUserProperties().
 */
export interface AddonSettings {
  /** Contrast adjustment mode: preserve original hue/saturation or snap to Google Material Design palette */
  contrastFixMode: 'PRESERVE_HSL' | 'SNAP_MATERIAL';
  /** Whether to automatically execute safe 1-click fixes during scans (disabled by default) */
  enableAutoRemediation: boolean;
  /** Language preference */
  language?: SupportedLanguage | string;
  /** Detected Workspace user locale */
  userLocale?: string;
}

export const DEFAULT_SETTINGS: AddonSettings = {
  contrastFixMode: 'PRESERVE_HSL',
  enableAutoRemediation: false,
  language: 'AUTO',
  userLocale: 'en',
};
