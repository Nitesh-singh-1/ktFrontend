const { app, BrowserWindow, ipcMain, dialog, shell, session } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

// Configure auto-updater logging
autoUpdater.logger = console;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Build Expiry Date: September 30, 2026 23:59:59 IST
const BUILD_EXPIRY_DATE = new Date("2026-10-01T00:00:00+05:30");

function isBuildExpired() {
  return new Date() >= BUILD_EXPIRY_DATE;
}

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
let mainWindow = null;
let server = null;
let serverPort = null;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "font/eot",
};

// Built-in lightweight static file server for Next.js production export
function startStaticServer(outDir) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
        let reqPath = decodeURIComponent(parsedUrl.pathname);

        let filePath = path.join(outDir, reqPath);

        // Resolve paths and index.html fallbacks for App Router static export
        if (fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            filePath = path.join(filePath, "index.html");
          }
        } else if (fs.existsSync(filePath + ".html")) {
          filePath = filePath + ".html";
        } else if (fs.existsSync(path.join(filePath, "index.html"))) {
          filePath = path.join(filePath, "index.html");
        }

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(outDir, "404.html");
        }

        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("404 Not Found");
            return;
          }

          const ext = path.extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";

          res.writeHead(200, {
            "Content-Type": contentType,
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          });
          res.end(data);
        });
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Internal Server Error");
      }
    });

    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      resolve({ server: srv, port: address.port });
    });

    srv.on("error", (err) => {
      reject(err);
    });
  });
}

function sendUpdateStatus(status, details = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-status", { status, ...details });
  }
}

function setupAutoUpdater() {
  autoUpdater.on("checking-for-update", () => {
    console.log("[AutoUpdater] Checking for updates...");
    sendUpdateStatus("checking");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("[AutoUpdater] Update available:", info.version);
    sendUpdateStatus("available", { version: info.version, releaseNotes: info.releaseNotes });
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("[AutoUpdater] Current version is up to date.");
    sendUpdateStatus("not-available", { version: info.version });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    console.log(`[AutoUpdater] Download progress: ${Math.floor(progressObj.percent)}%`);
    sendUpdateStatus("downloading", {
      percent: Math.floor(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[AutoUpdater] Update downloaded:", info.version);
    sendUpdateStatus("downloaded", { version: info.version });

    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog
        .showMessageBox(mainWindow, {
          type: "info",
          title: "Update Ready to Install",
          message: `A new version (v${info.version}) of K-Transport is ready.`,
          detail: "Would you like to restart the application now to apply the update?",
          buttons: ["Restart & Apply Update", "Later"],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
    }
  });

  autoUpdater.on("error", (err) => {
    const errorMsg = err?.message || "";
    // If 404 / releases.atom, it means no releases published yet on GitHub - don't alarm user
    if (errorMsg.includes("404") || errorMsg.includes("releases.atom")) {
      console.log("[AutoUpdater] No published releases found on GitHub yet. This is normal for initial build.");
      sendUpdateStatus("not-available");
      return;
    }
    console.error("[AutoUpdater] Error checking for updates:", err);
    sendUpdateStatus("error", { message: errorMsg || "Error checking for updates" });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: "K-Transport",
    icon: path.join(__dirname, "../public/logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Disables browser CORS restrictions for desktop API calls
      allowRunningInsecureContent: true,
    },
    show: false,
  });

  // Enable F12 and Ctrl+Shift+I to toggle Developer Tools anytime
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12" || (input.control && input.shift && input.key.toLowerCase() === "i")) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Handle printing popup windows seamlessly
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        width: 1000,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
        },
      },
    };
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();

    // Check for updates in production (suppressing 404 logs if no release exists yet)
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify().catch((err) => {
          console.log("[AutoUpdater] Update check check completed (no new release detected).");
        });
      }, 3000);
    }
  });

  if (isDev) {
    const devUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";
    await mainWindow.loadURL(devUrl);
  } else {
    try {
      const outDir = path.join(__dirname, "../out");
      const { server: srv, port } = await startStaticServer(outDir);
      server = srv;
      serverPort = port;
      await mainWindow.loadURL(`http://127.0.0.1:${serverPort}/login/`);
    } catch (err) {
      console.error("Failed to start local static server:", err);
      dialog.showErrorBox("Startup Error", "Failed to start local application server.");
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("check-for-updates", async () => {
  if (isDev) {
    return { status: "dev-mode", message: "Updates are disabled in development mode." };
  }
  try {
    const checkResult = await autoUpdater.checkForUpdates();
    return { status: "checking", result: checkResult };
  } catch (error) {
    return { status: "error", message: error.message };
  }
});

ipcMain.handle("quit-and-install", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("print-direct", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.print({ silent: false, printBackground: true });
    return true;
  }
  return false;
});

// App Lifecycle
app.whenReady().then(async () => {
  // Check build expiration
  if (isBuildExpired()) {
    dialog.showErrorBox(
      "Build Expired",
      "This application build was valid until September 30, 2026 and has expired.\n\nPlease contact the administrator or software provider for an updated version."
    );
    app.quit();
    return;
  }

  // Relax CORS headers globally in session
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Access-Control-Allow-Origin": ["*"],
        "Access-Control-Allow-Headers": ["*"],
        "Access-Control-Allow-Methods": ["GET, POST, PUT, DELETE, OPTIONS"],
      },
    });
  });

  setupAutoUpdater();
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (isBuildExpired()) {
        dialog.showErrorBox(
          "Build Expired",
          "This application build was valid until September 30, 2026 and has expired.\n\nPlease contact the administrator or software provider for an updated version."
        );
        app.quit();
        return;
      }
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (server) {
    server.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
