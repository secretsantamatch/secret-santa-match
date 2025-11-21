import { shouldTrackByDefault } from '../utils/privacy';

// This file centralizes Google Analytics tracking.

/**
 * Initializes Google Analytics tracking.
 * This should be called only after user has given consent.
 * We assume the gtag script is loaded from the HTML head.
 */
export const initAnalytics = (): void => {
    console.log("Analytics Initialized.");
};

/**
 * Sends a tracking event to Google Analytics.
 * Checks for user consent or regional defaults before sending.
 * @param {string} eventName - The name of the event (e.g., 'generate_success').
 * @param {Record<string, any>} [eventParams] - Optional parameters for the event.
 */
export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}): void => {
  // Debug log to verify function is called
  console.log(`[Analytics] Attempting to track: ${eventName}`, eventParams);

  // Check if tracking is allowed
  if (!shouldTrackByDefault()) {
      console.warn(`[Analytics] Blocked by privacy settings: ${eventName}`);
      return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
    console.log(`[Analytics] Event SENT to Google: ${eventName}`);
  } else {
    console.error(`[Analytics] FAILED: window.gtag is not a function. Is AdBlock on?`);
    
    // Fallback: Try pushing to dataLayer directly if gtag function is missing but script loaded
    if (window.dataLayer) {
        console.log(`[Analytics] Attempting fallback push to dataLayer...`);
        window.dataLayer.push({
            'event': eventName,
            ...eventParams
        });
    }
  }
};
