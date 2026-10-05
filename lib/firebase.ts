import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  Firestore
} from "firebase/firestore";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";

// Public Firebase config with safe fallbacks for initial setup
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment12345678",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "polishai-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "polishai-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "polishai-app.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

// Check if valid client credentials are provided
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

let app: any = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
export const googleProvider = new GoogleAuthProvider();

if (typeof window !== "undefined") {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    // Strategy 2: Persistent Local IndexedDB Cache to eliminate redundant read queries
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (e) {
      // Fallback if multiple instances or server-side hydration
      db = getFirestore(app);
    }

    auth = getAuth(app);
  } catch (err) {
    console.warn("[Firebase] Initialized in offline fallback mode:", err);
  }
}

export { app, db, auth };
