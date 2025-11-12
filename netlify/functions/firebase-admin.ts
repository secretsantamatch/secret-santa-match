import * as admin from 'firebase-admin';

// This setup assumes you have set the following environment variables in your Netlify settings:
// FIREBASE_PROJECT_ID: Your Firebase project ID
// FIREBASE_CLIENT_EMAIL: The client email from your service account JSON file
// FIREBASE_PRIVATE_KEY: The private key from your service account JSON file.
// IMPORTANT: When adding the private key to Netlify, replace all newline characters (\n) with \\n.

// Proactively check for required environment variables to provide clearer errors.
if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('CRITICAL: FIREBASE_PROJECT_ID environment variable is not set.');
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('CRITICAL: FIREBASE_CLIENT_EMAIL environment variable is not set.');
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('CRITICAL: FIREBASE_PRIVATE_KEY environment variable is not set.');
}


// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            // Replace escaped newlines for the environment variable
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });
}

export default admin;
