import { shell, dialog, app } from "electron";
import { join, dirname } from "node:path";
import Store from "electron-store";
import fs from "fs";
import child_process from "node:child_process";

const store = new Store();
console.log("Init store at", store.path);

const getMagicaPath = () => {
    return store.get("magicaPath", "");
};

const getRecents = () => {
    const recents = store.get("recents", {});

    if (store.get("magicaPath", "") !== "") {
        recents["0"] = join(dirname(store.get("magicaPath", "")), "vox");
    }

    return recents;
};

const openFolderDialog = () => {
    const [folder] = dialog.showOpenDialogSync({
        properties: ["openDirectory"],
        message: "Select a MagicaVoxel project folder",
        title: "Open MagicaVoxel Project",
        buttonLabel: "Open",
        // Set default path to the MagicaVoxel folder
        defaultPath: dirname(store.get("magicaPath", "")),
    }) || [null];

    return folder;
};

const openProject = (...args) => {
    let folder = args[0];
    if (!folder) folder = openFolderDialog();
    if (!folder) return false;

    const magicaPath = store.get("magicaPath", "");

    if (!magicaPath) {
        dialog.showErrorBox("Error", "MagicaVoxel path not set\nPlease set the MagicaVoxel executable path in the settings");
        return false;
    }

    // Check if $/config/config.txt exists
    const magicaFolder = dirname(magicaPath);
    const configPath = join(magicaFolder, "config/config.txt");
    const originalConfigPath = join(magicaFolder, "config/og-config.txt");

    if (!fs.existsSync(configPath)) {
        dialog.showErrorBox("Error", "MagicaVoxel not found in the selected path");
        return false;
    }

    // Backup the original config.txt if it doesn't exist
    if (!fs.existsSync(originalConfigPath)) {
        fs.copyFileSync(configPath, originalConfigPath);
    }

    // Create a new config.txt and modify the path
    const config = fs.readFileSync(originalConfigPath, "utf8");
    const newConfig = config.replace("$/vox", folder);
    fs.writeFileSync(configPath, newConfig);

    // Check if the folder is the MagicaVoxel folder
    if (!folder.replace(/\\/g, "/").includes(magicaFolder.replace(/\\/g, "/"))) {
        // Check if the folder is already in recents
        const recents = getRecents();
        const foundId = Object.keys(recents).find((id) => recents[id] === folder);
        if (foundId) {
            store.delete(`recents.${foundId}`);
        }

        // Save the folder to recents
        const id = Date.now();
        store.set(`recents.${id}`, folder);
    }

    // Open MagicaVoxel on a new process and exit the app
    child_process.spawn(magicaPath, [], { detached: true, stdio: "ignore" });
    app.quit();

    return true;
};

const setMagicaPath = (path) => {
    store.set("magicaPath", path);
};

const openGithubRepo = () => {
    shell.openExternal("https://github.com/Kan-A-Pesh/magicavoxel-launcher");
};

const removeFromRecent = (id) => {
    store.delete(`recents.${id}`);
};

const actionsFn = (event, action, ...args) => {
    switch (action) {
        case "get-magica-path":
            return getMagicaPath();
        case "get-recents":
            return getRecents();
        case "open-project":
            return openProject(...args);
        case "set-magica-path":
            const [path] = args;
            return setMagicaPath(path);
        case "open-github-repo":
            return openGithubRepo();
        case "remove-from-recent":
            const [id] = args;
            return removeFromRecent(id);
    }
};

export default actionsFn;
