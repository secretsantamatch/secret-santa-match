// This function helps diagnose Firebase connection issues.
// To use it, deploy and then navigate to /.netlify/functions/debug-firebase-connection
// The response will guide you on how to fix common configuration problems.

export async function handler(event: any, context: any) {
    const response: Record<string, any> = {
        timestamp: new Date().toISOString(),
        env_vars_check: {
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'NOT SET',
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'NOT SET',
            FIREBASE_PRIVATE_KEY_IS_SET: !!process.env.FIREBASE_PRIVATE_KEY,
        }
    };

    try {
        // Dynamically import firebase-admin inside the handler to catch initialization errors
        const admin = (await import('./firebase-admin')).default;
        const db = admin.firestore();
        
        // Perform a simple read operation to confirm the connection works
        await db.collection('__test_connection__').limit(1).get();

        response.status = 'SUCCESS';
        response.message = 'Firebase Admin SDK initialized and Firestore connection successful! Your environment variables appear to be configured correctly.';
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response, null, 2),
        };

    } catch (error) {
        console.error('Firebase connection debug failed:', error);
        const err = error instanceof Error ? error : new Error(String(error));
        
        response.status = 'FAILED';
        response.message = 'An error occurred during Firebase initialization. This almost always means the FIREBASE_PRIVATE_KEY is formatted incorrectly in your environment variables.';
        response.error_details = {
            name: err.name,
            message: err.message,
        };
        response.HOW_TO_FIX_THIS_ERROR = {
            title: "Your FIREBASE_PRIVATE_KEY is not formatted correctly. Follow these steps precisely:",
            steps: [
                "Step 1: Go to your Firebase project > Settings (gear icon) > Project settings.",
                "Step 2: Click on the 'Service accounts' tab.",
                "Step 3: Click the 'Generate new private key' button. A JSON file will download.",
                "Step 4: Open the downloaded JSON file in a plain text editor (like Notepad, VS Code, or TextEdit).",
                "Step 5: Find the 'private_key' field. The value starts with \"-----BEGIN PRIVATE KEY-----\" and ends with \"-----END PRIVATE KEY-----\\n\".",
                "Step 6: Copy the ENTIRE value inside the quotes. It must include the `-----BEGIN...` and `-----END...` parts, and it will contain `\\n` characters.",
                "Step 7: Go to your Netlify site > Site configuration > Environment variables.",
                "Step 8: Find the variable named FIREBASE_PRIVATE_KEY and click to edit it.",
                "Step 9: Paste the entire single line of text you copied. It must be pasted as one continuous line.",
                "Step 10: Save the variable. Then, you MUST redeploy your site for the new variable to take effect. Go to the 'Deploys' tab and trigger a new deploy.",
            ],
            correct_format_example: `"-----BEGIN PRIVATE KEY-----\\nMIIC...a very long string of characters...\\n-----END PRIVATE KEY-----\\n"`,
            common_mistake: "Do NOT add actual line breaks or remove the `\\n` characters. The value in Netlify must be a single line of text exactly as it appears in the JSON file.",
        };
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response, null, 2),
        };
    }
}
