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
import { Issue } from '../../services/accessibility.service';
import { I18nService } from '../../services/i18n.service';
import { LiteRtService } from '../../services/litert.service';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="issue-list-container" role="region" aria-label="Detected Accessibility Issues">
      <div *ngIf="issues.length === 0" class="success-card" role="status">
        <div class="success-icon">✓</div>
        <div class="success-text">
          <h3>{{ i18n.t('allClearTitle') }}</h3>
          <p>{{ i18n.t('allClearDesc') }}</p>
        </div>
      </div>

      <div *ngFor="let issue of issues" class="issue-card" [class]="issue.severity.toLowerCase()">
        <div class="card-header">
          <div class="badges">
            <span class="severity-badge">{{ issue.severity }}</span>
            <span class="wcag-badge" *ngIf="issue.wcagRule">{{ issue.wcagRule }}</span>
          </div>
          <span class="element-chip">{{ issue.elementType }}</span>
        </div>
        
        <h3 class="issue-title">{{ issue.title }}</h3>
        <p class="issue-desc">{{ issue.description }}</p>
        
        <div class="snippet-box" *ngIf="issue.snippet">
          <code>{{ issue.snippet }}</code>
        </div>

        <!-- Color Contrast Swatch Preview -->
        <div *ngIf="issue.issueType === 'Color Contrast' && issue.fixMetadata" class="contrast-swatch-box">
          <div class="swatch-header">{{ i18n.t('interactiveContrast') }}</div>
          <div class="swatch-row">
            <div class="swatch current" [style.color]="issue.fixMetadata.currentHex" [style.background-color]="'#FFFFFF'">
              <span class="swatch-label">{{ i18n.t('currentLabel') }}</span>
              <strong>{{ issue.fixMetadata.currentHex }}</strong>
            </div>
            <div class="swatch suggested" [style.color]="issue.fixMetadata.suggestedHex" [style.background-color]="'#FFFFFF'">
              <span class="swatch-label">{{ i18n.t('suggestionLabel') }}</span>
              <strong>{{ issue.fixMetadata.suggestedHex }}</strong>
            </div>
          </div>
        </div>

        <!-- LiteRT.js AI Alt Text Generator Box -->
        <div *ngIf="issue.issueType === 'Alternative Text'" class="litert-box">
          <div class="litert-header">
            <span class="litert-badge">✨ LiteRT.js On-Device AI</span>
            <button type="button" class="litert-gen-btn" (click)="generateAiAltText(issue)">
              {{ altTextSuggestions[issue.elementId] ? 'Re-generate' : 'Generate Alt Text with LiteRT.js' }}
            </button>
          </div>

          <div *ngIf="altTextSuggestions[issue.elementId] !== undefined" class="litert-suggestion">
            <label class="litert-label">Suggested Alt Text Description:</label>
            <input type="text" class="litert-input" [(ngModel)]="altTextSuggestions[issue.elementId]" placeholder="Describe the image context..." />
          </div>
        </div>

        <div class="card-actions">
          <button type="button" class="outlined-btn" (click)="select.emit(issue.elementId)" [attr.aria-label]="'Jump to element for ' + issue.title">
            {{ i18n.t('jumpBtn') }}
          </button>
          <button *ngIf="issue.canAutoFix" type="button" class="primary" (click)="onApplyFix(issue)" [attr.aria-label]="'Apply automatic fix for ' + issue.title">
            {{ i18n.t('applyFixBtn') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .issue-list-container { display: flex; flex-direction: column; gap: 12px; }
    .success-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: #e6f4ea; border: 1px solid #ceead6; border-radius: 8px; }
    .success-icon { width: 36px; height: 36px; background: #188038; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
    .success-text h3 { margin: 0; font-size: 14px; font-weight: 500; color: #0d652d; }
    .success-text p { margin: 2px 0 0 0; font-size: 12px; color: #137333; }

    .issue-card { border: 1px solid #dadce0; border-left: 4px solid #dadce0; border-radius: 8px; padding: 14px; background: #ffffff; transition: box-shadow 0.2s ease; }
    .issue-card:hover { box-shadow: 0 1px 3px 1px rgba(60, 64, 67, 0.15); }
    .issue-card.error { border-left-color: #d93025; }
    .issue-card.warning { border-left-color: #e37400; }
    .issue-card.notice { border-left-color: #1a73e8; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .badges { display: flex; align-items: center; gap: 6px; }
    .severity-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.3px; }
    .error .severity-badge { background: #fce8e6; color: #c5221f; }
    .warning .severity-badge { background: #fef7e0; color: #b06000; }
    .notice .severity-badge { background: #e8f0fe; color: #1967d2; }

    .wcag-badge { font-size: 11px; font-weight: 500; color: #1a73e8; background: #f8fafd; border: 1px solid #d2e3fc; padding: 1px 8px; border-radius: 12px; }
    .element-chip { font-size: 11px; color: #5f6368; background: #f1f3f4; padding: 2px 8px; border-radius: 4px; font-weight: 500; }

    .issue-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 14px; font-weight: 500; margin: 0 0 6px 0; color: #202124; }
    .issue-desc { font-size: 12px; color: #3c4043; margin: 0 0 10px 0; line-height: 1.5; }
    .snippet-box { background: #f8f9fa; border: 1px solid #e8eaed; padding: 8px 10px; border-radius: 4px; font-size: 11px; margin-bottom: 12px; word-break: break-all; color: #202124; font-family: 'Roboto Mono', monospace; }
    .contrast-swatch-box { background: #f8fafd; border: 1px solid #d2e3fc; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
    .swatch-header { font-size: 11px; font-weight: 500; margin-bottom: 8px; color: #1a73e8; }
    .swatch-row { display: flex; gap: 10px; }
    .swatch { flex: 1; padding: 8px; border-radius: 4px; border: 1px solid #dadce0; text-align: center; background: #ffffff; }
    .swatch-label { display: block; font-size: 10px; color: #5f6368; }
    .swatch strong { font-size: 13px; font-weight: 700; }

    .litert-box {
      background: #f8fafd;
      border: 1px solid #d2e3fc;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .litert-header { display: flex; justify-content: space-between; align-items: center; }
    .litert-badge { font-size: 11px; font-weight: 500; color: #1a73e8; }
    button.litert-gen-btn {
      height: 26px;
      padding: 0 10px;
      font-size: 11px;
      border-radius: 13px;
      background: #e8f0fe;
      border: 1px solid #1a73e8;
      color: #1a73e8;
    }
    button.litert-gen-btn:hover { background: #d2e3fc; }
    .litert-suggestion { display: flex; flex-direction: column; gap: 4px; }
    .litert-label { font-size: 10px; font-weight: 500; color: #5f6368; }
    .litert-input {
      padding: 6px 10px;
      border: 1px solid #dadce0;
      border-radius: 4px;
      font-size: 12px;
      color: #202124;
      background: #ffffff;
      width: 100%;
    }

    .card-actions { display: flex; gap: 8px; justify-content: flex-end; }
    button.outlined-btn { background: #ffffff; border: 1px solid #dadce0; color: #1a73e8; }
    button.outlined-btn:hover { background: #f8fafd; border-color: #1a73e8; }
  `]
})
export class IssueListComponent {
  @Input() issues: Issue[] = [];
  @Output() select = new EventEmitter<string>();
  @Output() fix = new EventEmitter<{ issue: Issue; value?: string }>();

  altTextSuggestions: Record<string, string> = {};

  constructor(public i18n: I18nService, private liteRt: LiteRtService) {}

  async generateAiAltText(issue: Issue): Promise<void> {
    const currentAlt = issue.fixMetadata?.currentAlt || '';
    const caption = await this.liteRt.generateAltTextForElement(issue.elementId, currentAlt);
    this.altTextSuggestions[issue.elementId] = caption;
  }

  onApplyFix(issue: Issue): void {
    if (issue.issueType === 'Alternative Text') {
      const suggested = this.altTextSuggestions[issue.elementId] || issue.fixMetadata?.suggestedCleanAlt || 'Visual element graphic';
      this.fix.emit({ issue, value: suggested });
    } else {
      this.fix.emit({ issue, value: issue.fixMetadata?.suggestedHex || issue.fixMetadata?.suggestedHeadingLevel });
    }
  }
}
