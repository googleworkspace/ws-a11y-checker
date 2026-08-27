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
import { Issue } from '../../services/accessibility.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="google-card dashboard-header" role="region" [attr.aria-label]="i18n.t('scanSummaryRegion')">
      <div class="score-section">
        <div class="score-circle" [class.perfect]="!loading && hasScanned && errors === 0">
          <span class="score-num"><bdi>{{ getScoreDisplay() }}</bdi></span>
        </div>
        <div class="score-label">{{ i18n.t('wcagScore') }}</div>
      </div>
      
      <div class="vertical-divider"></div>

      <div class="summary-counts">
        <div class="stat error" [class.selected]="selectedFilter === 'ERROR'" (click)="filterSelect.emit(selectedFilter === 'ERROR' ? 'ALL' : 'ERROR')" role="button" tabindex="0">
          <span class="count"><bdi>{{ loading || !hasScanned ? '-' : errors }}</bdi></span>
          <span class="label">{{ i18n.t('errors') }}</span>
        </div>
        <div class="stat warning" [class.selected]="selectedFilter === 'WARNING'" (click)="filterSelect.emit(selectedFilter === 'WARNING' ? 'ALL' : 'WARNING')" role="button" tabindex="0">
          <span class="count"><bdi>{{ loading || !hasScanned ? '-' : warnings }}</bdi></span>
          <span class="label">{{ i18n.t('warnings') }}</span>
        </div>
        <div class="stat notice" [class.selected]="selectedFilter === 'NOTICE'" (click)="filterSelect.emit(selectedFilter === 'NOTICE' ? 'ALL' : 'NOTICE')" role="button" tabindex="0">
          <span class="count"><bdi>{{ loading || !hasScanned ? '-' : notices }}</bdi></span>
          <span class="label">{{ i18n.t('notices') }}</span>
        </div>
      </div>
    </div>

    <div class="filter-chips">
      <button type="button" class="chip" [class.active]="selectedFilter === 'ALL'" (click)="filterSelect.emit('ALL')">{{ i18n.t('all') }} (<bdi>{{ issues.length }}</bdi>)</button>
      <button type="button" class="chip chip-error" [class.active]="selectedFilter === 'ERROR'" (click)="filterSelect.emit('ERROR')">{{ i18n.t('errors') }} (<bdi>{{ errors }}</bdi>)</button>
      <button type="button" class="chip chip-warning" [class.active]="selectedFilter === 'WARNING'" (click)="filterSelect.emit('WARNING')">{{ i18n.t('warnings') }} (<bdi>{{ warnings }}</bdi>)</button>
      <button type="button" class="chip chip-notice" [class.active]="selectedFilter === 'NOTICE'" (click)="filterSelect.emit('NOTICE')">{{ i18n.t('notices') }} (<bdi>{{ notices }}</bdi>)</button>
    </div>

    <div class="actions-strip">
      <button type="button" class="primary" [disabled]="loading" (click)="scan.emit()" [attr.aria-label]="i18n.t('rescanAriaLabel')">
        {{ loading ? '...' : i18n.t('rescanBtn') }}
      </button>
      <button *ngIf="fixableCount > 0" type="button" class="fix-all-btn" [disabled]="loading" (click)="fixAll.emit()" [attr.aria-label]="i18n.t('fixAllAriaLabel')">
        ⚡ {{ i18n.t('fixAllBtn') }} (<bdi>{{ fixableCount }}</bdi>)
      </button>
      <button *ngIf="hostType === 'SLIDES'" type="button" [disabled]="loading" (click)="openReadingOrder.emit()" [attr.aria-label]="i18n.t('readingOrderAriaLabel')">
        {{ i18n.t('readingOrderModalBtn') }}
      </button>
    </div>
  `,
  styles: [`
    .google-card {
      background: #ffffff;
      border: 1px solid #dadce0;
      border-radius: 8px;
      padding: 14px;
      margin-block-end: 12px;
      box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-around;
    }
    .score-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .score-circle {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #fce8e6;
      border: 3px solid #d93025;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    .score-circle.perfect {
      background: #e6f4ea;
      border-color: #188038;
    }
    .score-num {
      font-family: 'Google Sans', Roboto, sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #d93025;
      direction: ltr;
      unicode-bidi: isolate;
    }
    .score-circle.perfect .score-num {
      color: #188038;
    }
    .score-label {
      font-size: 11px;
      font-weight: 500;
      color: #5f6368;
    }
    .vertical-divider {
      width: 1px;
      height: 48px;
      background: #e8eaed;
    }
    .summary-counts {
      display: flex;
      gap: 12px;
    }
    .stat {
      text-align: center;
      cursor: pointer;
      padding-block: 4px;
      padding-inline: 6px;
      border-radius: 6px;
      transition: background 0.15s ease;
    }
    .stat:hover { background: #f1f3f4; }
    .stat.selected { background: #e8f0fe; outline: 1px solid #1a73e8; }
    .stat .count {
      font-family: 'Google Sans', Roboto, sans-serif;
      display: block;
      font-size: 17px;
      font-weight: 500;
      direction: ltr;
      unicode-bidi: isolate;
    }
    .stat.error .count { color: #d93025; }
    .stat.warning .count { color: #e37400; }
    .stat.notice .count { color: #1a73e8; }
    .stat .label { font-size: 10px; color: #5f6368; font-weight: 500; }

    .filter-chips {
      display: flex;
      gap: 6px;
      margin-block-end: 14px;
      overflow-x: auto;
      padding-block-end: 2px;
    }
    button.chip {
      height: 26px;
      padding-block: 0;
      padding-inline: 10px;
      font-size: 11px;
      border-radius: 13px;
      border: 1px solid #dadce0;
      background: #ffffff;
      color: #5f6368;
      box-shadow: none;
      white-space: nowrap;
    }
    button.chip:hover { background: #f8fafd; color: #202124; }
    button.chip.active { background: #e8f0fe; border-color: #1a73e8; color: #1a73e8; font-weight: 700; }
    button.chip-error.active { background: #fce8e6; border-color: #d93025; color: #c5221f; }
    button.chip-warning.active { background: #fef7e0; border-color: #e37400; color: #b06000; }
    button.chip-notice.active { background: #e8f0fe; border-color: #1a73e8; color: #1967d2; }

    .actions-strip {
      display: flex;
      gap: 8px;
      margin-block-end: 16px;
    }
    .actions-strip button {
      flex: 1;
    }
    .actions-strip button.fix-all-btn {
      background: #188038;
      border: 1px solid #188038;
      color: #ffffff;
      font-weight: 700;
    }
    .actions-strip button.fix-all-btn:hover:not(:disabled) {
      background: #137333;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
  `]
})
export class DashboardComponent {
  @Input() issues: Issue[] = [];
  @Input() loading = false;
  @Input() hasScanned = false;
  @Input() hostType = 'UNKNOWN';
  @Input() selectedFilter = 'ALL';
  @Output() scan = new EventEmitter<void>();
  @Output() openReadingOrder = new EventEmitter<void>();
  @Output() filterSelect = new EventEmitter<string>();
  @Output() fixAll = new EventEmitter<void>();

  constructor(public i18n: I18nService) {}

  get fixableCount(): number {
    return this.issues.filter(i => i.canAutoFix).length;
  }

  get errors(): number {
    return this.issues.filter(i => i.severity === 'ERROR').length;
  }
  get warnings(): number {
    return this.issues.filter(i => i.severity === 'WARNING').length;
  }
  get notices(): number {
    return this.issues.filter(i => i.severity === 'NOTICE').length;
  }

  getScoreDisplay(): string {
    if (this.loading || !this.hasScanned) {
      return '0%';
    }
    if (this.issues.length === 0) return '100%';
    const penalty = this.errors * 15 + this.warnings * 5 + this.notices * 2;
    const score = Math.max(0, 100 - penalty);
    return `${score}%`;
  }
}
