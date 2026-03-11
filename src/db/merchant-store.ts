import Database from "better-sqlite3";
import { encryptToken, decryptToken } from "./crypto.js";

export interface MerchantRecord {
  phone: string;
  merchantName: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantStore {
  getToken(phone: string): string | null;
  getMerchant(phone: string): MerchantRecord | null;
  setToken(phone: string, token: string, merchantName: string): void;
  removeToken(phone: string): boolean;
  hasToken(phone: string): boolean;
  listMerchants(): MerchantRecord[];
  getRawEncryptedToken(phone: string): string | null;
  close(): void;
}

export function createMerchantStore(options: {
  dbPath: string;
  encryptionKey: Buffer;
}): MerchantStore {
  const db = new Database(options.dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS merchants (
      phone TEXT PRIMARY KEY,
      encrypted_token TEXT NOT NULL,
      merchant_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const stmtGet = db.prepare("SELECT * FROM merchants WHERE phone = ?");
  const stmtUpsert = db.prepare(`
    INSERT INTO merchants (phone, encrypted_token, merchant_name, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(phone) DO UPDATE SET
      encrypted_token = excluded.encrypted_token,
      merchant_name = excluded.merchant_name,
      updated_at = datetime('now')
  `);
  const stmtDelete = db.prepare("DELETE FROM merchants WHERE phone = ?");
  const stmtExists = db.prepare("SELECT 1 FROM merchants WHERE phone = ?");
  const stmtList = db.prepare("SELECT phone, merchant_name, created_at, updated_at FROM merchants ORDER BY created_at");

  let closed = false;

  return {
    getToken(phone: string): string | null {
      const row = stmtGet.get(phone) as { encrypted_token: string } | undefined;
      if (!row) return null;
      return decryptToken(row.encrypted_token, options.encryptionKey);
    },

    getMerchant(phone: string): MerchantRecord | null {
      const row = stmtGet.get(phone) as {
        phone: string;
        merchant_name: string;
        created_at: string;
        updated_at: string;
      } | undefined;
      if (!row) return null;
      return {
        phone: row.phone,
        merchantName: row.merchant_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },

    setToken(phone: string, token: string, merchantName: string): void {
      const encrypted = encryptToken(token, options.encryptionKey);
      stmtUpsert.run(phone, encrypted, merchantName);
    },

    removeToken(phone: string): boolean {
      const result = stmtDelete.run(phone);
      return result.changes > 0;
    },

    hasToken(phone: string): boolean {
      return stmtExists.get(phone) !== undefined;
    },

    listMerchants(): MerchantRecord[] {
      const rows = stmtList.all() as {
        phone: string;
        merchant_name: string;
        created_at: string;
        updated_at: string;
      }[];
      return rows.map((row) => ({
        phone: row.phone,
        merchantName: row.merchant_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },

    getRawEncryptedToken(phone: string): string | null {
      const row = stmtGet.get(phone) as { encrypted_token: string } | undefined;
      return row?.encrypted_token ?? null;
    },

    close(): void {
      if (!closed) {
        db.close();
        closed = true;
      }
    },
  };
}
