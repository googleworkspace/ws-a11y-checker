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

import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title" [attr.dir]="i18n.dir()">
      <div class="modal-card">
        <div class="modal-header">
          <h2 id="help-title"><bdi>{{ i18n.t('helpTitle') }}</bdi></h2>
          <button type="button" class="close-btn" (click)="close.emit()" [attr.aria-label]="i18n.t('closeHelpAriaLabel')">✕</button>
        </div>

        <div class="help-body">
          <section class="help-section">
            <h3>{{ i18n.t('overviewTitle') }}</h3>
            <p>{{ i18n.t('overviewDesc') }}</p>
          </section>

          <section class="help-section">
            <h3>{{ i18n.t('severityTitle') }}</h3>
            <ul>
              <li><strong><bdi>{{ i18n.t('errorDef') }}</bdi></strong></li>
              <li><strong><bdi>{{ i18n.t('warningDef') }}</bdi></strong></li>
              <li><strong><bdi>{{ i18n.t('noticeDef') }}</bdi></strong></li>
            </ul>
          </section>

          <section class="help-section">
            <h3>{{ i18n.t('rulesTitle') }}</h3>
            <ul>
              <li><bdi>{{ i18n.t('ruleContrast') }}</bdi></li>
              <li><bdi>{{ i18n.t('ruleHeading') }}</bdi></li>
              <li><bdi>{{ i18n.t('ruleLink') }}</bdi></li>
              <li><bdi>{{ i18n.t('ruleAlt') }}</bdi></li>
              <li><bdi>{{ i18n.t('ruleAlign') }}</bdi></li>
              <li><bdi>{{ i18n.t('ruleSpacing') }}</bdi></li>
            </ul>
          </section>

          <section class="help-section">
            <h3>{{ i18n.t('remedyTitle') }}</h3>
            <p>{{ i18n.t('remedyDesc') }}</p>
          </section>
        </div>

        <div class="modal-footer">
          <button type="button" class="primary" (click)="close.emit()">{{ i18n.t('gotItBtn') }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(32, 33, 36, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-card {
      background: #ffffff; border-radius: 8px; width: 90%; max-width: 460px; max-height: 85vh;
      display: flex; flex-direction: column; box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding-block: 16px; padding-inline: 20px; border-block-end: 1px solid #e8eaed; }
    .modal-header h2 { margin: 0; font-size: 16px; font-weight: 500; color: #202124; }
    .close-btn { border: none; background: none; font-size: 16px; color: #5f6368; }
    .help-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
    .help-section h3 { font-size: 13px; font-weight: 500; margin: 0; margin-block-end: 6px; color: #202124; }
    .help-section p, .help-section ul { font-size: 12px; color: #5f6368; margin: 0; line-height: 1.5; }
    .help-section ul { padding-inline-start: 18px; padding-inline-end: 0; }
    .help-section li { margin-block-end: 6px; }
    .modal-footer { display: flex; justify-content: flex-end; padding-block: 14px; padding-inline: 20px; border-block-start: 1px solid #e8eaed; }

    .help-section li, .help-section li bdi, .help-section li strong {
      unicode-bidi: isolate;
    }
  `]
})
export class HelpModalComponent {
  @Output() close = new EventEmitter<void>();
  constructor(public i18n: I18nService) {}
}
