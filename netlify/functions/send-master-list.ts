// This function is disabled as the application has moved to a URL-based sharing system.
// It is kept to prevent build errors from missing files in some deployment environments.
export async function handler(event: any, context: any) {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "This function is disabled." }),
    };
}
