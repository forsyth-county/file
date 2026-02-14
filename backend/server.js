const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3001;

// Constants
const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB in bytes
const EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory storage for transfer data
const transfers = new Map();

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for now; restrict in production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_TOTAL_SIZE,
    files: MAX_FILES
  }
});

// Generate unique 6-digit code
function generateCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (transfers.has(code));
  return code;
}

// Clean up transfer files
function cleanupTransfer(code) {
  const transfer = transfers.get(code);
  if (!transfer) return;

  // Delete all files
  transfer.files.forEach(file => {
    const filePath = path.join(UPLOADS_DIR, file.storedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    }
  });

  // Remove from map
  transfers.delete(code);
  console.log(`Transfer ${code} cleaned up`);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload endpoint
app.post('/api/upload', upload.array('files', MAX_FILES), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (req.files.length > MAX_FILES) {
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(400).json({ error: `Maximum ${MAX_FILES} files allowed` });
    }

    // Check total size
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(400).json({ error: 'Total file size exceeds 200MB limit' });
    }

    // Generate unique code
    const code = generateCode();

    // Store transfer data
    const transferData = {
      code,
      files: req.files.map(file => ({
        id: uuidv4(),
        originalName: file.originalname,
        storedName: file.filename,
        size: file.size,
        mimetype: file.mimetype
      })),
      createdAt: Date.now(),
      expiresAt: Date.now() + EXPIRY_TIME
    };

    transfers.set(code, transferData);

    // Set up automatic cleanup after 10 minutes
    setTimeout(() => {
      cleanupTransfer(code);
    }, EXPIRY_TIME);

    console.log(`Transfer created: ${code}, ${req.files.length} files, expires at ${new Date(transferData.expiresAt).toISOString()}`);

    res.json({
      code,
      fileCount: req.files.length,
      totalSize,
      expiresAt: transferData.expiresAt
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get transfer info
app.get('/api/transfer/:code', (req, res) => {
  const { code } = req.params;
  const transfer = transfers.get(code);

  if (!transfer) {
    return res.status(404).json({ error: 'Invalid code. Please check and try again.' });
  }

  if (Date.now() > transfer.expiresAt) {
    cleanupTransfer(code);
    return res.status(410).json({ error: 'This transfer has expired. Files have been deleted.' });
  }

  res.json({
    code: transfer.code,
    files: transfer.files.map(f => ({
      id: f.id,
      name: f.originalName,
      size: f.size
    })),
    expiresAt: transfer.expiresAt,
    remainingTime: transfer.expiresAt - Date.now()
  });
});

// Download single file
app.get('/api/download/:code/:fileId', (req, res) => {
  const { code, fileId } = req.params;
  const transfer = transfers.get(code);

  if (!transfer) {
    return res.status(404).json({ error: 'Invalid code' });
  }

  if (Date.now() > transfer.expiresAt) {
    cleanupTransfer(code);
    return res.status(410).json({ error: 'Transfer expired' });
  }

  const file = transfer.files.find(f => f.id === fileId);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(UPLOADS_DIR, file.storedName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on server' });
  }

  res.download(filePath, file.originalName, (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    }
  });
});

// Download all files as ZIP
app.get('/api/download-all/:code', (req, res) => {
  const { code } = req.params;
  const transfer = transfers.get(code);

  if (!transfer) {
    return res.status(404).json({ error: 'Invalid code' });
  }

  if (Date.now() > transfer.expiresAt) {
    cleanupTransfer(code);
    return res.status(410).json({ error: 'Transfer expired' });
  }

  // Set response headers
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="transfer-${code}.zip"`);

  // Create ZIP archive
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  archive.on('error', (err) => {
    console.error('Archive error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Archive creation failed' });
    }
  });

  // Pipe archive to response
  archive.pipe(res);

  // Add all files to archive
  transfer.files.forEach(file => {
    const filePath = path.join(UPLOADS_DIR, file.storedName);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file.originalName });
    }
  });

  // Finalize archive
  archive.finalize();
});

app.listen(PORT, () => {
  console.log(`File sharing backend running on port ${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
  console.log(`Max files: ${MAX_FILES}, Max total size: ${MAX_TOTAL_SIZE / (1024 * 1024)}MB`);
});
