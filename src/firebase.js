// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Bu bilgileri Firebase projenin ayarlarından alıp buraya ekle.
const firebaseConfig = {
  // ...Firebase Proje Bilgilerin...
  apiKey: "AIzaSyA_c7Y-2jUovIVgfd3j73z3g7RpiO6DAL8",
  authDomain: "appointment-system-d293d.firebaseapp.com",
  projectId: "appointment-system-d293d",
  storageBucket: "appointment-system-d293d.firebasestorage.app",
  messagingSenderId: "990884437018",
  appId: "1:990884437018:web:9621fa68e914a56a50c5a3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
