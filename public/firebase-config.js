// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4b47hPA2wGYWUIhkajcnWSUb8w_gQduU",
  authDomain: "labourhiringindia.firebaseapp.com",
  projectId: "labourhiringindia",
  storageBucket: "labourhiringindia.firebasestorage.app",
  messagingSenderId: "1057256057838",
  appId: "1:1057256057838:web:7a3b1a9e7a820a22dd3cff",
  measurementId: "G-46XRJ8RJCM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Make available globally
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;

console.log("Firebase initialized successfully!");