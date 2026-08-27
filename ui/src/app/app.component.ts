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

import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityService, Issue, Settings } from './services/accessibility.service';
import { I18nService } from './services/i18n.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { IssueListComponent } from './components/issue-list/issue-list.component';
import { ReadingOrderModalComponent } from './components/reading-order-modal/reading-order-modal.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { HelpModalComponent } from './components/help-modal/help-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    IssueListComponent,
    ReadingOrderModalComponent,
    SettingsPanelComponent,
    HelpModalComponent
  ],
  template: `
    <header class="workspace-app-bar" [attr.dir]="i18n.dir()">
      <div class="brand-title">
        <span class="google-icon" aria-hidden="true">♿</span>
        <div class="titles">
          <span class="product-sub">{{ i18n.t('googleWorkspace') }}</span>
          <h1 class="product-name">{{ i18n.t('appTitle') }}</h1>
        </div>
      </div>
      <div class="app-bar-actions">
        <button type="button" class="action-chip" (click)="showHelp = true" [attr.aria-label]="i18n.t('helpAriaLabel')">
          {{ i18n.t('helpBtn') }}
        </button>
        <button type="button" class="action-chip" (click)="showSettings = true" [attr.aria-label]="i18n.t('settingsAriaLabel')">
          {{ i18n.t('settingsBtn') }}
        </button>
      </div>
    </header>

    <!-- Global Screen Reader Live Announcer Region -->
    <div role="status" aria-live="polite" class="sr-only">
      {{ announcement$ | async }}
    </div>

    <main class="main-content app-main" [attr.dir]="i18n.dir()">
      <app-dashboard
        [issues]="(issues$ | async) || []"
        [loading]="(loading$ | async) || false"
        [hasScanned]="(hasScanned$ | async) || false"
        [hostType]="(hostType$ | async) || 'UNKNOWN'"
        [selectedFilter]="selectedFilter"
        (scan)="runScan()"
        (openReadingOrder)="showReadingOrder = true"
        (filterSelect)="selectedFilter = $event"
        (fixAll)="onFixAll()">
      </app-dashboard>

      <div *ngIf="loading$ | async" class="loading-bar" role="progressbar" [attr.aria-label]="i18n.t('scanningAriaLabel')">
        <div class="spinner"></div>
        <span>{{ i18n.t('scanning') }}</span>
      </div>

      <app-issue-list
        *ngIf="!(loading$ | async)"
        [issues]="getFilteredIssues((issues$ | async) || [])"
        (select)="onSelect($event)"
        (fix)="onFix($event)"
        (fixAll)="onFixAll($event)">
      </app-issue-list>
    </main>

    <!-- Modals -->
    <app-reading-order-modal
      *ngIf="showReadingOrder"
      (close)="showReadingOrder = false"
      (applied)="runScan()">
    </app-reading-order-modal>

    <app-settings-panel
      *ngIf="showSettings"
      [settings]="(settings$ | async) || {contrastFixMode: 'PRESERVE_HSL', enableAutoRemediation: false}"
      (close)="showSettings = false"
      (save)="onSaveSettings($event)">
    </app-settings-panel>

    <app-help-modal
      *ngIf="showHelp"
      (close)="showHelp = false">
    </app-help-modal>
  `,
  styles: [`
    .workspace-app-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-block: 4px 14px;
      padding-inline: 0;
      border-block-end: 1px solid #e8eaed;
      margin-block-end: 16px;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .google-icon {
      font-size: 20px;
      background: #e8f0fe;
      color: #1a73e8;
      width: 36px;
      height: 36px;
      min-width: 36px;
      min-height: 36px;
      flex-shrink: 0;
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .titles {
      display: flex;
      flex-direction: column;
    }
    .product-sub {
      font-size: 10px;
      font-weight: 500;
      color: #5f6368;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .product-name {
      font-family: 'Google Sans', Roboto, sans-serif;
      font-size: 15px;
      font-weight: 500;
      color: #202124;
    }
    .app-bar-actions {
      display: flex;
      gap: 6px;
    }
    button.action-chip {
      height: 28px;
      padding-block: 0;
      padding-inline: 12px;
      font-size: 12px;
      border-radius: 14px;
      border: 1px solid #dadce0;
      color: #3c4043;
      background: #ffffff;
      box-shadow: none;
    }
    button.action-chip:hover {
      background: #f1f3f4;
      color: #202124;
    }
    .loading-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px;
      background: #f8fafd;
      border: 1px solid #d2e3fc;
      color: #1a73e8;
      border-radius: 8px;
      font-weight: 500;
      margin-block-end: 14px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #d2e3fc;
      border-top: 2px solid #1a73e8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AppComponent implements OnInit {
  issues$ = this.a11y.issues$;
  loading$ = this.a11y.loading$;
  hasScanned$ = this.a11y.hasScanned$;
  hostType$ = this.a11y.hostType$;
  settings$ = this.a11y.settings$;
  announcement$ = this.a11y.announcement$;

  showReadingOrder = false;
  showSettings = false;
  showHelp = false;
  selectedFilter = 'ALL';

  constructor(private a11y: AccessibilityService, public i18n: I18nService) {
    effect(() => {
      const dir = this.i18n.dir();
      const lang = this.i18n.resolvedLanguage();
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
      }
    });
  }

  ngOnInit(): void {
    this.a11y.loadSettings();
    this.runScan();
  }

  getFilteredIssues(issues: Issue[]): Issue[] {
    if (this.selectedFilter === 'ALL') return issues;
    return issues.filter(i => i.severity === this.selectedFilter);
  }

  runScan(): void {
    this.a11y.scanDocument();
  }

  onSelect(elementId: string): void {
    this.a11y.selectElement(elementId);
  }

  onFix(event: { issue: Issue; value?: string }): void {
    this.a11y.applyFix(event.issue, event.value);
  }

  onFixAll(maps?: { altMap: Record<string, string>; linkMap: Record<string, string> }): void {
    this.a11y.applyAllFixes(maps?.altMap, maps?.linkMap);
  }

  onSaveSettings(settings: Settings): void {
    this.a11y.saveSettings(settings);
  }
}
