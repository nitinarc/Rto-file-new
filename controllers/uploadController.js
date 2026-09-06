import PDF from '../models/PDF.js';
import { splitPDF } from '../services/pdfSplit.js';
import { mergeSelected } from '../services/pdfMerge.js';
import { createZip, cleanup } from '../services/zipCleanup.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Upload + Split + Merge
export const uploadAndProcess = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // ✅ Auto Folder Name (बिना User Input के)
    const folderName = 'document_' + Date.now();
    const filePath = req.file.path;
    const { folders, totalPages, baseFolder } = await splitPDF(filePath, req.file.originalname, folderName);

    // ✅ Merge 20-1, 20-2, 20-3 → Form20.pdf
    for (let idx = 0; idx < folders.length; idx++) {
      const folder = folders[idx];
      const files = folder.files;
      const toMerge = ['20-1.pdf', '20-2.pdf', '20-3.pdf'].filter(f => files.includes(f));
      if (toMerge.length === 3) {
        await mergeSelected(folder.folderPath, toMerge, 'Form20.pdf');
      }
    }

    // ✅ Merge stamp-1, stamp-2 → stamp.pdf
    for (let idx = 0; idx < folders.length; idx++) {
      const folder = folders[idx];
      const files = folder.files;
      const stampFiles = ['stamp-1.pdf', 'stamp-2.pdf'].filter(f => files.includes(f));
      if (stampFiles.length === 2) {
        await mergeSelected(folder.folderPath, stampFiles, 'stamp.pdf');
      }
    }

    // ✅ Store in Session for Rename
    req.session.folders = folders.map(f => ({
      oldName: f.folderName,
      newName: f.folderName,
      folderPath: f.folderPath,
      files: f.files
    }));
    req.session.baseFolder = baseFolder;

    res.redirect('/rename');
  } catch (err) {
    console.error('❌ Upload Error:', err);
    res.status(500).send('Error: ' + err.message);
  }
};

// ✅ Render Rename Page
export const renderRenamePage = (req, res) => {
  const folders = req.session.folders || [];
  if (folders.length === 0) {
    return res.redirect('/');
  }
  res.render('rename', { folders });
};

// ✅ Rename Folders
export const renameFolders = (req, res) => {
  try {
    const newNames = req.body.folders; // Array of new names
    const folders = req.session.folders || [];

    for (let i = 0; i < folders.length; i++) {
      const oldPath = folders[i].folderPath;
      const parentDir = path.dirname(oldPath);
      const newPath = path.join(parentDir, newNames[i]);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        folders[i].newName = newNames[i];
        folders[i].folderPath = newPath;
      }
    }

    req.session.folders = folders;
    res.redirect(`/result/${Date.now()}`);
  } catch (err) {
    console.error('❌ Rename Error:', err);
    res.status(500).send('Error: ' + err.message);
  }
};

// ✅ Result Page
export const getResult = async (req, res) => {
  try {
    const folders = req.session.folders || [];
    const baseFolder = req.session.baseFolder || '';
    res.render('result', { folders, baseFolder });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

// ✅ Download ZIP
export const downloadZip = async (req, res) => {
  try {
    const baseFolder = req.session.baseFolder;
    if (!baseFolder) {
      return res.status(404).send('No folder found.');
    }

    const folderName = baseFolder.split('/').pop();
    const zipName = `${folderName}.zip`;
    const zipPath = path.join('uploads', zipName);

    await createZip(baseFolder, zipPath);

    res.download(zipPath, zipName, async () => {
      try {
        // ✅ पूरा uploads/ folder clean करो
        const uploadsDir = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadsDir)) {
          fs.rmSync(uploadsDir, { recursive: true, force: true });
          fs.mkdirSync(uploadsDir, { recursive: true });
          console.log('🧹 Entire uploads/ folder cleaned.');
        }

        // ✅ Session Destroy
        req.session.destroy((err) => {
          if (err) console.error('Session destroy error:', err);
        });

      } catch (err) {
        console.error('❌ Cleanup Error:', err);
      }
    });
  } catch (err) {
    console.error('❌ Download Error:', err);
    res.status(500).send('Download error: ' + err.message);
  }
};

// ✅ Preview Bill
export const previewBill = async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const folders = req.session.folders || [];

    if (index < 0 || index >= folders.length) {
      return res.status(404).send('Folder not found');
    }

    const folder = folders[index];
    const folderPath = folder.folderPath;
    const absolutePath = path.resolve(folderPath, 'bill.pdf');

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).send('bill.pdf not found in this folder.');
    }

    res.sendFile(absolutePath);
  } catch (err) {
    console.error('❌ Preview Bill Error:', err);
    res.status(500).send('Error: ' + err.message);
  }
};