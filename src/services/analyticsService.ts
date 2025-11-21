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

  // SELF-HEALING LOGIC
  // If window.gtag doesn't exist yet (script slow to load), we create a temporary shim.
  // This prevents "window.gtag is not a function" errors and queues the event for later.
  if (typeof window.gtag !== 'function') {
      console.warn(`[Analytics] window.gtag missing. Creating fallback shim...`);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { window.dataLayer.push(arguments); }
  }

  // Now safe to call
  try {
      window.gtag('event', eventName, eventParams);
      console.log(`[Analytics] Event SENT to Google: ${eventName}`);
  } catch (e) {
      console.error(`[Analytics] CRITICAL FAILURE: Could not track event.`, e);
  }
};
