
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
  if (typeof window.gtag === 'function') {
    // Use the smart logic: 
    // - Returns TRUE for US/Global users immediately (unless they declined)
    // - Returns FALSE for EU users (unless they accepted)
    if (shouldTrackByDefault()) {
        window.gtag('event', eventName, eventParams);
    }
  } else {
    // Do not log in production, but helpful for development
    if (import.meta.env.DEV) {
        console.log(`Analytics Event (gtag not found): ${eventName}`, eventParams);
    }
  }
};
