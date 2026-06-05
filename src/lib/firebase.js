import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function env(name, fallback = "") {
  return import.meta.env[name] || fallback;
}

// Firebase Web API key is a client identifier, not a server secret.
// Real security is handled by Firestore Rules, Auth, App Check, and quota/restrictions.
export const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY", "AIzaSyD4RvZ2hUCifKBOE2uLEFQFMwTBMcQoGz8"),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN", "k-city-webgame.firebaseapp.com"),
  projectId: env("VITE_FIREBASE_PROJECT_ID", "k-city-webgame"),
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET", "k-city-webgame.firebasestorage.app"),
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID", "764165707172"),
  appId: env("VITE_FIREBASE_APP_ID", "1:764165707172:web:77cea6d091cd39803b5d31"),
  measurementId: env("VITE_FIREBASE_MEASUREMENT_ID", "G-W202YGQDF3")
};

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let app = null;
let auth = null;
let db = null;
let analytics = null;
let googleProvider = null;

if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn("Firebase auth persistence failed", error);
  });

  analyticsSupported()
    .then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export { app, auth, db, analytics, googleProvider };
