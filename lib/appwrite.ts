import { Client, Account, Databases, Storage, ID } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const APPWRITE_CONFIG = {
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
    bucketId: '69fe0d1a003571ab5139', // local_Fonts
};

export { ID };
