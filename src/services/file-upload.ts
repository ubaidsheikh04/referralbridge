import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase'; // Assuming you export 'storage' from here
import { v4 as uuidv4 } from 'uuid'; // Assuming you have uuid installed

export async function uploadFile(file: File): Promise<string> {
  console.log("Uploading file " + file.name + " of type " + file.type + " and size " + file.size);
  const uniqueId = uuidv4();
  const storageRef = ref(storage, `resumes/${uniqueId}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}
