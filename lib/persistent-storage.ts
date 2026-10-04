import { get, set, keys, del, clear } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

/**
 * Universal Persistent Storage Utility
 * Handles persistent storage of Blobs (Images/Fonts) in IndexedDB
 */

export interface StoredAsset {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  timestamp: number;
}

export interface StoredFont {
  name: string;
  blob: Blob;
  timestamp: number;
}

const ASSET_PREFIX = 'asset_';
const FONT_PREFIX = 'font_';
const PROJECT_PREFIX = 'project_';

/**
 * Stores a file (Blob/File) in IndexedDB and returns a unique asset ID.
 */
export async function storeLocalAsset(file: Blob, name: string): Promise<string> {
  const id = `${ASSET_PREFIX}${uuidv4()}`;
  const asset: StoredAsset = {
    id,
    blob: file,
    name,
    type: file.type || 'image/png',
    timestamp: Date.now(),
  };
  await set(id, asset);
  return id;
}

/**
 * Converts a Base64/DataURL string to a Blob and stores it in IndexedDB.
 */
export async function storeDataUrlAsAsset(dataUrl: string, name: string = 'image'): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return await storeLocalAsset(blob, name);
}

/**
 * Extracts a Blob from an HTMLImageElement or HTMLCanvasElement and stores it in IndexedDB.
 */
export async function storeElementAsAsset(element: HTMLImageElement | HTMLCanvasElement, name: string = 'image'): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    if (element instanceof HTMLImageElement) {
      canvas.width = element.naturalWidth || element.width || 800;
      canvas.height = element.naturalHeight || element.height || 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(element, 0, 0);
    } else {
      canvas.width = element.width;
      canvas.height = element.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(element, 0, 0);
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    return await storeLocalAsset(blob, name);
  } catch (err) {
    console.error('Failed to store element as asset:', err);
    return null;
  }
}

/**
 * Retrieves a stored asset by its ID.
 */
export async function getLocalAsset(id: string): Promise<StoredAsset | undefined> {
  return await get(id);
}

/**
 * Stores complete project canvas JSON in IndexedDB to avoid localStorage 5MB quota limits.
 */
export async function storeProjectData(projectId: string, data: any): Promise<void> {
  await set(`${PROJECT_PREFIX}${projectId}`, data);
}

/**
 * Retrieves project canvas JSON from IndexedDB.
 */
export async function getProjectData(projectId: string): Promise<any | undefined> {
  return await get(`${PROJECT_PREFIX}${projectId}`);
}

/**
 * Deletes project canvas JSON from IndexedDB.
 */
export async function deleteProjectData(projectId: string): Promise<void> {
  await del(`${PROJECT_PREFIX}${projectId}`);
}

/**
 * Stores a font file in IndexedDB.
 */
export async function storeLocalFont(name: string, blob: Blob): Promise<void> {
  const id = `${FONT_PREFIX}${name}`;
  const font: StoredFont = {
    name,
    blob,
    timestamp: Date.now(),
  };
  await set(id, font);
}

/**
 * Retrieves all stored fonts.
 */
export async function getAllLocalFonts(): Promise<StoredFont[]> {
  const allKeys = await keys();
  const fontKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(FONT_PREFIX));
  const fonts: StoredFont[] = [];

  for (const key of fontKeys) {
    const font = await get<StoredFont>(key);
    if (font) fonts.push(font);
  }

  return fonts;
}

/**
 * Retrieves all stored local assets.
 */
export async function getAllLocalAssets(): Promise<StoredAsset[]> {
  const allKeys = await keys();
  const assetKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(ASSET_PREFIX));
  const assets: StoredAsset[] = [];

  for (const key of assetKeys) {
    const asset = await get<StoredAsset>(key);
    if (asset) assets.push(asset);
  }

  return assets;
}

/**
 * Deletes an asset or font by its ID or name.
 */
export async function deleteStoredItem(id: string): Promise<void> {
  await del(id);
}

/**
 * Clears all persistent storage (DANGER).
 */
export async function clearAllPersistentStorage(): Promise<void> {
  await clear();
}

