// Windows shell: loads the same web/ build as the Mac app, fullscreen-ready window.
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1280, height: 800, backgroundColor: '#0b1020', title: 'Thread',
    webPreferences: { contextIsolation: true, autoplayPolicy: 'no-user-gesture-required' },
  });
  win.loadFile(path.join(__dirname, 'web', 'index.html'));
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
  });
  // Self-check: THREAD_SNAPSHOT=out.png renders the loaded game to a PNG and quits.
  if (process.env.THREAD_SNAPSHOT) {
    win.webContents.once('did-finish-load', () => setTimeout(async () => {
      const img = await win.webContents.capturePage();
      require('fs').writeFileSync(process.env.THREAD_SNAPSHOT, img.toPNG());
      app.exit(0);
    }, 2500));
  }
});
app.on('window-all-closed', () => app.quit());
