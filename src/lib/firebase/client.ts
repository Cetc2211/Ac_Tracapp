
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "academic-tracker-qeoxi",
  appId: "1:263108580734:web:48f982912762db1a038f2f",
  storageBucket: "academic-tracker-qeoxi.firebasestorage.app",
  apiKey: "AIzaSyDalLVD-FcRyYCE26uuK29fEMjh3hDXFcc",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  messagingSenderId: "263108580734"
};

// Initialize Firebase only on the client side
const app = typeof window !== 'undefined' && getApps().length === 0 ? initializeApp(firebaseConfig) : getApps().length > 0 ? getApp() : null;

// Initialize Firestore only if the app is initialized
const db: Firestore | null = app ? getFirestore(app) : null;


export { app, db };
