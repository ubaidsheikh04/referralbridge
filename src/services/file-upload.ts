export async function uploadFile(file: File): Promise<string> {
  // TODO: Implement this by calling an API.
  // Ideally this should upload the file to Firebase Storage.

  console.log("Uploading file " + file.name + " of type " + file.type + " and size " + file.size);
  return "https://picsum.photos/200/300";
}
