// src/services/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { addDoc, collection } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApkDxOF0E18kTrnKr1oJr_HGGVP3uybWg",
  authDomain: "referralconnect-sbghj.firebaseapp.com",
  projectId: "referralconnect-sbghj",
  storageBucket: "referralconnect-sbghj.firebasestorage.app",
  messagingSenderId: "117764849626",
  appId: "1:117764849626:web:e33aec063afdbdfbd98ae3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



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

    const docRef = doc(db, collectionName, documentId)
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    console.error("Error getting document: ", e);
    return null;
  }
};

export { collection, db };
