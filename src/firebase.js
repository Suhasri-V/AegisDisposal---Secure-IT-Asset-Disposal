import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "aegisops-e0185.firebaseapp.com",
    projectId: "aegisops-e0185",
    storageBucket: "aegisops-e0185.firebasestorage.app",
    messagingSenderId: "632309417742",
    appId: "YOUR_ACTUAL_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);