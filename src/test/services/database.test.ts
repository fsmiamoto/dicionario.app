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
  all: vi.fn(),
};

const mockSql = {
  Database: vi.fn(() => mockDb),
};

vi.mock("sql.js", () => ({
  default: vi.fn().mockResolvedValue({
    Database: vi.fn(() => mockDb),
  }),
}));

// Mock electron
vi.mock("electron", () => ({
  app: {
    getPath: vi.fn().mockReturnValue("/mock/path/userData"),
  },
}));

// Mock fs
vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(false),
  },
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(false),
}));

import { DatabaseService } from "../../main/services/database";

describe("DatabaseService", () => {
  let dbService: DatabaseService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockStatement.step.mockReturnValue(false);
    mockStatement.getAsObject.mockReturnValue({});

    mockDb.prepare.mockReturnValue(mockStatement);
    dbService = new DatabaseService();
    await dbService.initialize();
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

      // Mock the step() and getAsObject() behavior
      let callCount = 0;
      mockStatement.step.mockImplementation(() => {
        return callCount++ < mockHistory.length;
      });

      mockStatement.getAsObject.mockImplementation(() => {
        const index = callCount - 1;
        if (index < mockHistory.length) {
          return mockHistory[index];
        }
        return {};
      });

      const result = await dbService.getSearchHistory();

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY last_searched DESC"),
      );
      expect(result).toEqual(mockHistory);
    });

    it("limits results to 50 items", async () => {
      mockStatement.step.mockReturnValue(false);

      await dbService.getSearchHistory();

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT 50"),
      );
    });
  });

  describe("addSearch", () => {
    it("adds new search word", async () => {
      // Mock checkStmt.step() to return false (word doesn't exist)
      mockStatement.step.mockReturnValue(false);

      await dbService.addSearch("newword");

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO searches (word) VALUES (?)"),
      );
      expect(mockStatement.run).toHaveBeenCalledWith(["newword"]);
    });

    it("updates existing search count", async () => {
      // Mock checkStmt.step() to return true (word exists)
      mockStatement.step.mockReturnValue(true);

      await dbService.addSearch("existingword");

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE searches"),
      );
    });
  });

  describe("settings management", () => {
    it("returns default settings when none exist", async () => {
      mockStatement.step.mockReturnValue(false);

      const result = await dbService.getSettings();

      expect(result).toEqual({
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
        },
      });
    });

    it("parses stored settings correctly", async () => {
      const mockSettings = [
        { key: "preferredLanguage", value: '"es"' },
        { key: "googleApiKey", value: '"test-key"' },
      ];

      // Mock the step() and getAsObject() behavior for settings
      let callCount = 0;
      mockStatement.step.mockImplementation(() => {
        return callCount++ < mockSettings.length;
      });

      mockStatement.getAsObject.mockImplementation(() => {
        const index = callCount - 1;
        if (index < mockSettings.length) {
          return mockSettings[index];
        }
        return {};
      });

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
      expect(mockStatement.run).toHaveBeenCalledWith([
        "preferredLanguage",
        '"es"',
      ]);
      expect(mockStatement.run).toHaveBeenCalledWith([
        "googleApiKey",
        '"test-key-123"',
      ]);
    });
  });

  describe("database cleanup", () => {
    it("closes database connection", () => {
      dbService.close();

      expect(mockDb.close).toHaveBeenCalled();
    });
  });
});
