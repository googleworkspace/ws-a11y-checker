/**
 * Copyright 2026 Google LLC
 *
 * Deterministic helper service for link and element text suggestions.
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LiteRtService {
  /**
   * Cleans up existing alt text if present.
   */
  async generateAltTextForElement(elementId: string, currentAlt?: string): Promise<string> {
    if (currentAlt) {
      const cleaned = currentAlt.replace(/^(image|picture|photo|screenshot|graphic|diagram) of\s+/i, '').trim();
      if (cleaned && !/^(img_|dsc_|dcim_|photo_|image_|\d+|screenshot)|(\.(jpg|jpeg|png|gif|bmp|webp|svg)$)/i.test(cleaned)) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }
    return '';
  }

  /**
   * Generates a context-aware descriptive replacement link title using deterministic heuristics.
   */
  async suggestLinkAnchor(anchorText: string, sentenceContext?: string, url?: string): Promise<string> {
    return this.runNlpLinkInference(anchorText, sentenceContext, url);
  }

  private runNlpLinkInference(anchorText: string, sentenceContext?: string, url?: string): string {
    if (url) {
      const urlClean = url.replace(/https?:\/\/(www\.)?/i, '');
      const pathParts = urlClean.split('/').filter(p => p.length > 1 && !p.includes('.html') && !p.includes('.php') && !p.includes('.com') && !p.includes('.org') && !p.includes('.net'));
      if (pathParts.length > 0) {
        const lastPart = decodeURIComponent(pathParts[pathParts.length - 1]).replace(/[-_]/g, ' ').replace(/\.[a-z0-9]+$/i, '').trim();
        if (lastPart.length >= 3 && !/^\d+$/.test(lastPart)) {
          return lastPart.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
      }
      const domain = urlClean.split('/')[0].replace(/\.(com|org|net|edu|gov|io|co)$/i, '');
      if (domain && domain.length > 2) {
        return `${domain.charAt(0).toUpperCase() + domain.slice(1)} Resource`;
      }
    }

    if (sentenceContext) {
      const cleanCtx = sentenceContext.replace(/please\s+(click|refer|learn|read|view|check|see|go)\s+(here|this|more|info|information|link|page|doc|document)?/gi, '');
      const prepMatch = /\b(about|for|on|regarding|to|see|review|read|access|visit)\s+([A-Z0-9a-z\s-]{4,35})/i.exec(cleanCtx);
      if (prepMatch && prepMatch[2]) {
        const phrase = prepMatch[2].replace(/[.,!?:;()[\]{}]/g, '').trim();
        const words = phrase.split(/\s+/).filter(w => w.length > 1 && !['this', 'here', 'link', 'page', 'document'].includes(w.toLowerCase()));
        if (words.length >= 1) {
          return words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }
      const words = cleanCtx.split(/\s+/).filter(w => w.length > 3 && !['this', 'that', 'here', 'there', 'please', 'click', 'link', 'page', 'more'].includes(w.toLowerCase()));
      if (words.length >= 2) {
        const candidate = words.slice(0, 4).join(' ').replace(/[.,!?:;]/g, '');
        return candidate.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }

    return `${anchorText} (Reference Documentation)`;
  }
}
