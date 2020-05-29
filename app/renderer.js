const marked = require('marked');
const { remote, ipcRenderer, shell } = require('electron');
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

  showFileButton.disabled = !filePath;
  openInDefaultButton.disabled = !filePath;

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

showFileButton.addEventListener('click', () => {
  if (!filePath) return alert('Nope');

  shell.showItemInFolder(filePath);
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

/* this is for the drag & drop feature */
document.addEventListener('dragstart', (event) => event.preventDefault());
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('dragleave', (event) => event.preventDefault());
document.addEventListener('drop', (event) => event.preventDefault());

const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];
const fileTypeIsSupported = (file) => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};

markdownView.addEventListener('dragover', (event) => {
  const file = getDraggedFile(event);
  console.log(file.type, file);
  if (fileTypeIsSupported(file)) {
    markdownView.classList.add('drag-over');
  } else {
    markdownView.classList.add('drag-error');
  }
});

markdownView.addEventListener('dragleave', () => {
  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});

markdownView.addEventListener('drop', (event) => {
  const file = getDraggedFile(event);
  if (fileTypeIsSupported(file)) {
    mainProcess.openFile(file.path);
  } else {
    alert('file type is not supported');
  }

  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});
