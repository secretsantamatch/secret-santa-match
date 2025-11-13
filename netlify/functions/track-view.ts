// This function is disabled. The feature for tracking participant views
// was part of the Firebase implementation and has been removed in the
// reverted client-side, URL-based version of the application.

export async function handler(event: any, context: any) {
    return {
        statusCode: 410, // Gone
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "This server-side function has been disabled." }),
    };
}