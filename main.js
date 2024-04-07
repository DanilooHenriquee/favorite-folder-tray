const { app, Tray, Menu, nativeImage, dialog } = require("electron");

const { resolve, basename } = require("node:path");
const { exec, spawn } = require("node:child_process");
const os = require("os");

const Store = require("electron-store");

const schema = {
    folders: {
        type: "string",
    },
};

const store = new Store({ schema });

let mainTray = null;

function render(tray = mainTray) {
    // Render function

    const openFolder = (folder) => {
        const command = {
            linux: "xdg-open",
            win32: "explorer",
            darwin: "open",
        };

        spawn(command[os.platform()] || command.linux, [folder.path]);
    };

    const openInCode = (folder) => {
        exec(`code "${folder.path}"`);
    };

    const openInTerminal = (folder) => {
        const command = {
            linux: `gnome-terminal --working-directory="${folder.path}"`,
            win32: `start cmd /K cd "${folder.path}"`,
            darwin: `open -a Terminal "${folder.path}"`,
        };

        exec(command[os.platform()] || command.linux);
    };

    const storedFolders = store.get("folders");

    const folders = storedFolders ? JSON.parse(storedFolders) : [];

    const items = folders.map((folder, index) => ({
        id: index,
        label: folder.name,
        icon: nativeImage.createFromPath(
            resolve(__dirname, "assets", "iconFavoriteBlue16x16.png")
        ),
        submenu: [
            {
                label: "Open Folder",
                icon: nativeImage.createFromPath(
                    resolve(__dirname, "assets", "iconFolderBlue16x16.png")
                ),
                click: () => openFolder(folder),
            },
            {
                label: "Open in Code",
                icon: nativeImage.createFromPath(
                    resolve(__dirname, "assets", "iconCodeBlue16x16.png")
                ),
                click: () => {
                    openInCode(folder);
                },
            },
            {
                label: "Open in Terminal",
                icon: nativeImage.createFromPath(
                    resolve(__dirname, "assets", "iconTerminalBlue16x16.png")
                ),
                click: () => {
                    openInTerminal(folder);
                },
            },
            { type: "separator" },
            {
                label: "Remove folder",
                icon: nativeImage.createFromPath(
                    resolve(__dirname, "assets", "iconRemoveBlue16x16.png")
                ),
                click: () => {
                    folders.splice(index, 1);

                    store.set(
                        "folders",
                        JSON.stringify(
                            folders.filter((folder) => folder.id !== index)
                        )
                    );

                    render();
                },
            },
        ],
    }));

    const menuTray = [
        {
            label: "Add new folder",
            icon: nativeImage.createFromPath(
                resolve(__dirname, "assets", "iconAddBlue16x16.png")
            ),
            click: async () => {
                const result = await dialog.showOpenDialogSync({
                    properties: ["openDirectory"],
                });

                if (!result) return;

                const path = result.path;

                const name = basename(path);

                store.set(
                    "folders",
                    JSON.stringify([...folders, { path, name }])
                );

                render();
            },
        },
        { type: "separator" },
        ...items,
        {
            type: "separator",
        },
        {
            type: "normal",
            label: "Close app",
            icon: nativeImage.createFromPath(
                resolve(__dirname, "assets", "iconCloseBlue16x16.png")
            ),
            role: "quit",
            enabled: true,
        },
    ];

    const contextMenu = Menu.buildFromTemplate(menuTray);

    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
        tray.popUpContextMenu();
    });
}

app.whenReady().then(() => {
    const icon = nativeImage.createFromPath(
        resolve(__dirname, "assets", "icon512x512.png")
    );

    mainTray = new Tray(icon);

    render(mainTray);
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
