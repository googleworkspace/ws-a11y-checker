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

import { LanguageOption, SupportedLanguage, TranslationDictionary } from './types';

import { en } from './en';
import { ar } from './ar';
import { iw } from './iw';
import { fa } from './fa';
import { ur } from './ur';
import { ja } from './ja';
import { zhCN } from './zh-CN';
import { zhTW } from './zh-TW';
import { ko } from './ko';
import { hi } from './hi';
import { bn } from './bn';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { it } from './it';
import { ptBR } from './pt-BR';
import { ptPT } from './pt-PT';
import { nl } from './nl';
import { pl } from './pl';
import { ru } from './ru';
import { tr } from './tr';
import { sv } from './sv';
import { da } from './da';
import { no } from './no';
import { fi } from './fi';
import { cs } from './cs';
import { hu } from './hu';
import { ro } from './ro';
import { el } from './el';
import { uk } from './uk';
import { id } from './id';
import { vi } from './vi';
import { th } from './th';
import { fil } from './fil';

export * from './types';
export {
  en,
  ar,
  iw,
  fa,
  ur,
  ja,
  zhCN as zh_CN,
  zhTW as zh_TW,
  ko,
  hi,
  bn,
  es,
  fr,
  de,
  it,
  ptBR as pt_BR,
  ptPT as pt_PT,
  nl,
  pl,
  ru,
  tr,
  sv,
  da,
  no,
  fi,
  cs,
  hu,
  ro,
  el,
  uk,
  id,
  vi,
  th,
  fil,
};

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'AUTO', name: 'Auto-detect (Workspace)', englishName: 'Auto-detect' },
  { code: 'en', name: 'English', englishName: 'English' },
  { code: 'es', name: 'Español', englishName: 'Spanish' },
  { code: 'fr', name: 'Français', englishName: 'French' },
  { code: 'de', name: 'Deutsch', englishName: 'German' },
  { code: 'it', name: 'Italiano', englishName: 'Italian' },
  { code: 'pt-BR', name: 'Português (Brasil)', englishName: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Português (Portugal)', englishName: 'Portuguese (Portugal)' },
  { code: 'nl', name: 'Nederlands', englishName: 'Dutch' },
  { code: 'pl', name: 'Polski', englishName: 'Polish' },
  { code: 'ru', name: 'Русский', englishName: 'Russian' },
  { code: 'tr', name: 'Türkçe', englishName: 'Turkish' },
  { code: 'sv', name: 'Svenska', englishName: 'Swedish' },
  { code: 'da', name: 'Dansk', englishName: 'Danish' },
  { code: 'no', name: 'Norsk', englishName: 'Norwegian' },
  { code: 'fi', name: 'Suomi', englishName: 'Finnish' },
  { code: 'cs', name: 'Čeština', englishName: 'Czech' },
  { code: 'hu', name: 'Magyar', englishName: 'Hungarian' },
  { code: 'ro', name: 'Română', englishName: 'Romanian' },
  { code: 'el', name: 'Ελληνικά', englishName: 'Greek' },
  { code: 'uk', name: 'Українська', englishName: 'Ukrainian' },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', rtl: true },
  { code: 'iw', name: 'עברית', englishName: 'Hebrew', rtl: true },
  { code: 'fa', name: 'فارسی', englishName: 'Persian', rtl: true },
  { code: 'ur', name: 'اردو', englishName: 'Urdu', rtl: true },
  { code: 'ja', name: '日本語', englishName: 'Japanese' },
  { code: 'zh-CN', name: '简体中文', englishName: 'Simplified Chinese' },
  { code: 'zh-TW', name: '繁體中文', englishName: 'Traditional Chinese' },
  { code: 'ko', name: '한국어', englishName: 'Korean' },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi' },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali' },
  { code: 'id', name: 'Bahasa Indonesia', englishName: 'Indonesian' },
  { code: 'vi', name: 'Tiếng Việt', englishName: 'Vietnamese' },
  { code: 'th', name: 'ไทย', englishName: 'Thai' },
  { code: 'fil', name: 'Filipino', englishName: 'Filipino' },
];

export const DICTIONARIES: Record<string, TranslationDictionary> = {
  en,
  ar,
  iw,
  he: iw, // Hebrew alias
  fa,
  ur,
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ko,
  hi,
  bn,
  es,
  fr,
  de,
  it,
  'pt-BR': ptBR,
  'pt-PT': ptPT,
  nl,
  pl,
  ru,
  tr,
  sv,
  da,
  no,
  fi,
  cs,
  hu,
  ro,
  el,
  uk,
  id,
  vi,
  th,
  fil,
};
