// src/services/analyticsService.ts

declare global {
    interface Window {
      gtag: (...args: any[]) => void;
    }
}
  
/**
 * Sends a custom event to Google Analytics.
 * @param eventName The name of the event to track.
 * @param eventParams An object of parameters to send with the event.
 */
export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventParams);
    } else {
        console.log(`Analytics Event (gtag not found): ${eventName}`, eventParams);
    }
};
