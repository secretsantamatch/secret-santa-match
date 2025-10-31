// This script is injected into the generator.html page.
// It acts as a bridge to securely pass data from the extension's storage to the page.

chrome.storage.local.get(['ssm_participants'], (result) => {
    if (result.ssm_participants && Array.isArray(result.ssm_participants) && result.ssm_participants.length > 0) {
        
        // Dispatch a custom event on the window with the participant data.
        // The React app will be listening for this event.
        const event = new CustomEvent('ssm-participants-ready', { 
            detail: result.ssm_participants 
        });
        window.dispatchEvent(event);

        // Clear the storage so the data isn't used again on a page refresh.
        chrome.storage.local.remove('ssm_participants');
    }
});
