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

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleScriptService {
  /**
   * Promisified wrapper for executing Google Apps Script backend RPCs.
   */
  run<T>(functionName: string, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script || !google.script.run) {
        console.warn(`[Local Dev Mock] Executing RPC: ${functionName}`, args);
        resolve(this.getMockResponse(functionName, args) as T);
        return;
      }

      google.script.run
        .withSuccessHandler((response: T) => resolve(response))
        .withFailureHandler((error: any) => reject(error))
        [functionName](...args);
    });
  }

  private getMockResponse(functionName: string, args: any[]): any {
    switch (functionName) {
      case 'rpcGetHostType':
        return 'SLIDES';
      case 'rpcRunChecks':
        return [
          {
            elementId: 'doc_p_1',
            elementType: 'Paragraph',
            issueType: 'Color Contrast',
            severity: 'ERROR',
            wcagRule: 'WCAG 1.4.3 Contrast (Minimum)',
            title: 'Low color contrast ratio (2.1:1)',
            description: 'Text has a contrast ratio of 2.1:1 against its background, failing WCAG 2.1 AA requirement of 4.5:1.',
            snippet: 'Important Status Note: Action Required Immediately',
            canAutoFix: true,
            fixMetadata: { currentHex: '#A0A0A0', suggestedHex: '#595959', contrastRatio: 2.1 },
          },
          {
            elementId: 'doc_p_2',
            elementType: 'Link',
            issueType: 'Meaningful Hyperlinks',
            severity: 'ERROR',
            wcagRule: 'WCAG 2.4.4 Link Purpose (In Context)',
            title: 'Unclear link anchor text ("learn more")',
            description: 'Under WCAG 2.1 AA criteria, link text must clearly describe its destination out of context.',
            snippet: 'learn more',
            canAutoFix: false,
          },
          {
            elementId: 'slide_123',
            elementType: 'Slide',
            issueType: 'Element Order',
            severity: 'NOTICE',
            wcagRule: 'WCAG 1.3.2 Meaningful Sequence',
            title: 'Verify slide reading order (4 elements)',
            description: 'Google Slides screen readers traverse elements back-to-front by z-index.',
            snippet: 'Slide slide_123',
            canAutoFix: false,
          },
        ];
      case 'rpcGetSettings':
        return { contrastFixMode: 'PRESERVE_HSL', enableAutoRemediation: false };
      case 'rpcGetSlideElements':
        return [
          { objectId: 'el_1', objectType: 'SHAPE', previewText: 'Project Title Box' },
          { objectId: 'el_2', objectType: 'IMAGE', previewText: 'Architecture Diagram Image' },
          { objectId: 'el_3', objectType: 'SHAPE', previewText: 'Q3 Financial Summary Bullet Points' },
        ];
      default:
        return true;
    }
  }
}
