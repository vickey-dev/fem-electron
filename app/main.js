const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');

let mainWindow = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({ show: false });
    mainWindow.loadFile(`${__dirname}/index.html`);
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
});

exports.getFileFromUser = () => {
    //return undefined if user clicks on the cancel or array if user choose a file
    const files = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {
                name: 'Markdown Files', // you can name whatever you want which will be displayed in the dropdown options in mac 
                extensions: ['md', 'mdown'] // files with this extensions will be enabled for to pick
            }, {
                name: 'Text Files', extensions: ['txt', 'text']
            }
        ]
    });
    if (!files) return;

    const file = files[0];
    openFile(file);
};

const openFile = (file) => {
    const content = fs.readFileSync(file).toString();
    mainWindow.webContents.send('file-opened', file, content); // from main process we are sending the message to the render process
};
