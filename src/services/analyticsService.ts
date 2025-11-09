// This service manages analytics tracking.

// Manually define necessary global types to prevent TypeScript errors,
// especially for vite's `import.meta.env` and the global `gtag` function.
declare global {
  interface Window {
    gtag?: (command: 'config' | 'event', targetId: string, params?: Record<string, any>) => void;
    consentGranted?: boolean;
  }
  // FIX: The original type definition for `import.meta.env` conflicted with
  // Vite's base types. This is corrected by augmenting the `ImportMetaEnv`
  // interface and ensuring `ImportMeta.env` uses this standard type, which
  // resolves the "Subsequent property declarations must have the same type" error.
  interface ImportMetaEnv {
    readonly VITE_GA_TRACKING_ID: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

/**
 * Sends an event to Google Analytics if consent has been granted.
 * @param eventName - The name of the event to track.
 * @param eventParams - An object of parameters to send with the event.
 */
export const trackEvent = (
  eventName: string,
  eventParams: Record<string, any> = {}
) => {
  if (typeof window.gtag === 'function' && window.consentGranted) {
    window.gtag('event', eventName, {
        ...eventParams,
        'send_to': GA_TRACKING_ID
    });
  }
  // If gtag is not available or consent is not granted, do nothing.
};