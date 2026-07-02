/**
 * Google Slides object z-index reading order inspection and remediation module.
 */
import { AccessibilityIssue } from '../models/Issue';

export interface SlideElementAST {
  objectId: string;
  objectType: string;
  previewText: string;
}

/**
 * Checks if a slide has multiple page elements requiring reading order review.
 */
export function checkSlideElementOrder(slide: GoogleAppsScript.Slides.Slide): AccessibilityIssue | null {
  const elements = slide.getPageElements();
  if (elements.length <= 1) {
    return null;
  }

  return {
    elementId: slide.getObjectId(),
    elementType: 'Slide',
    issueType: 'Element Order',
    severity: 'NOTICE',
    wcagRule: 'WCAG 1.3.2 Meaningful Sequence',
    title: `Verify slide reading order (${elements.length} elements)`,
    description: 'Google Slides screen readers traverse slide objects back-to-front by z-index. Ensure logical presentation order.',
    snippet: `Slide ${slide.getObjectId()}`,
    canAutoFix: false,
  };
}

/**
 * Extracts AST of all page elements on a slide for interactive reordering UI.
 */
export function getSlideElementsAST(slideId: string): SlideElementAST[] {
  const slide = SlidesApp.getActivePresentation().getSlideById(slideId);
  const elements = slide.getPageElements();
  const ast: SlideElementAST[] = [];

  for (const el of elements) {
    const objectId = el.getObjectId();
    const type = el.getPageElementType().toString();
    let previewText = '';

    switch (el.getPageElementType()) {
      case SlidesApp.PageElementType.SHAPE:
        previewText = el.asShape().getText().asString().trim() || el.asShape().getShapeType().toString();
        break;
      case SlidesApp.PageElementType.IMAGE:
        previewText = el.asImage().getTitle() || el.asImage().getDescription() || 'Image Element';
        break;
      case SlidesApp.PageElementType.TABLE:
        previewText = 'Table Element';
        break;
      default:
        previewText = el.getTitle() || type;
    }

    ast.push({
      objectId,
      objectType: type,
      previewText: previewText.substring(0, 40),
    });
  }

  return ast;
}

/**
 * Applies the desired reading order from top (read first) to bottom (read last) by calling bringToFront sequentially.
 */
export function applySlideReadingOrder(slideId: string, orderedObjectIds: string[]): void {
  const slide = SlidesApp.getActivePresentation().getSlideById(slideId);
  for (const id of orderedObjectIds) {
    slide.getPageElementById(id).bringToFront();
  }
}
