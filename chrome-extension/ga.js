// This script implements Google Analytics tracking using the Measurement Protocol
// as required by Manifest V3's security policies.

const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const GA_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";

// These values are specific to your Google Analytics property
const MEASUREMENT_ID = "G-HG140X6CQ6";
const API_SECRET = "YOUR_API_SECRET_HERE"; // IMPORTANT: Replace with your actual API secret
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;

// Function to send an event to Google Analytics
async function sendGAEvent(name, params = {}) {
  // If API_SECRET is not set, don't send events.
  // This is a placeholder and should be replaced with a real secret key.
  if (API_SECRET === "YOUR_API_SECRET_HERE") {
    console.warn("Google Analytics API_SECRET is not set. Tracking is disabled.");
    return;
  }
  
  try {
    const response = await fetch(
      `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: "POST",
        body: JSON.stringify({
          // Use a randomly generated client_id for anonymity, as required
          client_id: self.crypto.randomUUID(),
          events: [
            {
              name,
              params: {
                session_id: "123", // A constant session ID for simplicity
                engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_MSEC,
                ...params,
              },
            },
          ],
        }),
      }
    );
  } catch (e) {
    console.error("Google Analytics request failed with an exception", e);
  }
}

// Send a 'page_view' event when the popup is opened
sendGAEvent("page_view", {
  page_title: "Chrome Extension Popup",
  page_location: "chrome-extension://popup"
});
