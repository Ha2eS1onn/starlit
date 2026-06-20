const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json';
const output = path.join(__dirname, '..', 'public', 'celestial-lines.json');

console.log('Downloading d3-celestial lines...');
console.log('URL:', url);

const file = fs.createWriteStream(output);

https.get(url, (response) => {
  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    console.log('Redirect to:', response.headers.location);
    file.close();
    fs.unlinkSync(output);
    https.get(response.headers.location, (r2) => {
      r2.pipe(file);
      file.on('finish', () => {
        file.close();
        const sz = fs.statSync(output).size;
        console.log(`Downloaded ${(sz/1024).toFixed(1)} KB`);
      });
    });
    return;
  }
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    const sz = fs.statSync(output).size;
    console.log(`Downloaded ${(sz/1024).toFixed(1)} KB`);
  });
}).on('error', (e) => {
  console.error('Failed:', e.message);
  try { fs.unlinkSync(output); } catch (_) {}
});