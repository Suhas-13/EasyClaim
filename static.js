const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000; // Set your preferred port here
const folderPath = path.join(__dirname, 'public'); // Replace 'public' with your folder name

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(folderPath, req.url === '/' ? 'index.html' : req.url);

  // Prevent directory traversal attacks
  if (!filePath.startsWith(folderPath)) {
    res.writeHead(403);
    res.end('Access forbidden');
    return;
  }

  // Check if the requested file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }

    // Set MIME type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });

    // Serve the file
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
