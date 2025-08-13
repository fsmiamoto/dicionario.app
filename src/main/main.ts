import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { DatabaseService } from "./services/database";
import { SearchService } from "./services/search";
import { TTSService } from "./services/tts";
import { AnkiService } from "./services/anki";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow;
let dbService: DatabaseService;
let searchService: SearchService;
let ttsService: TTSService;
let ankiService: AnkiService;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    },
    titleBarStyle: "hiddenInset",
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    const rendererPath = join(__dirname, "../renderer/index.html");
    console.log("Loading renderer from:", rendererPath);
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    app.quit();
  });
}

app.whenReady().then(async () => {
  try {
    dbService = new DatabaseService();
    await dbService.initialize();
    searchService = new SearchService();
    ttsService = new TTSService();
    ankiService = new AnkiService();
  } catch (error) {
    console.error("Failed to initialize services:", error);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle("search-history", async (_, favoritesOnly?: boolean) => {
  return dbService.getSearchHistory(favoritesOnly);
});

ipcMain.handle("add-search", async (_, word: string) => {
  return dbService.addSearch(word);
});

ipcMain.handle(
  "toggle-favorite",
  async (_, word: string, isFavorite: boolean) => {
    return dbService.toggleFavorite(word, isFavorite);
  },
);

ipcMain.handle("is-favorite", async (_, word: string) => {
  return dbService.isFavorite(word);
});

ipcMain.handle("search-images", async (_, word: string, options?: any) => {
  const settings = await dbService.getSettings();
  return searchService.searchImages(word, settings, options);
});

ipcMain.handle("generate-phrases", async (_, word: string) => {
  const settings = await dbService.getSettings();
  return searchService.generatePhrases(word, settings);
});

ipcMain.handle("generate-audio", async (_, text: string, language: string) => {
  const settings = await dbService.getSettings();
  return ttsService.generateAudio(text, language, settings);
});

ipcMain.handle("get-settings", async () => {
  return dbService.getSettings();
});

ipcMain.handle("save-settings", async (_, settings: any) => {
  return dbService.saveSettings(settings);
});

ipcMain.handle("validate-api-keys", async () => {
  const settings = await dbService.getSettings();
  return searchService.validateApiKeys(settings);
});

ipcMain.handle("generate-explanation", async (_, word: string) => {
  const settings = await dbService.getSettings();
  return searchService.generateExplanation(word, settings);
});

// Anki IPC Handlers
ipcMain.handle("anki-test-connection", async () => {
  return ankiService.testConnection();
});

ipcMain.handle("anki-get-decks", async () => {
  return ankiService.getDeckNames();
});

ipcMain.handle("anki-get-models", async () => {
  return ankiService.getModelsWithFields();
});

ipcMain.handle("anki-get-model-fields", async (_, modelName: string) => {
  return ankiService.getModelFieldNames(modelName);
});

ipcMain.handle(
  "anki-create-card",
  async (
    _,
    card: any,
    deckName?: string,
    modelName?: string,
    fieldMappings?: any,
  ) => {
    return ankiService.addCard(card, deckName, modelName, fieldMappings);
  },
);

ipcMain.handle(
  "anki-create-cards",
  async (
    _,
    cards: any[],
    deckName?: string,
    modelName?: string,
    fieldMappings?: any,
  ) => {
    return ankiService.addCards(cards, deckName, modelName, fieldMappings);
  },
);
