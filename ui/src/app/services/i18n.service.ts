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

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedLanguage = 'AUTO' | 'en' | 'es' | 'fr' | 'de' | 'ja';

const DICTIONARIES: Record<string, Record<string, string>> = {
  en: {
    appTitle: 'Accessibility Checker',
    googleWorkspace: 'Google Workspace',
    helpBtn: 'Help',
    settingsBtn: 'Settings',
    wcagScore: 'WCAG 2.1 AA Score',
    errors: 'Errors',
    warnings: 'Warnings',
    notices: 'Notices',
    all: 'All',
    rescanBtn: 'Rescan Document',
    scanning: 'Scanning active workspace file for WCAG 2.1 AA rules...',
    readingOrderModalBtn: 'Reading Order Modal',
    allClearTitle: 'All Clear!',
    allClearDesc: 'No WCAG 2.1 AA accessibility violations detected.',
    interactiveContrast: 'Interactive Contrast Preview',
    currentLabel: 'Current',
    suggestionLabel: 'Suggestion',
    jumpBtn: 'Jump to Element',
    applyFixBtn: 'Apply Fix',
    readingOrderTitle: 'Slide Reading Order Editor',
    readingOrderDesc: 'Arrange slide elements from top (read first by screen readers) to bottom (read last). WCAG 1.3.2: Use drag-and-drop or the keyboard Up/Down arrow buttons.',
    applyOrderBtn: 'Apply Reading Order',
    cancelBtn: 'Cancel',
    loadingElements: 'Loading slide elements...',
    preferencesTitle: 'Preferences',
    contrastModeLabel: 'Color Contrast Remediation Mode',
    contrastModeDesc: 'Choose how automated contrast adjustments calculate compliant colors.',
    preserveHsl: 'Preserve HSL Hue (Recommended)',
    preserveHslDesc: 'Darkens relative lightness while maintaining brand hue.',
    snapMaterial: 'Snap to Google Material Palette',
    snapMaterialDesc: 'Snaps color to nearest WCAG-compliant Google Grey/Blue shade.',
    autoFixLabel: 'Enable Auto-Remediation on Scan',
    autoFixDesc: 'Automatically applies 1-click fixes during scans (Off by default).',
    languageLabel: 'Interface Language',
    languageDesc: 'Choose your preferred display language for all accessibility tools and reports.',
    langAuto: 'Auto (Google Workspace Preference)',
    saveBtn: 'Save Preferences',
    helpTitle: 'WCAG 2.1 AA Help & Guidance',
    overviewTitle: 'Overview',
    overviewDesc: 'This add-on scans your Google Docs and Slides for human-controllable accessibility barriers, verifying alignment with WCAG 2.1 AA standards.',
    severityTitle: 'Severity Tiers Definitions',
    errorDef: 'Error: Critical violation of mandatory WCAG 2.1 AA Success Criteria preventing essential content perception (-15 pts).',
    warningDef: 'Warning: Serious structural practice creating major usability barriers (-5 pts).',
    noticeDef: 'Notice: Advisory verification reminder or styling improvement (-2 pts).',
    rulesTitle: 'Rules Being Checked',
    remedyTitle: 'Remediation Features',
    remedyDesc: 'Click Jump to Element to highlight text on your canvas. Use Apply Fix to instantly execute automated WCAG AA adjustments.',
    gotItBtn: 'Got It'
  },
  es: {
    appTitle: 'Verificador de Accesibilidad',
    googleWorkspace: 'Google Workspace',
    helpBtn: 'Ayuda',
    settingsBtn: 'Ajustes',
    wcagScore: 'Puntuación WCAG 2.1 AA',
    errors: 'Errores',
    warnings: 'Advertencias',
    notices: 'Avisos',
    all: 'Todos',
    rescanBtn: 'Escanear Documento',
    scanning: 'Escaneando archivo activo para reglas WCAG 2.1 AA...',
    readingOrderModalBtn: 'Orden de Lectura (Diapositivas)',
    allClearTitle: '¡Todo Correcto!',
    allClearDesc: 'No se detectaron infracciones de accesibilidad WCAG 2.1 AA.',
    interactiveContrast: 'Vista Previa de Contraste',
    currentLabel: 'Actual',
    suggestionLabel: 'Sugerencia',
    jumpBtn: 'Ir al Elemento',
    applyFixBtn: 'Aplicar Solución',
    readingOrderTitle: 'Editor de Orden de Lectura',
    readingOrderDesc: 'Organice los elementos desde arriba (leídos primero por lectores de pantalla) hacia abajo (leídos al final). WCAG 1.3.2.',
    applyOrderBtn: 'Guardar Orden',
    cancelBtn: 'Cancelar',
    loadingElements: 'Cargando elementos...',
    preferencesTitle: 'Preferencias',
    contrastModeLabel: 'Modo de Corrección de Contraste',
    contrastModeDesc: 'Elige cómo los ajustes automáticos calculan colores accesibles.',
    preserveHsl: 'Preservar Tono HSL (Recomendado)',
    preserveHslDesc: 'Oscurece la luminosidad manteniendo el tono de la marca.',
    snapMaterial: 'Paleta Google Material',
    snapMaterialDesc: 'Ajusta al tono accesible más cercano de Google Grey/Blue.',
    autoFixLabel: 'Corrección Automática al Escanear',
    autoFixDesc: 'Aplica correcciones de un clic automáticamente al escanear.',
    languageLabel: 'Idioma de la Interfaz',
    languageDesc: 'Selecciona tu idioma preferido para todas las herramientas.',
    langAuto: 'Automático (Preferencia de Google Workspace)',
    saveBtn: 'Guardar Preferencias',
    helpTitle: 'Guía y Ayuda WCAG 2.1 AA',
    overviewTitle: 'Descripción General',
    overviewDesc: 'Este complemento escanea Google Docs y Slides en busca de barreras de accesibilidad bajo el estándar WCAG 2.1 AA.',
    severityTitle: 'Definiciones de Gravedad',
    errorDef: 'Error: Infracción crítica que impide percibir el contenido esencial (-15 pts).',
    warningDef: 'Advertencia: Práctica estructural que genera barreras importantes (-5 pts).',
    noticeDef: 'Aviso: Recordatorio o recomendación estilística (-2 pts).',
    rulesTitle: 'Reglas Verificadas',
    remedyTitle: 'Funciones de Remediación',
    remedyDesc: 'Haz clic en Ir al Elemento para resaltar el texto en tu lienzo. Usa Aplicar Solución para correcciones instantáneas.',
    gotItBtn: 'Entendido'
  },
  fr: {
    appTitle: 'Vérificateur d\'Accessibilité',
    googleWorkspace: 'Google Workspace',
    helpBtn: 'Aide',
    settingsBtn: 'Paramètres',
    wcagScore: 'Score WCAG 2.1 AA',
    errors: 'Erreurs',
    warnings: 'Avertissements',
    notices: 'Remarques',
    all: 'Tout',
    rescanBtn: 'Analyser le document',
    scanning: 'Analyse du fichier actif selon les normes WCAG 2.1 AA...',
    readingOrderModalBtn: 'Ordre de lecture',
    allClearTitle: 'Aucun problème !',
    allClearDesc: 'Aucune violation d\'accessibilité WCAG 2.1 AA détectée.',
    interactiveContrast: 'Aperçu du Contraste',
    currentLabel: 'Actuel',
    suggestionLabel: 'Suggestion',
    jumpBtn: 'Atteindre l\'élément',
    applyFixBtn: 'Corriger automatiquement',
    readingOrderTitle: 'Éditeur d\'ordre de lecture',
    readingOrderDesc: 'Organisez les éléments de haut (lus en premier) en bas (lus en dernier). WCAG 1.3.2.',
    applyOrderBtn: 'Appliquer l\'ordre',
    cancelBtn: 'Annuler',
    loadingElements: 'Chargement des éléments...',
    preferencesTitle: 'Préférences',
    contrastModeLabel: 'Mode de correction du contraste',
    contrastModeDesc: 'Choisissez comment calculer les couleurs conformes.',
    preserveHsl: 'Conserver la teinte HSL (Recommandé)',
    preserveHslDesc: 'Assombrit la luminosité en conservant la couleur de marque.',
    snapMaterial: 'Palette Google Material',
    snapMaterialDesc: 'Ajuste vers la nuance accessible la plus proche.',
    autoFixLabel: 'Correction automatique lors de l\'analyse',
    autoFixDesc: 'Applique automatiquement les correctifs simples en un clic.',
    languageLabel: 'Langue de l\'interface',
    languageDesc: 'Choisissez votre langue d\'affichage préférée.',
    langAuto: 'Automatique (Google Workspace)',
    saveBtn: 'Enregistrer les préférences',
    helpTitle: 'Aide & Normes WCAG 2.1 AA',
    overviewTitle: 'Aperçu',
    overviewDesc: 'Cette extension analyse vos documents Google Docs et Slides pour garantir leur conformité WCAG 2.1 AA.',
    severityTitle: 'Niveaux de gravité',
    errorDef: 'Erreur : Violation critique empêchant l\'accès au contenu (-15 pts).',
    warningDef: 'Avertissement : Problème structurel majeur (-5 pts).',
    noticeDef: 'Remarque : Suggestion d\'amélioration ou rappel de vérification (-2 pts).',
    rulesTitle: 'Règles vérifiées',
    remedyTitle: 'Outils de correction',
    remedyDesc: 'Utilisez Atteindre l\'élément pour localiser le problème et Corriger pour appliquer un correctif immédiat.',
    gotItBtn: 'Compris'
  },
  de: {
    appTitle: 'Barrierefreiheitsprüfung',
    googleWorkspace: 'Google Workspace',
    helpBtn: 'Hilfe',
    settingsBtn: 'Einstellungen',
    wcagScore: 'WCAG 2.1 AA Ergebnis',
    errors: 'Fehler',
    warnings: 'Warnungen',
    notices: 'Hinweise',
    all: 'Alle',
    rescanBtn: 'Dokument prüfen',
    scanning: 'Aktives Dokument wird auf WCAG 2.1 AA Richtlinien geprüft...',
    readingOrderModalBtn: 'Lesereihenfolge',
    allClearTitle: 'Alles in Ordnung!',
    allClearDesc: 'Keine WCAG 2.1 AA Barrieren gefunden.',
    interactiveContrast: 'Kontrast-Vorschau',
    currentLabel: 'Aktuell',
    suggestionLabel: 'Vorschlag',
    jumpBtn: 'Zum Element springen',
    applyFixBtn: 'Fehler beheben',
    readingOrderTitle: 'Editor für Lesereihenfolge',
    readingOrderDesc: 'Ordnen Sie Folienelemente von oben (zuerst gelesen) nach unten (zuletzt gelesen). WCAG 1.3.2.',
    applyOrderBtn: 'Reihenfolge speichern',
    cancelBtn: 'Abbrechen',
    loadingElements: 'Elemente laden...',
    preferencesTitle: 'Einstellungen',
    contrastModeLabel: 'Kontrast-Korrekturmodus',
    contrastModeDesc: 'Wählen Sie, wie barrierefreie Farben berechnet werden.',
    preserveHsl: 'HSL-Farbton beibehalten (Empfohlen)',
    preserveHslDesc: 'Verdunkelt die Helligkeit bei gleichem Farbton.',
    snapMaterial: 'Google Material Palette',
    snapMaterialDesc: 'Wechselt zum nächsten konformen Google-Farbton.',
    autoFixLabel: 'Automatische Korrektur beim Scannen',
    autoFixDesc: 'Behebt einfache Barrieren automatisch.',
    languageLabel: 'Sprache der Benutzeroberfläche',
    languageDesc: 'Wählen Sie Ihre bevorzugte Anzeigesprache.',
    langAuto: 'Automatisch (Google Workspace)',
    saveBtn: 'Einstellungen speichern',
    helpTitle: 'WCAG 2.1 AA Hilfe',
    overviewTitle: 'Übersicht',
    overviewDesc: 'Dieses Add-on prüft Google Docs und Slides auf Barrierefreiheit nach WCAG 2.1 AA.',
    severityTitle: 'Definition der Schweregrade',
    errorDef: 'Fehler: Kritische Barriere, die das Lesen verhindert (-15 Pkt).',
    warningDef: 'Warnung: Strukturelles Problem oder schwere Hürde (-5 Pkt).',
    noticeDef: 'Hinweis: Empfehlung oder optischer Verbesserungsvorschlag (-2 Pkt).',
    rulesTitle: 'Geprüfte Richtlinien',
    remedyTitle: 'Korrekturfunktionen',
    remedyDesc: 'Klicken Sie auf Zum Element springen zur Markierung und Fehler beheben für die automatische Korrektur.',
    gotItBtn: 'Verstanden'
  },
  ja: {
    appTitle: 'アクセシビリティ・チェッカー',
    googleWorkspace: 'Google Workspace',
    helpBtn: 'ヘルプ',
    settingsBtn: '設定',
    wcagScore: 'WCAG 2.1 AA スコア',
    errors: 'エラー',
    warnings: '警告',
    notices: '通知',
    all: 'すべて',
    rescanBtn: 'ドキュメントを再スキャン',
    scanning: 'アクティブなファイルを WCAG 2.1 AA 基準でスキャン中...',
    readingOrderModalBtn: '読み上げ順序エディタ',
    allClearTitle: '問題はありません！',
    allClearDesc: 'WCAG 2.1 AA アクセシビリティ違反は見つかりませんでした。',
    interactiveContrast: 'インタラクティブ・コントラスト・プレビュー',
    currentLabel: '現在の色',
    suggestionLabel: '推奨色',
    jumpBtn: '対象箇所へ移動',
    applyFixBtn: '修正を適用',
    readingOrderTitle: 'スライド読み上げ順序エディタ',
    readingOrderDesc: 'スライドの要素を上（最初に読み上げ）から下（最後に読み上げ）へ順序付けます（WCAG 1.3.2）。',
    applyOrderBtn: '順序を保存',
    cancelBtn: 'キャンセル',
    loadingElements: '要素を読み込み中...',
    preferencesTitle: '環境設定',
    contrastModeLabel: 'コントラスト自動修正モード',
    contrastModeDesc: 'コントラスト修正時に準拠色を算出する方法を選択します。',
    preserveHsl: 'ブランド色相(HSL)を維持 (推奨)',
    preserveHslDesc: '色相を保ったまま輝度を調整し、4.5:1 を達成します。',
    snapMaterial: 'Google Material パレットにスナップ',
    snapMaterialDesc: '最も近い準拠済みの Google カラーシェードにスナップします。',
    autoFixLabel: 'スキャン時にワンクリック修正を自動適用',
    autoFixDesc: 'スキャン実行時に自動修復可能な項目を即時修正します（デフォルト：オフ）。',
    languageLabel: '表示言語 (Interface Language)',
    languageDesc: 'ツールおよびレポート全体の言語を選択してください。',
    langAuto: '自動 (Google Workspace の言語設定)',
    saveBtn: '設定を保存',
    helpTitle: 'WCAG 2.1 AA ガイドとヘルプ',
    overviewTitle: '概要',
    overviewDesc: 'このアドオンは、Google ドキュメントおよびスライドを WCAG 2.1 AA 基準に照らし合わせて自動検証します。',
    severityTitle: '重要度レベルの定義',
    errorDef: 'エラー: スクリーンリーダーユーザー等のコンテンツ理解を妨げる致命的な違反 (-15点)。',
    warningDef: '警告: 重大なアクセシビリティ上の障壁となる構造的問題 (-5点)。',
    noticeDef: '通知: 最適な可読性や推奨事項に関するリマインダー (-2点)。',
    rulesTitle: '検証ルール一覧',
    remedyTitle: '自動修復機能について',
    remedyDesc: '「対象箇所へ移動」でドキュメント内の該当位置をハイライトし、「修正を適用」で即座に自動修正を実行できます。',
    gotItBtn: 'OK'
  }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private langSubject = new BehaviorSubject<string>('en');
  readonly lang$ = this.langSubject.asObservable();

  private activeLang = 'en';

  setLanguage(pref: string, workspaceLocale?: string): void {
    if (!pref || pref === 'AUTO') {
      const loc = (workspaceLocale || 'en').toLowerCase().substring(0, 2);
      this.activeLang = DICTIONARIES[loc] ? loc : 'en';
    } else {
      this.activeLang = DICTIONARIES[pref] ? pref : 'en';
    }
    this.langSubject.next(this.activeLang);
  }

  t(key: string): string {
    const dict = DICTIONARIES[this.activeLang] || DICTIONARIES['en'];
    return dict[key] || DICTIONARIES['en'][key] || key;
  }

  getCurrentLang(): string {
    return this.activeLang;
  }
}
