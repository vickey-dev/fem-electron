const marked = require('marked');
const { remote, ipcRenderer } = require('electron');
const path = require('path');
let filePath = null;
let originalContent = '';

const mainProcess = remote.require('./main');
const currentWindow = remote.getCurrentWindow();

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

const renderMarkdownToHtml = (markdown) => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

const updateUserInterface = (isEdited) => {
  let title = 'Fire Sale';

  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
  }

  if (isEdited) {
    title = `${title} (edited)`;
  }

  /* this line is specifically for the macOS where file icon will be present
      next to the file name in the title bar & a little dot icon on the close button
  */
  if (filePath) currentWindow.setRepresentedFilename(filePath);
  currentWindow.setDocumentEdited(isEdited);

  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;

  currentWindow.setTitle(title);
};

markdownView.addEventListener('keyup', (event) => {
  const currentContent = event.target.value;
  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});

openFileButton.addEventListener('click', () => {
  mainProcess.getFileFromUser();
});

saveMarkdownButton.addEventListener('click', () => {
  mainProcess.saveMarkdown(filePath, markdownView.value);
});

saveHtmlButton.addEventListener('click', () => {
  mainProcess.saveHtml(htmlView.innerHTML);
});

ipcRenderer.on('file-opened', (event, file, content) => {
  filePath = file;
  originalContent = content;
  markdownView.value = content;
  renderMarkdownToHtml(content);
  /* need to pass false otherwise while opening the newly created file will throw an error in the
    setDocumentEdited*/
  updateUserInterface(false);
});
