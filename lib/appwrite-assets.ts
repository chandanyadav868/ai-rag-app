import { storage, APPWRITE_CONFIG, ID } from './appwrite';

export interface AppwriteAsset {
    id: string;
    name: string;
    url: string;
    mimeType: string;
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'];

export const appwriteAssets = {
    uploadAsset: async (file: File) => {
        try {
            const response = await storage.createFile(
                APPWRITE_CONFIG.bucketId,
                ID.unique(),
                file
            );
            
            const fileUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${response.$id}/view?project=${APPWRITE_CONFIG.projectId}`;
            
            return {
                id: response.$id,
                name: file.name.split('.')[0],
                url: fileUrl,
                mimeType: file.type
            };
        } catch (error) {
            console.error('Appwrite Asset Upload Error:', error);
            throw error;
        }
    },

    listAssets: async () => {
        try {
            const response = await storage.listFiles(APPWRITE_CONFIG.bucketId);
            // Filter only images
            return response.files
                .filter(file => {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ext && IMAGE_EXTENSIONS.includes(ext);
                })
                .map(file => ({
                    id: file.$id,
                    name: file.name.split('.')[0],
                    url: `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${file.$id}/view?project=${APPWRITE_CONFIG.projectId}`,
                    mimeType: file.mimeType
                }));
        } catch (error) {
            console.error('Appwrite Asset Listing Error:', error);
            return [];
        }
    }
};
