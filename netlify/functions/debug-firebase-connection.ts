// This debugging function has served its purpose and is now disabled.
// The Firebase connection has been successfully established.

export async function handler(event: any, context: any) {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: 'DISABLED',
            message: 'The Firebase connection debug endpoint is no longer active. The connection was successful.',
            timestamp: new Date().toISOString(),
        }),
    };
}
