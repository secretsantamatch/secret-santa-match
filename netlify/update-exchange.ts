// This function has been disabled to resolve a persistent bug with editing old exchanges.
// The "Edit Game" feature has been removed from the front-end. This function now returns
// a "410 Gone" status to indicate the feature is no longer available.

export async function handler(event: any, context: any) {
    return {
        statusCode: 410, // Gone
        body: JSON.stringify({ 
            error: "This feature has been temporarily disabled due to a persistent issue. We apologize for the inconvenience." 
        }),
    };
}
