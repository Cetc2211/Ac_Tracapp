'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "academic-tracker-qeoxi",
  appId: "1:263108580734:web:48f982912762db1a038f2f",
  storageBucket: "academic-tracker-qeoxi.firebasestorage.app",
  apiKey: "AIzaSyDalLVD-FcRyYCE26uuK29fEMjh3hDXFcc",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  messagingSenderId: "263108580734"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };
