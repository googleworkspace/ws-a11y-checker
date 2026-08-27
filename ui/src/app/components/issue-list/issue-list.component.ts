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
    <div class="issue-list-container" role="region" [attr.aria-label]="i18n.t('detectedIssuesRegion')">
      <div *ngIf="fixableCount > 1" class="fix-all-banner" role="region" [attr.aria-label]="i18n.t('bulkRemediationRegion')">
        <div class="banner-text">
          <strong>⚡ {{ i18n.t('bulkRemediableHeading', { count: fixableCount }) }}</strong>
          <span>{{ i18n.t('bulkRemediableDesc') }}</span>
        </div>
        <button type="button" class="fix-all-btn" (click)="onFixAll()">
          {{ i18n.t('fixAllBtn') }} (<bdi>{{ fixableCount }}</bdi>)
        </button>
      </div>

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
            <span class="severity-badge"><bdi>{{ issue.severity }}</bdi></span>
            <span class="wcag-badge" *ngIf="issue.wcagRule"><bdi>{{ issue.wcagRule }}</bdi></span>
          </div>
          <span class="element-chip"><bdi>{{ issue.elementType }}</bdi></span>
        </div>
        
        <h3 class="issue-title">{{ issue.title }}</h3>
        <p class="issue-desc">{{ issue.description }}</p>
        
        <div class="snippet-box" *ngIf="issue.snippet">
          <code dir="ltr"><bdi>{{ issue.snippet }}</bdi></code>
        </div>

        <!-- Color Contrast Swatch Preview -->
        <div *ngIf="issue.issueType === 'Color Contrast' && issue.fixMetadata" class="contrast-swatch-box">
          <div class="swatch-header">{{ i18n.t('interactiveContrast') }}</div>
          <div class="swatch-row">
            <div class="swatch current" [style.color]="issue.fixMetadata.currentHex" [style.background-color]="'#FFFFFF'">
              <span class="swatch-label">{{ i18n.t('currentLabel') }}</span>
              <strong><bdi>{{ issue.fixMetadata.currentHex }}</bdi></strong>
            </div>
            <div class="swatch suggested" [style.color]="issue.fixMetadata.suggestedHex" [style.background-color]="'#FFFFFF'">
              <span class="swatch-label">{{ i18n.t('suggestionLabel') }}</span>
              <strong><bdi>{{ issue.fixMetadata.suggestedHex }}</bdi></strong>
            </div>
          </div>
        </div>

        <!-- Manual Alt Text Input Box -->
        <div *ngIf="issue.issueType === 'Alternative Text'" class="manual-fix-box">
          <div class="manual-fix-header">
            <span class="manual-fix-label">{{ i18n.t('altTextLabel') }}</span>
            <button type="button" class="decorative-btn" [class.active]="isDecorative(issue.elementId)" (click)="setDecorative(issue)">
              🎨 {{ isDecorative(issue.elementId) ? i18n.t('decorativeActive') : i18n.t('markDecorative') }}
            </button>
          </div>
          <input
            type="text"
            class="manual-input"
            [(ngModel)]="altTextSuggestions[issue.elementId]"
            [attr.placeholder]="i18n.t('altTextPlaceholder')"
          />
        </div>

        <!-- Manual Link Title Input Box -->
        <div *ngIf="issue.issueType === 'Meaningful Hyperlinks'" class="manual-fix-box">
          <div class="manual-fix-header">
            <span class="manual-fix-label">{{ i18n.t('replacementLinkLabel') }}</span>
            <button *ngIf="linkTitleSuggestions[issue.elementId] === undefined" type="button" class="decorative-btn" (click)="suggestLinkTitle(issue)">
              {{ i18n.t('suggestTextBtn') }}
            </button>
          </div>
          <input
            type="text"
            class="manual-input"
            [(ngModel)]="linkTitleSuggestions[issue.elementId]"
            [attr.placeholder]="i18n.t('replacementLinkPlaceholder')"
          />
        </div>

        <div class="card-actions">
          <button type="button" class="outlined-btn" (click)="select.emit(issue.elementId)" [attr.aria-label]="i18n.t('jumpBtnAriaLabel', { title: issue.title })">
            {{ i18n.t('jumpBtn') }}
          </button>
          <button *ngIf="issue.canAutoFix" type="button" class="primary" (click)="onApplyFix(issue)" [attr.aria-label]="i18n.t('applyFixAriaLabel', { title: issue.title })">
            {{ i18n.t('applyFixBtn') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .issue-list-container { display: flex; flex-direction: column; gap: 12px; }
    .fix-all-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 14px; background: #e8f0fe; border: 1px solid #d2e3fc; border-radius: 8px;
    }
    .banner-text strong { display: block; font-size: 13px; color: #1a73e8; font-weight: 700; }
    .banner-text span { font-size: 11px; color: #3c4043; }
    button.fix-all-btn {
      background: #188038; border: 1px solid #188038; color: #fff;
      font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 4px;
      cursor: pointer; white-space: nowrap;
    }
    button.fix-all-btn:hover { background: #137333; }
    .success-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: #e6f4ea; border: 1px solid #ceead6; border-radius: 8px; }
    .success-icon { width: 36px; height: 36px; background: #188038; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
    .success-text h3 { margin: 0; font-size: 14px; font-weight: 500; color: #0d652d; }
    .success-text p { margin: 2px 0 0 0; font-size: 12px; color: #137333; }

    .issue-card { border: 1px solid #dadce0; border-inline-start: 4px solid #dadce0; border-radius: 8px; padding: 14px; background: #ffffff; transition: box-shadow 0.2s ease; }
    .issue-card:hover { box-shadow: 0 1px 3px 1px rgba(60, 64, 67, 0.15); }
    .issue-card.error { border-inline-start-color: #d93025; }
    .issue-card.warning { border-inline-start-color: #e37400; }
    .issue-card.notice { border-inline-start-color: #1a73e8; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-block-end: 8px; }
    .badges { display: flex; align-items: center; gap: 6px; }
    .severity-badge { font-size: 10px; font-weight: 700; padding-block: 2px; padding-inline: 8px; border-radius: 12px; letter-spacing: 0.3px; }
    .error .severity-badge { background: #fce8e6; color: #c5221f; }
    .warning .severity-badge { background: #fef7e0; color: #b06000; }
    .notice .severity-badge { background: #e8f0fe; color: #1967d2; }

    .wcag-badge { font-size: 11px; font-weight: 500; color: #1a73e8; background: #f8fafd; border: 1px solid #d2e3fc; padding-block: 1px; padding-inline: 8px; border-radius: 12px; }
    .element-chip { font-size: 11px; color: #5f6368; background: #f1f3f4; padding-block: 2px; padding-inline: 8px; border-radius: 4px; font-weight: 500; }

    .issue-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 14px; font-weight: 500; margin: 0 0 6px 0; color: #202124; }
    .issue-desc { font-size: 12px; color: #3c4043; margin: 0 0 10px 0; line-height: 1.5; }
    .snippet-box { background: #f8f9fa; border: 1px solid #e8eaed; padding-block: 8px; padding-inline: 10px; border-radius: 4px; font-size: 11px; margin-block-end: 12px; word-break: break-all; color: #202124; font-family: 'Roboto Mono', monospace; }
    .contrast-swatch-box { background: #f8fafd; border: 1px solid #d2e3fc; border-radius: 6px; padding: 10px; margin-block-end: 12px; }
    .swatch-header { font-size: 11px; font-weight: 500; margin-block-end: 8px; color: #1a73e8; }
    .swatch-row { display: flex; gap: 10px; }
    .swatch { flex: 1; padding: 8px; border-radius: 4px; border: 1px solid #dadce0; text-align: center; background: #ffffff; }
    .swatch-label { display: block; font-size: 10px; color: #5f6368; }
    .swatch strong { font-size: 13px; font-weight: 700; }

    .manual-fix-box {
      background: #f8fafd;
      border: 1px solid #d2e3fc;
      border-radius: 6px;
      padding: 10px;
      margin-block-end: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .manual-fix-header { display: flex; justify-content: space-between; align-items: center; }
    .manual-fix-label { font-size: 11px; font-weight: 500; color: #1a73e8; }
    button.decorative-btn {
      height: 24px;
      padding-block: 0;
      padding-inline: 8px;
      font-size: 11px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #dadce0;
      color: #3c4043;
      cursor: pointer;
    }
    button.decorative-btn:hover { background: #f1f3f4; }
    button.decorative-btn.active { background: #e6f4ea; border-color: #188038; color: #137333; font-weight: 600; }
    .manual-input {
      padding-block: 6px;
      padding-inline: 10px;
      border: 1px solid #dadce0;
      border-radius: 4px;
      font-size: 12px;
      color: #202124;
      background: #ffffff;
      width: 100%;
      box-sizing: border-box;
    }

    .card-actions { display: flex; gap: 8px; justify-content: flex-end; }
    button.outlined-btn { background: #ffffff; border: 1px solid #dadce0; color: #1a73e8; }
    button.outlined-btn:hover { background: #f8fafd; border-color: #1a73e8; }

    .tech-token, .wcag-badge, .element-chip, .severity-badge, code, .snippet-box, .swatch strong {
      direction: ltr;
      unicode-bidi: isolate;
    }
  `]
})
export class IssueListComponent {
  @Input() issues: Issue[] = [];
  @Output() select = new EventEmitter<string>();
  @Output() fix = new EventEmitter<{ issue: Issue; value?: string }>();
  @Output() fixAll = new EventEmitter<{ altMap: Record<string, string>; linkMap: Record<string, string> }>();

  altTextSuggestions: Record<string, string> = {};
  linkTitleSuggestions: Record<string, string> = {};

  constructor(public i18n: I18nService, private liteRt: LiteRtService) {}

  get fixableCount(): number {
    return this.issues.filter(i => i.canAutoFix).length;
  }

  onFixAll(): void {
    this.fixAll.emit({ altMap: this.altTextSuggestions, linkMap: this.linkTitleSuggestions });
  }

  setDecorative(issue: Issue): void {
    this.altTextSuggestions[issue.elementId] = '';
  }

  isDecorative(elementId: string): boolean {
    return this.altTextSuggestions[elementId] === '';
  }

  async suggestLinkTitle(issue: Issue): Promise<void> {
    const currentAnchor = issue.fixMetadata?.currentAnchor || issue.snippet || '';
    const url = issue.fixMetadata?.url || '';
    const title = await this.liteRt.suggestLinkAnchor(currentAnchor, issue.description, url);
    this.linkTitleSuggestions[issue.elementId] = title;
  }

  async onApplyFix(issue: Issue): Promise<void> {
    if (issue.issueType === 'Alternative Text') {
      const suggested = this.altTextSuggestions[issue.elementId] !== undefined
        ? this.altTextSuggestions[issue.elementId]
        : (issue.fixMetadata?.suggestedCleanAlt ?? '');
      this.fix.emit({ issue, value: suggested });
    } else if (issue.issueType === 'Meaningful Hyperlinks') {
      let suggestedLink = this.linkTitleSuggestions[issue.elementId];
      if (suggestedLink === undefined) {
        const currentAnchor = issue.fixMetadata?.currentAnchor || issue.snippet || '';
        const url = issue.fixMetadata?.url || '';
        suggestedLink = await this.liteRt.suggestLinkAnchor(currentAnchor, issue.description, url);
        this.linkTitleSuggestions[issue.elementId] = suggestedLink;
      }
      this.fix.emit({ issue, value: suggestedLink });
    } else {
      this.fix.emit({ issue, value: issue.fixMetadata?.suggestedHex || issue.fixMetadata?.suggestedHeadingLevel });
    }
  }
}
