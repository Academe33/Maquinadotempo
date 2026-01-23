
const fs = require('fs');
const https = require('https');
const { URL } = require('url');

const content = fs.readFileSync('./constants.tsx', 'utf8');
const regex = /image:\s*['"]([^'"]+)['"]/g;
let match;
const urls = [];

while ((match = regex.exec(content)) !== null) {
  urls.push(match[1]);
}

console.log(`Found ${urls.length} images.`);

const checkImage = (url) => {
  return new Promise((resolve) => {
    if (!url.startsWith('http')) {
        resolve({ url, status: 'skipped' });
        return;
    }
    try {
      const options = new URL(url);
      const req = https.request(options, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        resolve({ url, status: res.statusCode });
      });
      req.on('error', (e) => resolve({ url, status: 'error: ' + e.message }));
      req.setTimeout(5000, () => {
          req.destroy();
          resolve({ url, status: 'timeout' });
      });
      req.end();
    } catch (e) {
      resolve({ url, status: 'invalid' });
    }
  });
};

const run = async () => {
  const results = await Promise.all(urls.map(u => checkImage(u)));
  const failed = results.filter(r => r.status !== 200 && r.status !== 'skipped');
  
  if (failed.length === 0) {
    console.log('All images are valid!');
  } else {
    console.log('Failed images:');
    failed.forEach(f => console.log(`${f.status} - ${f.url}`));
  }
};

run();
