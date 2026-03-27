const fs = require('fs');
const path = require('path');

// Konfiguracja
const outputFileName = 'CALY_KOD_BOTA.txt';
const foldersToScan = ['src']; // Skanujemy folder src
const ignoredFiles = ['node_modules', '.env', 'package-lock.json', '.git', 'zrzut_kodu.js'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (!ignoredFiles.includes(file)) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (!ignoredFiles.includes(file) && (file.endsWith('.js') || file.endsWith('.json'))) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(__dirname, []);
let outputContent = `--- ZRZUT KODU BOTA ---\nData: ${new Date().toLocaleString()}\n\n`;

allFiles.forEach(file => {
    // Ignorujemy ten skrypt i pliki systemowe
    if (file.includes('zrzut_kodu.js')) return;

    const relativePath = path.relative(__dirname, file);
    const content = fs.readFileSync(file, 'utf8');

    outputContent += `\n==================================================\n`;
    outputContent += `PLIK: ${relativePath}\n`;
    outputContent += `==================================================\n`;
    outputContent += content + `\n`;
});

fs.writeFileSync(outputFileName, outputContent);
console.log(`✅ Gotowe! Cały kod został zapisany w pliku: ${outputFileName}`);
console.log(`👉 Wyślij ten plik (lub jego treść) do AI.`);