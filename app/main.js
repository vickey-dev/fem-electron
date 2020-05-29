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
    const files = dialog.showOpenDialog(mainWindow, {
        /* mainWindow is added here to give a dropdown sheet effect in macOS during dialog open */
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

exports.saveMarkdown = (file, content) => {
    if (!file) {
        file = dialog.showSaveDialog(mainWindow, {
            title: 'Save Markdown',
            //here app.getPath will get path for the specified string which will be taken care by electron for different OS
            defaultPath: app.getPath('desktop'),
            filters: [{
                name: 'Markdown Files', extensions: ['md', 'mdown', 'markdown']
            }]
        });
    }

    if (!file) return;

    fs.writeFileSync(file, content);
    //this will remove the edited text from the title bar if you save a file which is created from this markdown editor current electron app :)
    openFile(file);
};

exports.saveHtml = content => {
    const file = dialog.showSaveDialog(mainWindow, {
        title: 'Save Html',
        defaultPath: app.getPath('desktop'),
        filters: [{
            name: 'HTML files', extensions: ['html']
        }]
    });

    if (!file) return;

    fs.writeFileSync(file, content);
};

const openFile = (file) => {
    const content = fs.readFileSync(file).toString();
    //this will show recent documents in the mac dock when we right click on the app icon
    app.addRecentDocument(file);
    mainWindow.webContents.send('file-opened', file, content); // from main process we are sending the message to the render process
};
