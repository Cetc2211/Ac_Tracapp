
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "academic-tracker-qeoxi",
  appId: "1:263108580734:web:48f982912762db1a038f2f",
  storageBucket: "academic-tracker-qeoxi.firebasestorage.app",
  apiKey: "AIzaSyDalLVD-FcRyYCE26uuK29fEMjh3hDXFcc",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  messagingSenderId: "263108580734"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
