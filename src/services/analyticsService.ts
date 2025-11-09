
// This service manages analytics tracking.

// Manually define necessary global types to prevent TypeScript errors,
// especially for the global `gtag` function.
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, eventParams?: Record<string, any>) => void;
    consentGranted?: boolean;
  }
}
// The 'vite/client' types in tsconfig.json will handle import.meta.env.

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
