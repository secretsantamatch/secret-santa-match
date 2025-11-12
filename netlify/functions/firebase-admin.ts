import * as admin from 'firebase-admin';

// This setup assumes you have set the following environment variables in your Netlify settings:
// FIREBASE_PROJECT_ID: Your Firebase project ID
// FIREBASE_CLIENT_EMAIL: The client email from your service account JSON file
// FIREBASE_PRIVATE_KEY: The private key from your service account JSON file.
//
// HOW TO FORMAT YOUR FIREBASE_PRIVATE_KEY:
// The "Failed to parse private key" error is almost always due to this variable being formatted incorrectly.
// 1. Open your service account JSON file.
// 2. Copy the entire private key string, including "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----".
// 3. In a plain text editor, replace every newline character (the actual line breaks) with the two characters '\' and 'n'. The result should be a single long line of text.
// 4. Paste this single long line as the value for the FIREBASE_PRIVATE_KEY environment variable in your deployment settings (e.g., Netlify).
//
// Example: The key in the JSON file looks like this:
// "-----BEGIN PRIVATE KEY-----\nMIIC...rest of key...\n-----END PRIVATE KEY-----\n"
// Your environment variable value should look like this:
// "-----BEGIN PRIVATE KEY-----\\nMIIC...rest of key...\\n-----END PRIVATE KEY-----\\n"

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