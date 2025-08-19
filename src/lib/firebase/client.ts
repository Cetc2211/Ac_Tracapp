'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "academic-tracker-qeoxi",
  appId: "1:263108580734:web:48f982912762db1a038f2f",
  storageBucket: "academic-tracker-qeoxi.firebasestorage.app",
  apiKey: "AIzaSyDalLVD-FcRyYCE26uuK29fEMjh3hDXFcc",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  messagingSenderId: "263108580734"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence
try {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          console.warn('Firebase persistence failed: Multiple tabs open.');
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firebase persistence failed: Browser does not support persistence.');
        }
      });
} catch (e) {
    console.error("Error enabling Firebase offline persistence", e);
}


export { app, db, auth };
