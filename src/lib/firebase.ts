'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "academic-tracker-qeoxi",
  appId: "1:263108580734:web:316c14f8e71c20aa038f2f",
  storageBucket: "academic-tracker-qeoxi.firebasestorage.app",
  apiKey: "AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oa0",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "263108580734"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
