import { initFirestore, createDocument, getDocument } from './firebase';

describe('Firebase Database Operations', () => {
    const testCollectionName = 'testCollection';
    const mockDocId = 'testDocumentId';
    const mockData = {
        name: 'Test Name',
        value: 123,
    };

    beforeAll(async () => {
        await initFirestore();
    });

    it('should create a document in the database', async () => {
        await createDocument(testCollectionName, mockDocId, mockData);

        // Verify the document exists (optional, for immediate verification)
        const docSnap = await getDocument(testCollectionName, mockDocId);
        expect(docSnap.exists()).toBe(true);
    });

    it('should get a document from the database', async () => {
        // First, ensure the document exists by creating it.
        await createDocument(testCollectionName, mockDocId, mockData);

        const docSnap = await getDocument(testCollectionName, mockDocId);
        expect(docSnap.exists()).toBe(true);
        expect(docSnap.data()).toEqual(mockData);
    });
});