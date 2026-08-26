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

/**
 * Severity levels for accessibility findings aligned with WCAG 2.1 AA.
 */
export type IssueSeverity = 'ERROR' | 'WARNING' | 'NOTICE';

/**
 * Categorized accessibility check types.
 */
export type IssueType =
  | 'Heading Structure'
  | 'Meaningful Hyperlinks'
  | 'Color Contrast'
  | 'Alternative Text'
  | 'Table Structure'
  | 'List Formatting'
  | 'Typography & Legibility'
  | 'Element Order'
  | 'Document Metadata';

/**
 * Representation of an accessibility violation or recommendation found on a slide or document paragraph/element.
 */
export interface AccessibilityIssue {
  /** Unique ID of the DOM element or slide object */
  elementId: string;
  /** Type of element (e.g., Paragraph, Image, Shape, Table) */
  elementType: string;
  /** Category of the issue */
  issueType: IssueType;
  /** Severity level */
  severity: IssueSeverity;
  /** Specific WCAG 2.1 AA Success Criterion rule code and title (e.g., "WCAG 1.4.3 Contrast (Minimum)") */
  wcagRule: string;
  /** Short summary title */
  title: string;
  /** Detailed description of why this violates WCAG 2.1 AA */
  description: string;
  /** Snippet of the text or element description */
  snippet: string;
  /** Whether an automated 1-click fix is available */
  canAutoFix: boolean;
  /** Optional metadata for previewing fixes (e.g., current color vs suggested color) */
  fixMetadata?: {
    currentHex?: string;
    suggestedHex?: string;
    contrastRatio?: number;
    suggestedHeadingLevel?: string;
    suggestedCleanAlt?: string;
    isImage?: boolean;
    currentAlt?: string;
    [key: string]: any;
  };
  /** Host-specific quick fix properties */
  oldText?: string;
  newText?: string;
  imgIdx?: number;
  url?: string;
  rawAnchor?: string;
  suggestedText?: string;
  currentAlt?: string;
  suggestedAlt?: string;
  [key: string]: any;
}

