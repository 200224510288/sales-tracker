import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHu3Z3dYWLxPhOLRpwncs2aoIRcoweFmk",
  authDomain: "lottery-sales-tracker.firebaseapp.com",
  projectId: "lottery-sales-tracker",
  storageBucket: "lottery-sales-tracker.firebasestorage.app",
  messagingSenderId: "602138815206",
  appId: "1:602138815206:web:d1c3fbbb484ef75592e927"
};

// ✅ SAFE initialization
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// ✅ Firestore instance
export const db = getFirestore(app);
