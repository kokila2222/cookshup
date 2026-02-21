// Import the Firebase functions you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1Wde2hTwn4NfoTXbPOfVIMH8H_DokVjY",
  authDomain: "cookshup-app-6e73a.firebaseapp.com",
  projectId: "cookshup-app-6e73a",
  storageBucket: "cookshup-app-6e73a.firebasestorage.app",
  messagingSenderId: "27583144544",
  appId: "1:27583144544:web:6954913e5d290644915905",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

// ✅ Set session persistence so user stays logged in across refreshes
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

const db = getFirestore(app);

// Export the auth and db instances
export { auth, db };
export default app;
