import Dexie, { type EntityTable } from 'dexie';
import { StoredPrint } from '@/types';

class PhotoboothDatabase extends Dexie {
  prints!: EntityTable<StoredPrint, 'id'>;

  constructor() {
    super('PhotoboothV3DB');
    this.version(1).stores({
      prints: 'id, createdAt, themeId, formatId, eventName',
    });
  }
}

let dbInstance: PhotoboothDatabase | null = null;

function getDb(): PhotoboothDatabase {
  if (!dbInstance) {
    dbInstance = new PhotoboothDatabase();
  }
  return dbInstance;
}

export async function getAllPrints(): Promise<StoredPrint[]> {
  if (typeof window === 'undefined') return [];
  const db = getDb();
  return db.prints.orderBy('createdAt').reverse().toArray();
}

export async function getPrintById(id: string): Promise<StoredPrint | undefined> {
  if (typeof window === 'undefined') return undefined;
  const db = getDb();
  return db.prints.get(id);
}

export async function savePrint(print: StoredPrint): Promise<string> {
  if (typeof window === 'undefined') return print.id;
  const db = getDb();
  await db.prints.put(print);
  return print.id;
}

export async function deletePrint(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = getDb();
  await db.prints.delete(id);
}

export async function clearAllPrints(): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = getDb();
  await db.prints.clear();
}

export interface StorageQuotaInfo {
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  isAvailable: boolean;
}

export async function getStorageQuota(): Promise<StorageQuotaInfo> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 1;
      return {
        usageBytes: usage,
        quotaBytes: quota,
        percentUsed: Math.min(100, Math.round((usage / quota) * 100)),
        isAvailable: true,
      };
    } catch {
      // Fallback
    }
  }
  return {
    usageBytes: 0,
    quotaBytes: 0,
    percentUsed: 0,
    isAvailable: false,
  };
}
