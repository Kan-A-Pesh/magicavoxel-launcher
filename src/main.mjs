import { app, BrowserWindow, ipcMain } from "electron/main";
import { join } from "node:path";
import actionsFn from "./actions.mjs";

const __dirname = import.meta.dirname;

function createWindow() {
    const win = new BrowserWindow({
        width: 700,
        height: 450,
        icon: join(__dirname, "../public/assets/images/icons/icon_1024.png"),
        webPreferences: {
            preload: join(__dirname, "preload.js"),
        },
    });

    win.loadFile(join(__dirname, "../public/index.html"));
}

app.whenReady().then(() => {
    ipcMain.handle("call-action", actionsFn);

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
