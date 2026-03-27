/**
 * ============================================
 * FIREBASE CONFIGURATION
 * ============================================
 * 
 * Este archivo configura Firebase para Academic Tracker.
 * 
 * MODO DEMO: Si NEXT_PUBLIC_DEMO_MODE=true, Firebase no se inicializa
 * MODO PRODUCCIÓN: Requiere las variables de entorno configuradas
 */

'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Detectar modo demo
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oa0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "academic-tracker-qeoxi.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "academic-tracker-qeoxi",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "academic-tracker-qeoxi.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "263108580734",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:263108580734:web:316c14f8e71c20aa038f2f"
};

// Variables exportadas
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isDemoMode) {
  if (typeof window !== 'undefined') {
    console.log('🎯 MODO DEMO ACTIVADO');
    console.log('📌 Firebase no será inicializado');
    console.log('📌 Los datos se almacenan en localStorage');
  }
  
  // Crear objetos mock para evitar errores
  app = {};
  auth = null;
  db = {};
  storage = {};
} else {
  try {
    // Inicializar Firebase solo si no estamos en modo demo
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    // Initialize Firestore with persistent cache
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        }),
        experimentalAutoDetectLongPolling: true,
        experimentalLongPollingOptions: {
          timeoutSeconds: 30
        },
        ignoreUndefinedProperties: true
      });
    } catch (error) {
      console.log("Firestore already initialized, using existing instance");
      db = getFirestore(app);
    }
    
    storage = getStorage(app);
    auth = getAuth(app);
    
    if (typeof window !== 'undefined') {
      console.log('🔥 Firebase inicializado correctamente');
    }
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    console.warn('⚠️ La aplicación podría no funcionar correctamente sin Firebase');
    
    // Fallback a objetos vacíos
    app = {};
    auth = null;
    db = {};
    storage = {};
  }
}

export { app, db, storage, auth };
