// src/services/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, Firestore, collection as firestoreCollection, addDoc as firestoreAddDoc } from "firebase/firestore"; // Renamed collection import and added addDoc
import { getStorage } from "firebase/storage";


// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApkDxOF0E18kTrnKr1oJr_HGGVP3uybWg",
  authDomain: "referralconnect-sbghj.firebaseapp.com",
  projectId: "referralconnect-sbghj",
  storageBucket: "referralconnect-sbghj.firebasestorage.app",
  messagingSenderId: "117764849626",
  appId: "1:117764849626:web:e33aec063afdbdfbd98ae3"
};

// Initialize Firebase
const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp); // Initialize storage


// Function to initialize Firestore (assuming this was intended but not exported)
export const initFirestore = async () => {
  // Initialization logic might go here, or it might just be an empty function
  // if initialization happens implicitly via initializeApp and getFirestore.
  // For now, let's assume it's just a marker function.
};


// Function to create a document in a collection with a specific ID
export const createDocumentWithId = async (collectionName: string, documentId: string, data: any) => {
  try {
    await setDoc(doc(db, collectionName, documentId), data);
    console.log("Document written with ID: ", documentId);
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e; // Re-throw error for handling in the calling function
  }
};

// Function to add a document to a collection (auto-generates ID)
export const addDoc = async (collectionName: string, data: any) => {
    try {
        const docRef = await firestoreAddDoc(firestoreCollection(db, collectionName), data);
        console.log("Document written with ID: ", docRef.id);
        return docRef; // Return the DocumentReference
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e; // Re-throw error for handling in the calling function
    }
};


// Function to get a document from a collection
export const getDocument = async (collectionName: string, documentId: string) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    return docSnap; // Return the DocumentSnapshot
  } catch (e) {
    console.error("Error getting document: ", e);
    throw e; // Re-throw error for handling in the calling function
  }
};

// Export the initialized Firebase app and Firestore instance and collection function
export { firebaseApp, db, storage, firestoreCollection as collection }; // Export storage and the renamed collection