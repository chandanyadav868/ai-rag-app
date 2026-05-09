import { storage, APPWRITE_CONFIG, ID } from './appwrite';

export interface AppwriteFont {
    id: string;
    name: string;
    url: string;
}

const FONT_EXTENSIONS = ['ttf', 'otf', 'woff', 'woff2'];

export const appwriteFonts = {
    uploadFont: async (file: File) => {
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
                url: fileUrl
            };
        } catch (error) {
            console.error('Appwrite Font Upload Error:', error);
            throw error;
        }
    },

    listFonts: async () => {
        try {
            const response = await storage.listFiles(APPWRITE_CONFIG.bucketId);
            return response.files
                .filter(file => {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ext && FONT_EXTENSIONS.includes(ext);
                })
                .map(file => ({
                    id: file.$id,
                    name: file.name.split('.')[0],
                    url: `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${file.$id}/view?project=${APPWRITE_CONFIG.projectId}`
                }));
        } catch (error) {
            console.error('Appwrite Font Listing Error:', error);
            return [];
        }
    }
};
