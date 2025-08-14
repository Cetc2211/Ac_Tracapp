
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "academic-tracker-qeoxi",
  "appId": "1:263108580734:web:48f982912762db1a038f2f",
  "storageBucket": "academic-tracker-qeoxi.firebasestorage.app",
  "apiKey": "AIzaSyDalLVD-FcRyYCE26uuK29fEMjh3hDXFcc",
  "authDomain": "academic-tracker-qeoxi.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "263108580734"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
