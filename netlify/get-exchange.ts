// This function is disabled. The application has been reverted to a fully
// client-side, URL-based system for data management. All exchange data
// is now decompressed directly from the URL hash in the browser.

export async function handler(event: any, context: any) {
    return {
        statusCode: 410, // Gone
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "This server-side function has been disabled." }),
    };
}