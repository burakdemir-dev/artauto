const { app, BrowserWindow } = require('electron');
const path = require('path');

// Arka plan sunucumuzu çalıştırıyoruz
require('./server'); 

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "ART AUTO Kiralama Sistemi",
    icon: path.join(__dirname, 'icon.png'), // Eğer ikon eklersen buraya koyarsın
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // Menü çubuğunu gizle ki tam bir masaüstü uygulaması gibi görünsün
  mainWindow.setMenuBarVisibility(false);

  // Arka plandaki Express sunucusunu yüklüyoruz (port 3000)
  // Sunucunun ayağa kalkması için çok kısa bir süre bekleyelim
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 1000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
