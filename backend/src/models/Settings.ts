/**
 * User customizable settings stored via PropertiesService.getUserProperties().
 */
export interface AddonSettings {
  /** Contrast adjustment mode: preserve original hue/saturation or snap to Google Material Design palette */
  contrastFixMode: 'PRESERVE_HSL' | 'SNAP_MATERIAL';
  /** Whether to automatically execute safe 1-click fixes during scans (disabled by default) */
  enableAutoRemediation: boolean;
}

export const DEFAULT_SETTINGS: AddonSettings = {
  contrastFixMode: 'PRESERVE_HSL',
  enableAutoRemediation: false,
};
