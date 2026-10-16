
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUsJy8cbL3uFaZkzw57DSiJlsApz_bepU",
  authDomain: "aegisops-e0185.firebaseapp.com",
  projectId: "aegisops-e0185",
  storageBucket: "aegisops-e0185.firebasestorage.app",
  messagingSenderId: "632309417742",
  appId: "1:632309417742:web:067c85660ea1b6b662395f",
  measurementId: "G-QSDFRGG4XK"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
