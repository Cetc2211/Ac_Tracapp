// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "academic-tracker-qeoxi",
  "appId": "1:263108580734:web:48f982912762db1a038f2f",
  "storageBucket": "academic-tracker-qeoxi.firebasestorage.app",
  "apiKey": "AIzaSyDalLVD-FcRyYCE26uuK29fEMjh3hDXFcc",
  "authDomain": "academic-tracker-qeoxi.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "263108580734"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
