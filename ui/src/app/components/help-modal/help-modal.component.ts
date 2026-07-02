import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class="modal-card">
        <div class="modal-header">
          <h2 id="help-title">{{ i18n.t('helpTitle') }}</h2>
          <button type="button" class="close-btn" (click)="close.emit()" aria-label="Close help modal">✕</button>
        </div>

        <div class="help-body">
          <section class="help-section">
            <h3>{{ i18n.t('overviewTitle') }}</h3>
            <p>{{ i18n.t('overviewDesc') }}</p>
          </section>

          <section class="help-section">
            <h3>{{ i18n.t('severityTitle') }}</h3>
            <ul>
              <li><strong>{{ i18n.t('errorDef') }}</strong></li>
              <li><strong>{{ i18n.t('warningDef') }}</strong></li>
              <li><strong>{{ i18n.t('noticeDef') }}</strong></li>
            </ul>
          </section>

          <section class="help-section">
            <h3>{{ i18n.t('rulesTitle') }}</h3>
            <ul>
              <li><strong>WCAG 1.4.3 Contrast (Minimum):</strong> 4.5:1 ratio against background fills.</li>
              <li><strong>WCAG 1.3.1 Info and Relationships:</strong> Clear cascading heading hierarchies (H1 -> H2 -> H3).</li>
              <li><strong>WCAG 2.4.4 Link Purpose (In Context):</strong> Meaningful anchor text describing destinations.</li>
              <li><strong>WCAG 1.1.1 Non-text Content:</strong> Descriptive alternative text for images and diagrams.</li>
              <li><strong>WCAG 1.4.8 Visual Presentation:</strong> Left-aligned text without justified spacing rivers.</li>
              <li><strong>WCAG 1.4.12 Text Spacing:</strong> Standard vertical paragraph line spacing (>= 1.15x).</li>
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
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(32, 33, 36, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-card {
      background: #ffffff; border-radius: 8px; width: 90%; max-width: 460px; max-height: 85vh;
      display: flex; flex-direction: column; box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e8eaed; }
    .modal-header h2 { margin: 0; font-size: 16px; font-weight: 500; color: #202124; }
    .close-btn { border: none; background: none; font-size: 16px; color: #5f6368; }
    .help-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
    .help-section h3 { font-size: 13px; font-weight: 500; margin: 0 0 6px 0; color: #202124; }
    .help-section p, .help-section ul { font-size: 12px; color: #5f6368; margin: 0; line-height: 1.5; }
    .help-section ul { padding-left: 18px; }
    .help-section li { margin-bottom: 6px; }
    .modal-footer { display: flex; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid #e8eaed; }
  `]
})
export class HelpModalComponent {
  @Output() close = new EventEmitter<void>();
  constructor(public i18n: I18nService) {}
}
