'use client';

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// NOTA: El dominio .appspot.com es el identificador correcto que el SDK de cliente
// espera para el storageBucket, aunque en la consola de GCloud aparezca como .firebasestorage.app.
// Ambas direcciones apuntan al mismo recurso.
const firebaseConfig = {
  apiKey: "AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oa0", // CORREGIDO: oa0 (cero) no oao (letra o)
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  projectId: "academic-tracker-qeoxi",
  storageBucket: "academic-tracker-qeoxi.appspot.com",
  messagingSenderId: "263108580734",
  appId: "1:263108580734:web:316c14f8e71c20aa038f2f"
};


// Initialize Firebase
// Using a singleton pattern to avoid re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent cache for offline support and multi-tab synchronization
let db;
try {
  db = initializeFirestore(app, {
    // Persistent cache with MULTI-TAB manager for proper synchronization across tabs
    // This enables cross-device and cross-tab sync with IndexedDB persistence
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    // Network optimizations for limited connections
    experimentalAutoDetectLongPolling: true,
    experimentalLongPollingOptions: {
      timeoutSeconds: 30  // Shorter timeout to free connections
    },
    // Enable better offline behavior
    ignoreUndefinedProperties: true
  });
} catch (error) {
  // Fallback for development hot-reloads if already initialized
  console.log("Firestore already initialized, using existing instance");
  db = getFirestore(app);
}

const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
