import initSqlJs, { Database } from "sql.js";
import { join } from "path";
import { app } from "electron";
import { readFileSync, writeFileSync, existsSync } from "fs";
import type { SearchHistory, AppSettings } from "@shared/types";

export class DatabaseService {
  private db: Database | null = null;
  private isInitialized = false;

  constructor() {
    // Database will be initialized asynchronously
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await this.initDatabase();
    this.isInitialized = true;
  }

  private async initDatabase(): Promise<void> {
    const SQL = await initSqlJs();
    const dbPath = join(app.getPath("userData"), "language-study.db");

    let data: Buffer | undefined;
    if (existsSync(dbPath)) {
      data = readFileSync(dbPath);
    }

    this.db = new SQL.Database(data);
    this.createTables();
  }

  private ensureDb(): Database {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  private saveDatabase(): void {
    if (!this.db) return;

    const dbPath = join(app.getPath("userData"), "language-study.db");
    const data = this.db.export();
    writeFileSync(dbPath, data);
  }

  private createTables(): void {
    const db = this.ensureDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT UNIQUE NOT NULL,
        search_count INTEGER DEFAULT 1,
        last_searched DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_searches_word ON searches(word);
      CREATE INDEX IF NOT EXISTS idx_searches_last_searched ON searches(last_searched);
    `);
  }

  async getSearchHistory(): Promise<SearchHistory[]> {
    const db = this.ensureDb();
    const stmt = db.prepare(`
      SELECT id, word, search_count as searchCount, last_searched as lastSearched, created_at as createdAt
      FROM searches
      ORDER BY last_searched DESC
      LIMIT 50
    `);

    const results: SearchHistory[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      results.push({
        id: row.id,
        word: row.word,
        searchCount: row.searchCount,
        lastSearched: row.lastSearched,
        createdAt: row.createdAt,
      });
    }
    stmt.free();

    return results;
  }

  async addSearch(word: string): Promise<void> {
    const db = this.ensureDb();

    // Check if word exists
    const checkStmt = db.prepare("SELECT id FROM searches WHERE word = ?");
    checkStmt.bind([word]);

    if (checkStmt.step()) {
      // Update existing
      const updateStmt = db.prepare(`
        UPDATE searches 
        SET search_count = search_count + 1, last_searched = CURRENT_TIMESTAMP 
        WHERE word = ?
      `);
      updateStmt.run([word]);
      updateStmt.free();
    } else {
      // Insert new
      const insertStmt = db.prepare(`
        INSERT INTO searches (word) VALUES (?)
      `);
      insertStmt.run([word]);
      insertStmt.free();
    }

    checkStmt.free();
    this.saveDatabase();
  }

  async getSettings(): Promise<AppSettings> {
    const db = this.ensureDb();
    const stmt = db.prepare("SELECT key, value FROM settings");

    const rows: { key: string; value: string }[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      rows.push({
        key: row.key,
        value: row.value,
      });
    }
    stmt.free();

    const settings: Partial<AppSettings> = {};
    rows.forEach((row) => {
      try {
        (settings as any)[row.key] = JSON.parse(row.value);
      } catch {
        (settings as any)[row.key] = row.value;
      }
    });

    return {
      preferredLanguage: "en",
      imageSearchProvider: "auto",
      voiceSettings: {
        provider: "web",
        language: "en-US",
      },
      ...settings,
    } as AppSettings;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = this.ensureDb();

    Object.entries(settings).forEach(([key, value]) => {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      );
      stmt.run([key, JSON.stringify(value)]);
      stmt.free();
    });

    this.saveDatabase();
  }

  close(): void {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
    }
  }
}
