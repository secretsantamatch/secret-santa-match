// netlify/functions/firebase-admin.ts
import * as admin from 'firebase-admin';

// This is a safeguard to prevent re-initializing the app on hot-reloads.
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export { admin };
