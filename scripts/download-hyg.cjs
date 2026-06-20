const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv';
const output = path.join(__dirname, '..', 'public', 'hygdata_v3.csv');

console.log('Downloading HYG 4.1 dataset...');
console.log('URL:', url);
console.log('Output:', output);

const file = fs.createWriteStream(output);

https.get(url, (response) => {
  // 处理重定向
  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    console.log('Redirecting to:', response.headers.location);
    file.close();
    fs.unlinkSync(output);
    https.get(response.headers.location, (r2) => {
      r2.pipe(file);
      file.on('finish', () => {
        file.close();
        const size = fs.statSync(output).size;
        console.log(`Download complete! File size: ${(size / 1024 / 1024).toFixed(2)} MB`);
      });
    });
    return;
  }

  const totalSize = parseInt(response.headers['content-length'] || '0', 10);
  let downloaded = 0;

  response.on('data', (chunk) => {
    downloaded += chunk.length;
    if (totalSize > 0) {
      const pct = ((downloaded / totalSize) * 100).toFixed(1);
      process.stdout.write(`\rDownloading... ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} MB / ${(totalSize / 1024 / 1024).toFixed(1)} MB)`);
    }
  });

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    const size = fs.statSync(output).size;
    console.log(`\nDownload complete! File size: ${(size / 1024 / 1024).toFixed(2)} MB`);
  });
}).on('error', (err) => {
  console.error('Download failed:', err.message);
  try { fs.unlinkSync(output); } catch (e) {}
});