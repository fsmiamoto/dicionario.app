import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { DatabaseService } from "./services/database";
import { SearchService } from "./services/search";
import { TTSService } from "./services/tts";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow;
let dbService: DatabaseService;
let searchService: SearchService;
let ttsService: TTSService;

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
ipcMain.handle("search-history", async () => {
  return dbService.getSearchHistory();
});

ipcMain.handle("add-search", async (_, word: string) => {
  return dbService.addSearch(word);
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
