// src/services/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { addDoc, collection } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

let db: any;
export const initFirestore = () => {
  db = getFirestore(firebaseApp);
};

// Function to create a document in a collection
export const createDocument = async (collectionName: string, documentId: string, data: any) => {
  try {
    await initFirestore();
    await setDoc(doc(db, collectionName, documentId), data);
    console.log("Document written with ID: ", documentId);
  } catch (e) {
    console.error("Error adding document: ", e);
  }

};

// Function to get a document from a collection
export const getDocument = async (collectionName: string, documentId: string) => {
  try {
    await initFirestore();
    const docRef = doc(db, collectionName, documentId)
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    console.error("Error getting document: ", e);
    return null;
  }
};

export { collection, getFirestore, firebaseApp };
