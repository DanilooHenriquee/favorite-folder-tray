const {
	app, Tray, Menu, nativeImage, dialog,
} = require('electron');

const { basename } = require('node:path');
const { exec } = require('node:child_process');

const Store = require('electron-store');

const schema = {
	folders: {
		type: 'string',
	},
};

const store = new Store({ schema });

let mainTray = null;

function render(tray = mainTray) {
	const storedFolders = store.get('folders');

    const folders = storedFolders ? JSON.parse(storedFolders) : [];

	const items = folders.map((item, index) => ({
		id: index,
		label: item.name,
        icon: nativeImage.createFromPath('./icon/iconFavoriteBlue16x16.png'),
		submenu: [
			{
				label: 'Open Folder',
                icon: nativeImage.createFromPath('./icon/iconFolderBlue16x16.png'),
				click: () => {
					exec(`open ${item.path}`);
				},
			},
			{
				label: 'Open in Code',
                icon: nativeImage.createFromPath('./icon/iconCodeBlue16x16.png'),
				click: () => {
					exec(`code ${item.path}`);
				},
			},
			{
				label: 'Open in Terminal',
                icon: nativeImage.createFromPath('./icon/iconTerminalBlue16x16.png'),
				click: () => {
					exec(`gnome-terminal --working-directory="${item.path}"`);
				},
			},
			{ type: 'separator' },
			{
				label: 'Remove folder',
                icon: nativeImage.createFromPath('./icon/iconRemoveBlue16x16.png'),
				click: () => {
					folders.splice(index, 1);

                    store.set('folders', JSON.stringify(folders.filter(folder => folder.id !== index)));

					render();
				},
			},
		],
	}));

	const menuTray = [
		{
			label: 'Add new folder',
            icon: nativeImage.createFromPath('./icon/iconAddBlue16x16.png'),
			click: async () => {
				const [path] = await dialog.showOpenDialogSync({
                    properties: ['openDirectory']
                });

				const name = basename(path);

                store.set('folders', JSON.stringify([
                    ...folders,
                    { path, name }
                ]));

				render();
			},
		},
		{ type: 'separator' },
		...items,
        {
            type: 'separator',
        },
        {
            type: 'normal',
            label: 'Close app',
            icon: nativeImage.createFromPath('./icon/iconCloseBlue16x16.png'),
            role: 'quit',
            enabled: true,
        },
	];

	const contextMenu = Menu.buildFromTemplate(menuTray);

	tray.setContextMenu(contextMenu);
}

app.whenReady()
	.then(() => {
		const icon = nativeImage.createFromPath('./icon/icon.png');

		mainTray = new Tray(icon);

		render(mainTray);
	});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
