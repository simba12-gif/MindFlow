// Firebase configuration
// In production, replace with your actual Firebase project config
// The app uses mock data fallback if Firebase is not configured

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if we have valid-looking config
export const DEMO_MODE = !firebaseConfig.apiKey || 
                         firebaseConfig.apiKey === 'your_api_key' || 
                         firebaseConfig.apiKey.startsWith('demo-');

let app, auth, db, googleProvider, storage;

if (!DEMO_MODE) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    storage = getStorage(app);
  } catch (err) {
    console.error('Firebase initialization failed:', err.message);
    // If it fails, we effectively fall back to demo mode logic in components
  }
}

export { auth, db, googleProvider, storage };
export default app;
