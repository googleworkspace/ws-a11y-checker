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

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Settings } from '../../services/accessibility.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" [attr.aria-labelledby]="'settings-title'">
      <div class="google-modal">
        <div class="modal-header">
          <h2 id="settings-title">{{ i18n.t('preferencesTitle') }}</h2>
          <button type="button" class="icon-close" (click)="close.emit()" aria-label="Close preferences modal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Language Selector -->
          <div class="setting-group">
            <label class="setting-title" id="lang-label">{{ i18n.t('languageLabel') }}</label>
            <p class="setting-desc">{{ i18n.t('languageDesc') }}</p>
            <select class="google-select" [(ngModel)]="localSettings.language">
              <option value="AUTO">{{ i18n.t('langAuto') }}</option>
              <option value="en">English (en)</option>
              <option value="es">Español (es)</option>
              <option value="fr">Français (fr)</option>
              <option value="de">Deutsch (de)</option>
              <option value="ja">日本語 (ja)</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-title" id="contrast-mode-label">{{ i18n.t('contrastModeLabel') }}</label>
            <p class="setting-desc">{{ i18n.t('contrastModeDesc') }}</p>
            <div class="radio-options" role="radiogroup" aria-labelledby="contrast-mode-label">
              <label class="radio-item">
                <input type="radio" name="contrastMode" [(ngModel)]="localSettings.contrastFixMode" value="PRESERVE_HSL">
                <div class="radio-label">
                  <strong>{{ i18n.t('preserveHsl') }}</strong>
                  <span>{{ i18n.t('preserveHslDesc') }}</span>
                </div>
              </label>
              <label class="radio-item">
                <input type="radio" name="contrastMode" [(ngModel)]="localSettings.contrastFixMode" value="SNAP_MATERIAL">
                <div class="radio-label">
                  <strong>{{ i18n.t('snapMaterial') }}</strong>
                  <span>{{ i18n.t('snapMaterialDesc') }}</span>
                </div>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-item">
              <input type="checkbox" [(ngModel)]="localSettings.enableAutoRemediation">
              <div class="checkbox-label">
                <strong>{{ i18n.t('autoFixLabel') }}</strong>
                <span>{{ i18n.t('autoFixDesc') }}</span>
              </div>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="outlined" (click)="close.emit()">{{ i18n.t('cancelBtn') }}</button>
          <button type="button" class="primary" (click)="onSave()">{{ i18n.t('saveBtn') }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(32, 33, 36, 0.4);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .google-modal {
      background: #ffffff; border-radius: 8px; width: 92%; max-width: 440px;
      display: flex; flex-direction: column; max-height: 90vh;
      box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 1px solid #e8eaed;
    }
    .modal-header h2 { font-size: 16px; font-weight: 500; color: #202124; margin: 0; }
    .icon-close { background: none; border: none; font-size: 16px; color: #5f6368; padding: 4px; }
    .modal-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
    .setting-group { display: flex; flex-direction: column; gap: 6px; }
    .setting-title { font-size: 13px; font-weight: 500; color: #202124; }
    .setting-desc { font-size: 12px; color: #5f6368; margin: 0 0 4px 0; }
    .google-select, .google-input {
      padding: 6px 12px; border: 1px solid #dadce0; border-radius: 4px;
      font-size: 13px; color: #202124; background: #ffffff; width: 100%;
      box-sizing: border-box;
    }
    .radio-options { display: flex; flex-direction: column; gap: 12px; }
    .radio-item, .checkbox-item { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
    .radio-item input, .checkbox-item input { margin-top: 3px; accent-color: #1a73e8; }
    .radio-label strong, .checkbox-label strong { display: block; font-size: 13px; font-weight: 500; color: #202124; }
    .radio-label span, .checkbox-label span { display: block; font-size: 11px; color: #5f6368; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid #e8eaed; }
  `]
})
export class SettingsPanelComponent {
  @Input() settings: Settings = { contrastFixMode: 'PRESERVE_HSL', enableAutoRemediation: false, language: 'AUTO' };
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Settings>();

  localSettings: Settings = { ...this.settings };

  constructor(public i18n: I18nService) {}

  ngOnChanges(): void {
    this.localSettings = { ...this.settings };
  }

  onSave(): void {
    this.save.emit(this.localSettings);
    this.close.emit();
  }
}
