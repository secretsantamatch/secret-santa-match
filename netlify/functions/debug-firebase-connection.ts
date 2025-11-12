// netlify/functions/debug-firebase-connection.ts

import admin from './firebase-admin';

export async function handler(event: any, context: any) {
    try {
        // The import of firebase-admin itself triggers the initialization.
        // If it throws an error, the catch block will execute.
        
        // If we get this far, it means the initialization was successful.
        console.log('Firebase Admin SDK initialized successfully in debug function!');
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Success! The Firebase connection is configured correctly. You can now delete this debug function." }),
        };
    } catch (error) {
        // This will catch the initialization error from firebase-admin.ts
        console.error('CRITICAL: Firebase Admin SDK initialization FAILED.', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Firebase connection failed. Check the Netlify function logs for the detailed error message.' 
            }),
        };
    }
}
