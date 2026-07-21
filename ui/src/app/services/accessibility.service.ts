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

import { Injectable, ApplicationRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GoogleScriptService } from './google-script.service';

export interface Issue {
  elementId: string;
  elementType: string;
  issueType: string;
  severity: 'ERROR' | 'WARNING' | 'NOTICE';
  wcagRule: string;
  title: string;
  description: string;
  snippet: string;
  canAutoFix: boolean;
  fixMetadata?: any;
}

import { I18nService } from './i18n.service';

export interface Settings {
  contrastFixMode: 'PRESERVE_HSL' | 'SNAP_MATERIAL';
  enableAutoRemediation: boolean;
  language?: string;
  userLocale?: string;
}

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private issuesSubject = new BehaviorSubject<Issue[]>([]);
  readonly issues$ = this.issuesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  private hasScannedSubject = new BehaviorSubject<boolean>(false);
  readonly hasScanned$ = this.hasScannedSubject.asObservable();

  private hostTypeSubject = new BehaviorSubject<'DOCS' | 'SLIDES' | 'SHEETS' | 'FORMS' | 'UNKNOWN'>('UNKNOWN');
  readonly hostType$ = this.hostTypeSubject.asObservable();

  private settingsSubject = new BehaviorSubject<Settings>({
    contrastFixMode: 'PRESERVE_HSL',
    enableAutoRemediation: false,
    language: 'AUTO',
  });
  readonly settings$ = this.settingsSubject.asObservable();

  private announcementSubject = new BehaviorSubject<string>('');
  readonly announcement$ = this.announcementSubject.asObservable();

  constructor(private gScript: GoogleScriptService, private appRef: ApplicationRef, private i18n: I18nService) {}

  private notifyUI(): void {
    try {
      this.appRef.tick();
    } catch (e) {
      // Ignore tick collisions
    }
  }

  announce(message: string): void {
    this.announcementSubject.next(message);
    this.notifyUI();
  }

  async scanDocument(): Promise<void> {
    this.loadingSubject.next(true);
    this.announce('Scanning document for WCAG 2.1 AA accessibility violations...');
    try {
      const host = await this.gScript.run<'DOCS' | 'SLIDES' | 'UNKNOWN'>('rpcGetHostType');
      if (host) {
        this.hostTypeSubject.next(host);
      }
      const issues = await this.gScript.run<Issue[]>('rpcRunChecks');
      this.issuesSubject.next(issues || []);
      this.hasScannedSubject.next(true);
      const errCount = (issues || []).filter((i) => i.severity === 'ERROR').length;
      this.announce(`Scan complete. Found ${issues.length} total issues, including ${errCount} critical WCAG 2.1 AA errors.`);
    } catch (err: any) {
      this.announce('Error running accessibility scan.');
      console.error('Scan error:', err);
    } finally {
      this.loadingSubject.next(false);
      this.notifyUI();
    }
  }

  async selectElement(elementId: string): Promise<void> {
    await this.gScript.run('rpcSelectElement', elementId);
  }

  async applyFix(issue: Issue, fixValue?: string): Promise<void> {
    const success = await this.gScript.run<boolean>('rpcApplyFix', issue.elementId, issue.issueType, fixValue);
    if (success) {
      this.announce(`Fixed issue: ${issue.title}`);
      const updated = this.issuesSubject.value.filter((i) => i.elementId !== issue.elementId);
      this.issuesSubject.next(updated);
      this.notifyUI();
    }
  }

  async loadSettings(): Promise<void> {
    const s = await this.gScript.run<Settings>('rpcGetSettings');
    if (s) {
      this.settingsSubject.next(s);
      this.i18n.setLanguage(s.language || 'AUTO', s.userLocale);
      this.notifyUI();
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.gScript.run('rpcSaveSettings', settings);
    this.settingsSubject.next(settings);
    this.i18n.setLanguage(settings.language || 'AUTO', settings.userLocale);
    this.announce('Settings saved successfully.');
    this.notifyUI();
  }
}
