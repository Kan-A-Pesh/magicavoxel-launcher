const { contextBridge, ipcRenderer } = require("electron/renderer");

process.once("loaded", () => {
    contextBridge.exposeInMainWorld("electronAPI", {
        callAction: (...args) => ipcRenderer.invoke("call-action", ...args),
    });
});
