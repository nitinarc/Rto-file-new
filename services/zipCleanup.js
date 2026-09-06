import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

export const createZip = (sourceDir, zipPath) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
};

export const cleanup = (paths) => {
  for (const p of paths) {
    if (fs.existsSync(p)) {
      // ✅ अगर temp folder है — तो उसके अंदर की files delete करो
      if (p.includes('temp')) {
        const files = fs.readdirSync(p);
        for (const file of files) {
          const filePath = path.join(p, file);
          fs.rmSync(filePath, { force: true });
          console.log(`🧹 Deleted temp file: ${file}`);
        }
        console.log(`🧹 Temp folder cleaned (folder kept).`);
      } else {
        // ✅ बाकी folders पूरे delete
        fs.rmSync(p, { recursive: true, force: true });
        console.log(`🧹 Deleted: ${p}`);
      }
    }
  }
};