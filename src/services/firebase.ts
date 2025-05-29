
// src/services/firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  type Firestore,
  collection as firestoreCollection, // renamed to avoid conflict
  addDoc as firestoreAddDoc, // use this for adding docs
  serverTimestamp // Import serverTimestamp
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, type Auth } from "firebase/auth";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApkDxOF0E18kTrnKr1oJr_HGGVP3uybWg", // This should be from your Firebase project
  authDomain: "referralconnect-sbghj.firebaseapp.com",
  projectId: "referralconnect-sbghj",
  storageBucket: "referralconnect-sbghj.firebasestorage.app",
  messagingSenderId: "117764849626",
  appId: "1:117764849626:web:e33aec063afdbdfbd98ae3"
};

// Initialize Firebase
const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const auth: Auth = getAuth(firebaseApp); // Initialize Firebase Auth

// Function to initialize Firestore (can be empty if init happens implicitly)
export const initFirestore = async () => {
  // Initialization logic if any, or just a marker function.
};

// Function to create a document in a collection with a specific ID
export const createDocumentWithId = async (collectionName: string, documentId: string, data: any) => {
  try {
    await setDoc(doc(db, collectionName, documentId), data);
    console.log("Document written with ID: ", documentId);
  } catch (e) {
    console.error("Error creating document with ID:", e);
    throw e;
  }
};

// Renamed to avoid conflict with firestore's addDoc
export const addDocument = async (collectionName: string, data: any) => {
    try {
        // Use the imported firestoreAddDoc
        const docRef = await firestoreAddDoc(firestoreCollection(db, collectionName), data);
        console.log("Document written with ID: ", docRef.id);
        return docRef;
    } catch (e) {
        console.error("Error adding document:", e);
        throw e;
    }
};

// Function to get a document from a collection
export const getDocument = async (collectionName: string, documentId: string) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    return docSnap;
  } catch (e) {
    console.error("Error getting document:", e);
    throw e;
  }
};

// Export the initialized Firebase app, Firestore instance, storage, auth, and other utilities
export {
  firebaseApp,
  db,
  storage,
  auth, // Ensure auth is exported
  firestoreCollection as collection, // Export renamed collection
  serverTimestamp // Export serverTimestamp
};
