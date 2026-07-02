/**
 * Hyperlink accessibility check module enforcing WCAG 2.1 AA Link Purpose guidelines.
 */
import { AccessibilityIssue } from '../models/Issue';

const AMBIGUOUS_PHRASES = new Set([
  // Pronouns / Demonstratives / Generic nouns
  'this', 'that', 'these', 'those', 'it', 'item', 'page', 'file', 'doc', 'document',
  'site', 'website', 'link', 'url', 'info', 'information', 'source', 'resource',
  'article', 'guide', 'report', 'details', 'more', 'overview', 'summary',

  // Actions / Imperatives
  'click', 'click here', 'tap', 'tap here', 'press', 'press here', 'go', 'go here',
  'check', 'check out', 'see', 'see here', 'view', 'view here', 'open', 'open link',
  'read', 'read more', 'learn', 'learn more', 'discover', 'explore', 'download', 'get',

  // Prepositional / demonstrative phrases
  'more info', 'more information', 'full report', 'full document', 'continue', 'continued',
  'here', 'over here', 'right here', 'found here', 'available here', 'listed here',
  'located here', 'this link', 'this page', 'this document', 'this file', 'this article',
  'this report', 'this site', 'this guide', 'website link', 'refer here', 'access here'
]);

/**
 * Scans text anchor strings for ambiguous phrases, bare pronouns, or URL literals.
 */
export function checkHyperlink(
  elementId: string,
  elementType: string,
  anchorText: string,
  url: string
): AccessibilityIssue | null {
  if (!anchorText || !url) return null;
  
  // Strip leading and trailing punctuation/symbols
  const cleaned = anchorText.trim().toLowerCase().replace(/^[.,!?:;"'()[\]{}<>]+|[.,!?:;"'()[\]{}<>]+$/g, '').trim();

  // Check 1: Extremely short string (<= 2 chars) or punctuation-only
  if (cleaned.length <= 2) {
    return {
      elementId,
      elementType,
      issueType: 'Meaningful Hyperlinks',
      severity: 'ERROR',
      wcagRule: 'WCAG 2.4.4 Link Purpose (In Context)',
      title: `Non-descriptive link text ("${anchorText.trim()}")`,
      description: 'Link anchor text is too short or lacks descriptive context under WCAG 2.1 AA.',
      snippet: anchorText.trim(),
      canAutoFix: false,
    };
  }

  // Check 2: Ambiguous / uninformative link anchor dictionary check
  const withoutPlease = cleaned.replace(/^please\s+/, '').trim();
  if (AMBIGUOUS_PHRASES.has(cleaned) || AMBIGUOUS_PHRASES.has(withoutPlease)) {
    return {
      elementId,
      elementType,
      issueType: 'Meaningful Hyperlinks',
      severity: 'ERROR',
      wcagRule: 'WCAG 2.4.4 Link Purpose (In Context)',
      title: `Unclear link anchor text ("${anchorText.trim()}")`,
      description: 'Under WCAG 2.1 AA criteria, link anchor text must clearly state its destination purpose even out of context. Avoid generic words like "this", "here", or "link".',
      snippet: anchorText.trim(),
      canAutoFix: false,
    };
  }

  // Check 3: Raw URL literal used as display text
  if (/^(https?:\/\/|www\.)[^\s]+/i.test(cleaned) || /\.(com|org|net|edu|gov|io|co)(\/[^\s]*)?$/i.test(cleaned)) {
    return {
      elementId,
      elementType,
      issueType: 'Meaningful Hyperlinks',
      severity: 'WARNING',
      wcagRule: 'WCAG 2.4.4 Link Purpose (In Context)',
      title: 'Raw URL literal used as link text',
      description: 'Screen readers announce URLs character by character. Replace raw URLs with descriptive human-readable titles.',
      snippet: anchorText.trim().substring(0, 40),
      canAutoFix: false,
    };
  }

  return null;
}
