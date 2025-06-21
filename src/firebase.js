// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCalKBofVzYxKhvBkm5EPtjmnLhYxkCqcA",
  authDomain: "ewasbaha.firebaseapp.com",
  databaseURL: "https://ewasbaha-default-rtdb.firebaseio.com",
  projectId: "ewasbaha",
  storageBucket: "ewasbaha.firebasestorage.app",
  messagingSenderId: "609014002809",
  appId: "1:609014002809:web:31f2158a2326ac580fd0a8",
  measurementId: "G-Z3SQYL9YSV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);