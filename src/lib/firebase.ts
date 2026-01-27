import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDBkjay1z3O7b0dRc-uAx0jmS6I1lNNPR8",
  authDomain: "hogar-44450.firebaseapp.com",
  projectId: "hogar-44450",
  storageBucket: "hogar-44450.firebasestorage.app",
  messagingSenderId: "415897892639",
  appId: "1:415897892639:web:134498d82585faf0c8622a",
  measurementId: "G-HHMFY99RNV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
