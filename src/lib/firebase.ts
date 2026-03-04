import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDHu3Z3dYWLxPhOLRpwncs2aoIRcoweFmk",
  authDomain: "lottery-sales-tracker.firebaseapp.com",
  projectId: "lottery-sales-tracker",
  storageBucket: "lottery-sales-tracker.firebasestorage.app",
  messagingSenderId: "602138815206",
  appId: "1:602138815206:web:d1c3fbbb484ef75592e927",
};

// ✅ Safe init (single app)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Exports
export const db = getFirestore(app);
export const auth = getAuth(app);