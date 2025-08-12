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

    // Create tables with basic structure first
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

    // Check if favorite columns exist and add them if they don't
    const checkColumns = db.prepare("PRAGMA table_info(searches)");
    const columns: any[] = [];
    while (checkColumns.step()) {
      columns.push(checkColumns.getAsObject());
    }
    checkColumns.free();

    const hasIsFavorite = columns.some((col) => col.name === "is_favorite");
    const hasFavoritedAt = columns.some((col) => col.name === "favorited_at");

    if (!hasIsFavorite) {
      try {
        db.exec(
          `ALTER TABLE searches ADD COLUMN is_favorite INTEGER DEFAULT 0;`,
        );
      } catch (e) {
        console.warn("Failed to add is_favorite column:", e);
      }
    }

    if (!hasFavoritedAt) {
      try {
        db.exec(`ALTER TABLE searches ADD COLUMN favorited_at DATETIME;`);
      } catch (e) {
        console.warn("Failed to add favorited_at column:", e);
      }
    }

    // Create index if it doesn't exist
    try {
      db.exec(
        `CREATE INDEX IF NOT EXISTS idx_searches_is_favorite ON searches(is_favorite);`,
      );
    } catch (e) {
      // Index might already exist
    }
  }

  async getSearchHistory(favoritesOnly?: boolean): Promise<SearchHistory[]> {
    const db = this.ensureDb();
    const whereClause = favoritesOnly ? "WHERE is_favorite = 1" : "";
    const stmt = db.prepare(`
      SELECT 
        id, 
        word, 
        search_count as searchCount, 
        last_searched as lastSearched, 
        created_at as createdAt,
        COALESCE(is_favorite, 0) as isFavorite,
        favorited_at as favoritedAt
      FROM searches
      ${whereClause}
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
        isFavorite: Boolean(row.isFavorite),
        favoritedAt: row.favoritedAt || undefined,
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

  async toggleFavorite(word: string, isFavorite: boolean): Promise<void> {
    const db = this.ensureDb();

    // Ensure the word exists in the search history first
    const checkStmt = db.prepare("SELECT id FROM searches WHERE word = ?");
    checkStmt.bind([word]);

    if (!checkStmt.step()) {
      // Word doesn't exist, add it first
      const insertStmt = db.prepare(`
        INSERT INTO searches (word, is_favorite, favorited_at) VALUES (?, ?, ?)
      `);
      insertStmt.run([
        word,
        isFavorite ? 1 : 0,
        isFavorite ? new Date().toISOString() : null,
      ]);
      insertStmt.free();
    } else {
      // Update existing record
      const updateStmt = db.prepare(`
        UPDATE searches 
        SET is_favorite = ?, favorited_at = ?
        WHERE word = ?
      `);
      updateStmt.run([
        isFavorite ? 1 : 0,
        isFavorite ? new Date().toISOString() : null,
        word,
      ]);
      updateStmt.free();
    }

    checkStmt.free();
    this.saveDatabase();
  }

  async isFavorite(word: string): Promise<boolean> {
    const db = this.ensureDb();
    const stmt = db.prepare(
      "SELECT COALESCE(is_favorite, 0) as isFavorite FROM searches WHERE word = ?",
    );
    stmt.bind([word]);

    let result = false;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      result = Boolean(row.isFavorite);
    }
    stmt.free();

    return result;
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
      anki: {
        enabled: false,
        deckName: "Dicionario::Vocabulary",
        cardTemplate: "basic",
        includeAudio: true,
        includeImages: true,
        modelName: "Basic",
        fieldMappings: [
          { dicionarioField: "word", ankiField: "Front", includeHtml: true },
          {
            dicionarioField: "explanation",
            ankiField: "Back",
            includeHtml: true,
          },
          {
            dicionarioField: "phrase_text",
            ankiField: "Back",
            includeHtml: true,
          },
          {
            dicionarioField: "phrase_translation",
            ankiField: "Back",
            includeHtml: true,
          },
          { dicionarioField: "image", ankiField: "Back", includeHtml: true },
        ],
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
