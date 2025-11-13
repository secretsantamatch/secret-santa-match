// This function is disabled.
// The 'Edit Game' feature was the source of a persistent, critical bug
// and has been removed from the application at the user's request.
// This function now returns a '410 Gone' status to indicate that
// the feature is permanently unavailable.

export async function handler(event: any, context: any) {
    return {
        statusCode: 410, // Gone
        body: JSON.stringify({ error: "This feature has been permanently disabled due to a critical bug." }),
    };
}
