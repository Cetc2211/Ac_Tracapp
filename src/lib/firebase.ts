import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "academic-tracker-qeoxi",
  "appId": "1:263108580734:web:48f82912762db1a038f2f",
  "storageBucket": "academic-tracker-qeoxi.firebasestorage.app",
  "apiKey": "AIzaSyDalLVD-FcRyYCE26uuK29fEMjh3hDXFcc",
  "authDomain": "academic-tracker-qeoxi.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "263108580734"
};

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

const initializeFirebase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            if (!getApps().length) {
                app = initializeApp(firebaseConfig);
            } else {
                app = getApp();
            }
            auth = getAuth(app);
            db = getFirestore(app);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

export { initializeFirebase, app, auth, db };
