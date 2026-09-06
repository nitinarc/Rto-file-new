import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadAndProcess, getResult, downloadZip, renameFolders, renderRenamePage, previewBill } from '../controllers/uploadController.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join('uploads', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// ✅ Routes
router.get('/', (req, res) => {
  res.render('index');
});

router.post('/upload', (req, res, next) => {
  const folderName = req.body.folderName || 'default_folder';
  req.folderName = folderName;
  next();
}, upload.single('pdfFile'), uploadAndProcess);

router.get('/rename', renderRenamePage);
router.post('/rename', renameFolders);

// ✅ Preview Bill Route
router.get('/preview-bill/:index', previewBill);

router.get('/result/:id', getResult);
router.get('/download/:id', downloadZip);

// ✅ Manual Cleanup Route
router.get('/cleanup', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const tempDir = path.join(uploadsDir, 'temp');

    // ✅ Clean temp folder
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // ✅ Delete all other folders inside uploads (except temp)
    const items = fs.readdirSync(uploadsDir);
    for (const item of items) {
      const itemPath = path.join(uploadsDir, item);
      if (item !== 'temp' && fs.statSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`🧹 Deleted folder: ${item}`);
      }
    }

    res.send('✅ Cleanup completed successfully.');
  } catch (err) {
    console.error('❌ Cleanup Error:', err);
    res.status(500).send('Error: ' + err.message);
  }
});

export default router;