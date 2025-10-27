// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Storage
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Debug: Log all environment variables to see what's being loaded
console.log('=== VITE ENVIRONMENT VARIABLES DEBUG ===');
console.log('import.meta.env:', import.meta.env);
console.log('import.meta.env.MODE:', import.meta.env.MODE);
console.log('import.meta.env.DEV:', import.meta.env.DEV);
console.log('import.meta.env.PROD:', import.meta.env.PROD);

// Debug: Log specific Firebase environment variables
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Check if environment variables are loaded
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.error('❌ VITE_FIREBASE_API_KEY is undefined!');
  console.error('This usually means the .env file is not being loaded properly.');
  console.error('Make sure your .env file is in the project root and contains VITE_FIREBASE_API_KEY');
  console.error('Current working directory should contain the .env file');
}

// Fallback configuration if environment variables fail
const fallbackConfig = {
  apiKey: "AIzaSyCalKBofVzYxKhvBkm5EPtjmnLhYxkCqcA",
  authDomain: "ewasbaha.firebaseapp.com",
  databaseURL: "https://ewasbaha-default-rtdb.firebaseio.com",
  projectId: "ewasbaha",
  storageBucket: "ewasbaha.firebasestorage.app",
  messagingSenderId: "609014002809",
  appId: "1:609014002809:web:31f2158a2326ac580fd0a8",
  measurementId: "G-Z3SQYL9YSV"
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || fallbackConfig.databaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId
};

// Debug: Log the final config
console.log('=== FINAL FIREBASE CONFIG ===');
console.log('Firebase Config:', firebaseConfig);

// Validate config before initializing
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error('Firebase configuration is incomplete. Check your environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 
export default app;