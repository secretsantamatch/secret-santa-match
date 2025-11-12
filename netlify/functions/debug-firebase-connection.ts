// This function helps diagnose Firebase connection issues.
// To use it, deploy and then navigate to /.netlify/functions/debug-firebase-connection
// Check the function logs and the response body for details.

import admin from './firebase-admin';

export async function handler(event: any, context: any) {
    const response: Record<string, any> = {
        env_vars_check: {
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'NOT SET',
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'NOT SET',
            FIREBASE_PRIVATE_KEY_IS_SET: !!process.env.FIREBASE_PRIVATE_KEY,
        }
    };

    try {
        // The import of 'firebase-admin' will throw if initialization fails.
        // We can just proceed to test the connection.
        const db = admin.firestore();
        await db.collection('__test_connection__').limit(1).get();

        response.status = 'SUCCESS';
        response.message = 'Firebase Admin SDK initialized and Firestore connection successful!';
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
        };

    } catch (error) {
        console.error('Firebase connection debug failed:', error);
        const err = error instanceof Error ? error : new Error(String(error));
        
        response.status = 'FAILED';
        response.message = 'An error occurred during Firebase initialization or connection. This often happens if the FIREBASE_PRIVATE_KEY is formatted incorrectly in your environment variables.';
        response.error = {
            name: err.name,
            message: err.message,
            stack: err.stack,
        };
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
        };
    }
}
