import admin from 'firebase-admin';
import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;

if (getApps().length === 0) {
    // This approach is more robust for environments where .env loading is inconsistent.
    // It constructs the service account object from individual, reliable environment variables.
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      // The private key must be formatted correctly with newlines.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    // Check if the essential properties are present.
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase Admin SDK configuration error: Missing required environment variables.');
    }

    app = initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} else {
    app = getApps()[0];
}


const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);

export { adminAuth, adminDb };
