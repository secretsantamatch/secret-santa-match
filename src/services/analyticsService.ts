// Fix: Added a triple-slash directive to include Vite's client types, which are needed for `import.meta.env`.
/// <reference types="vite/client" />

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    consentGranted?: boolean;
  }
}

export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

export const initAnalytics = () => {
    // Logic to initialize GA would go here, often in index.html or a root component.
    // For now, we assume it's loaded if gtag function exists.
};

export const trackEvent = (
  eventName: string,
  eventParams: Record<string, any> = {}
) => {
  if (typeof window.gtag === 'function' && window.consentGranted) {
    window.gtag('event', eventName, {
        ...eventParams,
        'send_to': GA_TRACKING_ID
    });
  } else {
    // console.log(`Analytics Event (GA disabled or consent not given): ${eventName}`, eventParams);
  }
};