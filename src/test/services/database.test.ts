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
          isFavorite: 0,
          favoritedAt: null,
        },
        {
          id: 2,
          word: "example",
          searchCount: 1,
          lastSearched: "2024-01-02",
          createdAt: "2024-01-02",
          isFavorite: 0,
          favoritedAt: null,
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
      expect(result).toEqual([
        {
          id: 1,
          word: "test",
          searchCount: 3,
          lastSearched: "2024-01-01",
          createdAt: "2024-01-01",
          isFavorite: false, // Converted from 0 to false
          favoritedAt: undefined, // null becomes undefined
        },
        {
          id: 2,
          word: "example",
          searchCount: 1,
          lastSearched: "2024-01-02",
          createdAt: "2024-01-02",
          isFavorite: false, // Converted from 0 to false
          favoritedAt: undefined, // null becomes undefined
        },
      ]);
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

  describe("favorites functionality", () => {
    describe("toggleFavorite", () => {
      it("adds word to favorites when it doesn't exist", async () => {
        // Mock checkStmt.step() to return false (word doesn't exist)
        mockStatement.step.mockReturnValue(false);

        await dbService.toggleFavorite("newword", true);

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining(
            "INSERT INTO searches (word, is_favorite, favorited_at) VALUES (?, ?, ?)",
          ),
        );
        expect(mockStatement.run).toHaveBeenCalledWith([
          "newword",
          1, // boolean true converted to integer
          expect.any(String), // favorited_at timestamp
        ]);
      });

      it("updates existing word to favorite", async () => {
        // Mock checkStmt.step() to return true (word exists)
        mockStatement.step.mockReturnValue(true);

        await dbService.toggleFavorite("existingword", true);

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE searches"),
        );
        expect(mockStatement.run).toHaveBeenCalledWith([
          1, // boolean true converted to integer
          expect.any(String), // favorited_at timestamp
          "existingword",
        ]);
      });

      it("removes word from favorites", async () => {
        // Mock checkStmt.step() to return true (word exists)
        mockStatement.step.mockReturnValue(true);

        await dbService.toggleFavorite("existingword", false);

        expect(mockStatement.run).toHaveBeenCalledWith([
          0, // boolean false converted to integer
          null, // favorited_at is null when removing favorite
          "existingword",
        ]);
      });
    });

    describe("isFavorite", () => {
      it("returns true for favorite word", async () => {
        mockStatement.step.mockReturnValue(true);
        mockStatement.getAsObject.mockReturnValue({ isFavorite: 1 });

        const result = await dbService.isFavorite("favoriteword");

        expect(result).toBe(true);
        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining("SELECT COALESCE(is_favorite, 0)"),
        );
      });

      it("returns false for non-favorite word", async () => {
        mockStatement.step.mockReturnValue(true);
        mockStatement.getAsObject.mockReturnValue({ isFavorite: 0 });

        const result = await dbService.isFavorite("normalword");

        expect(result).toBe(false);
      });

      it("returns false for non-existent word", async () => {
        mockStatement.step.mockReturnValue(false);

        const result = await dbService.isFavorite("nonexistent");

        expect(result).toBe(false);
      });
    });

    describe("getSearchHistory with favorites filter", () => {
      it("returns all history when favoritesOnly is false", async () => {
        const mockHistory = [
          {
            id: 1,
            word: "test",
            searchCount: 3,
            lastSearched: "2024-01-01",
            createdAt: "2024-01-01",
            isFavorite: 1,
            favoritedAt: "2024-01-01",
          },
          {
            id: 2,
            word: "example",
            searchCount: 1,
            lastSearched: "2024-01-02",
            createdAt: "2024-01-02",
            isFavorite: 0,
            favoritedAt: null,
          },
        ];

        let callCount = 0;
        mockStatement.step.mockImplementation(() => {
          return callCount++ < mockHistory.length;
        });

        mockStatement.getAsObject.mockImplementation(() => {
          const index = callCount - 1;
          return index < mockHistory.length ? mockHistory[index] : {};
        });

        const result = await dbService.getSearchHistory(false);

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining("COALESCE(is_favorite, 0) as isFavorite"),
        );
        expect(result).toHaveLength(2);
        expect(result[0].isFavorite).toBe(true);
        expect(result[1].isFavorite).toBe(false);
      });

      it("returns only favorites when favoritesOnly is true", async () => {
        const mockHistory = [
          {
            id: 1,
            word: "favorite",
            searchCount: 3,
            lastSearched: "2024-01-01",
            createdAt: "2024-01-01",
            isFavorite: 1,
            favoritedAt: "2024-01-01",
          },
        ];

        let callCount = 0;
        mockStatement.step.mockImplementation(() => {
          return callCount++ < mockHistory.length;
        });

        mockStatement.getAsObject.mockImplementation(() => {
          const index = callCount - 1;
          return index < mockHistory.length ? mockHistory[index] : {};
        });

        const result = await dbService.getSearchHistory(true);

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining("WHERE is_favorite = 1"),
        );
        expect(result).toHaveLength(1);
        expect(result[0].word).toBe("favorite");
        expect(result[0].isFavorite).toBe(true);
      });
    });
  });

  describe("database cleanup", () => {
    it("closes database connection", () => {
      dbService.close();

      expect(mockDb.close).toHaveBeenCalled();
    });
  });
});
