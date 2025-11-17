// This function is disabled. The application has been reverted to a fully
// client-side, URL-based system for data management. All exchange creation
// logic now happens in the browser.

export async function handler(event: any, context: any) {
    return {
        statusCode: 410, // Gone
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "This server-side function has been disabled." }),
    };
}