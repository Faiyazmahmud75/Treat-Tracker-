import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBejVggiiVtbbtXBAflrqWlLBx2JgdZjvY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "treattracker-3d206.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "treattracker-3d206",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "treattracker-3d206.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "319654128808",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:319654128808:web:4287fc5aa0977a5067e69d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, signInWithPopup, signOut };
