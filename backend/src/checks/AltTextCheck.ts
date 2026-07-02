/**
 * Alternative Text inspection module for images and visual elements.
 */
import { AccessibilityIssue } from '../models/Issue';

const REDUNDANT_PREFIXES = ['image of', 'picture of', 'screenshot of', 'photo of'];

/**
 * Checks image or visual element for missing or redundant alternative text.
 */
export function checkAltText(
  elementId: string,
  elementType: string,
  title: string,
  description: string
): AccessibilityIssue | null {
  const combined = `${title || ''} ${description || ''}`.trim();

  // Check 1: Missing alt text entirely
  if (!combined) {
    return {
      elementId,
      elementType,
      issueType: 'Alternative Text',
      severity: 'ERROR',
      wcagRule: 'WCAG 1.1.1 Non-text Content',
      title: `Missing alternative text on ${elementType}`,
      description: 'Screen reader users cannot perceive images or visual elements without descriptive alternative text.',
      snippet: `${elementType} [ID: ${elementId}]`,
      canAutoFix: false,
    };
  }

  // Check 2: Redundant phrases (e.g., "image of")
  const lower = combined.toLowerCase();
  for (const prefix of REDUNDANT_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return {
        elementId,
        elementType,
        issueType: 'Alternative Text',
        severity: 'WARNING',
        wcagRule: 'WCAG 1.1.1 Non-text Content',
        title: `Redundant alt text phrase ("${prefix}...")`,
        description: 'Screen readers already announce elements as graphics. Avoid redundant phrases like "image of".',
        snippet: combined.substring(0, 50),
        canAutoFix: false,
      };
    }
  }

  return null;
}
