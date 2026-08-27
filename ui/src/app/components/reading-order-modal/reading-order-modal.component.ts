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

import { Component, Input, Output, EventEmitter, OnInit, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { GoogleScriptService } from '../../services/google-script.service';
import { I18nService } from '../../services/i18n.service';

export interface SlideElementAST {
  objectId: string;
  objectType: string;
  previewText: string;
}

@Component({
  selector: 'app-reading-order-modal',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title" [attr.dir]="i18n.dir()">
      <div class="google-modal">
        <div class="modal-header">
          <h2 id="modal-title">{{ i18n.t('readingOrderTitle') }}</h2>
          <button type="button" class="close-btn" (click)="close.emit()" [attr.aria-label]="i18n.t('closeReadingOrderAriaLabel')">✕</button>
        </div>
        <p class="instruction">
          {{ i18n.t('readingOrderDesc') }}
        </p>

        <div *ngIf="loading" class="loading-state">{{ i18n.t('loadingElements') }}</div>

        <div *ngIf="!loading" cdkDropList class="element-list" (cdkDropListDropped)="drop($event)">
          <div *ngFor="let el of elements; let i = index" cdkDrag class="element-row">
            <div class="drag-handle" cdkDragHandle [attr.aria-label]="i18n.t('dragHandleAriaLabel')">☰</div>
            <div class="el-info">
              <span class="el-index"><bdi>{{ i + 1 }}.</bdi></span>
              <span class="el-type"><bdi>[{{ el.objectType }}]</bdi></span>
              <strong class="el-preview"><bdi>{{ el.previewText }}</bdi></strong>
            </div>
            <div class="keyboard-controls">
              <button type="button" class="icon-btn" [disabled]="i === 0" (click)="moveUp(i)" [attr.aria-label]="i18n.t('moveUpAriaLabel', { index: i + 1 })">
                ↑
              </button>
              <button type="button" class="icon-btn" [disabled]="i === elements.length - 1" (click)="moveDown(i)" [attr.aria-label]="i18n.t('moveDownAriaLabel', { index: i + 1 })">
                ↓
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="outlined" (click)="close.emit()">{{ i18n.t('cancelBtn') }}</button>
          <button type="button" class="primary" [disabled]="loading || elements.length === 0" (click)="saveOrder()">
            {{ i18n.t('applyOrderBtn') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(32, 33, 36, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .google-modal {
      background: #ffffff; border-radius: 8px; width: 92%; max-width: 460px; max-height: 85vh;
      display: flex; flex-direction: column; box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding-block: 16px; padding-inline: 20px; border-block-end: 1px solid #e8eaed; }
    .modal-header h2 { margin: 0; font-size: 16px; font-weight: 500; color: #202124; }
    .close-btn { border: none; background: none; font-size: 16px; color: #5f6368; }
    .instruction { font-size: 12px; color: #5f6368; padding-block: 12px; padding-inline: 20px; margin: 0; line-height: 1.5; }
    .element-list { flex: 1; overflow-y: auto; padding-block: 0; padding-inline: 20px; }
    .element-row { display: flex; align-items: center; justify-content: space-between; background: #f8fafd; border: 1px solid #dadce0; border-radius: 6px; padding-block: 8px; padding-inline: 12px; margin-block-end: 8px; }
    .drag-handle { cursor: grab; margin-inline-end: 12px; color: #80868b; font-size: 14px; }
    .el-info { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .el-index { font-weight: 700; margin-inline-end: 6px; color: #1a73e8; }
    .el-type { color: #5f6368; margin-inline-end: 6px; }
    .keyboard-controls { display: flex; gap: 4px; }
    button.icon-btn { padding-block: 2px; padding-inline: 8px; height: 26px; font-size: 12px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding-block: 14px; padding-inline: 20px; border-block-start: 1px solid #e8eaed; }

    .el-index, .el-type, .el-preview {
      unicode-bidi: isolate;
    }
  `]
})
export class ReadingOrderModalComponent implements OnInit {
  @Input() slideId = 'current_slide';
  @Output() close = new EventEmitter<void>();
  @Output() applied = new EventEmitter<void>();

  elements: SlideElementAST[] = [];
  loading = true;

  constructor(private gScript: GoogleScriptService, private appRef: ApplicationRef, public i18n: I18nService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.elements = await this.gScript.run<SlideElementAST[]>('rpcGetSlideElements', this.slideId) || [];
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
      try { this.appRef.tick(); } catch(e) {}
    }
  }

  drop(event: CdkDragDrop<SlideElementAST[]>): void {
    moveItemInArray(this.elements, event.previousIndex, event.currentIndex);
  }

  moveUp(index: number): void {
    if (index > 0) {
      moveItemInArray(this.elements, index, index - 1);
    }
  }

  moveDown(index: number): void {
    if (index < this.elements.length - 1) {
      moveItemInArray(this.elements, index, index + 1);
    }
  }

  async saveOrder(): Promise<void> {
    this.loading = true;
    const ids = this.elements.map(e => e.objectId);
    await this.gScript.run('rpcApplyReadingOrder', this.slideId, ids);
    this.loading = false;
    this.applied.emit();
    this.close.emit();
  }
}
