import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock sql.js
const mockDb = {
  exec: vi.fn(),
  prepare: vi.fn(),
  close: vi.fn(),
  export: vi.fn().mockReturnValue(new Uint8Array()),
};

const mockStatement = {
  run: vi.fn(),
  step: vi.fn().mockReturnValue(false),
  getAsObject: vi.fn().mockReturnValue({}),
  free: vi.fn(),
  bind: vi.fn(),
};

const mockSql = {
  Database: vi.fn(() => mockDb),
};

vi.mock("sql.js", () => {
  return {
    default: vi.fn().mockResolvedValue(mockSql),
  };
});

// Mock electron
vi.mock("electron", () => ({
  app: {
    getPath: vi.fn().mockReturnValue("/mock/path/userData"),
  },
}));

// Mock fs
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(false),
}));

import { DatabaseService } from "../../main/services/database";

describe("DatabaseService", () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue(mockStatement);
    dbService = new DatabaseService();
  });

  afterEach(() => {
    dbService.close();
  });

  describe("initialization", () => {
    it("creates database tables on initialization", () => {
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS searches"),
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS settings"),
      );
    });
  });

  describe("getSearchHistory", () => {
    it("returns search history ordered by last_searched", async () => {
      const mockHistory = [
        {
          id: 1,
          word: "test",
          searchCount: 3,
          lastSearched: "2024-01-01",
          createdAt: "2024-01-01",
        },
        {
          id: 2,
          word: "example",
          searchCount: 1,
          lastSearched: "2024-01-02",
          createdAt: "2024-01-02",
        },
      ];

      mockStatement.all.mockReturnValue(mockHistory);

      const result = await dbService.getSearchHistory();

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY last_searched DESC"),
      );
      expect(result).toEqual(mockHistory);
    });

    it("limits results to 50 items", async () => {
      mockStatement.all.mockReturnValue([]);

      await dbService.getSearchHistory();

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT 50"),
      );
    });
  });

  describe("addSearch", () => {
    it("adds new search word", async () => {
      await dbService.addSearch("newword");

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO searches (word) VALUES (?)"),
      );
      expect(mockStatement.run).toHaveBeenCalledWith("newword");
    });

    it("updates existing search count", async () => {
      await dbService.addSearch("existingword");

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT(word) DO UPDATE SET"),
      );
    });
  });

  describe("settings management", () => {
    it("returns default settings when none exist", async () => {
      mockStatement.all.mockReturnValue([]);

      const result = await dbService.getSettings();

      expect(result).toEqual({
        preferredLanguage: "en",
        voiceSettings: {
          provider: "web",
          language: "en-US",
        },
      });
    });

    it("parses stored settings correctly", async () => {
      const mockSettings = [
        { key: "preferredLanguage", value: '"es"' },
        { key: "googleApiKey", value: '"test-key"' },
      ];

      mockStatement.all.mockReturnValue(mockSettings);

      const result = await dbService.getSettings();

      expect(result.preferredLanguage).toBe("es");
      expect(result.googleApiKey).toBe("test-key");
    });

    it("saves settings correctly", async () => {
      const settings = {
        preferredLanguage: "es",
        googleApiKey: "test-key-123",
        voiceSettings: {
          provider: "google" as const,
          language: "es-ES",
        },
      };

      await dbService.saveSettings(settings);

      expect(mockStatement.run).toHaveBeenCalledTimes(3);
      expect(mockStatement.run).toHaveBeenCalledWith(
        "preferredLanguage",
        '"es"',
      );
      expect(mockStatement.run).toHaveBeenCalledWith(
        "googleApiKey",
        '"test-key-123"',
      );
    });
  });

  describe("database cleanup", () => {
    it("closes database connection", () => {
      dbService.close();

      expect(mockDb.close).toHaveBeenCalled();
    });
  });
});
