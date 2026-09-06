import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export const mergeSelected = async (folderPath, files, outputName) => {
  const mergedDoc = await PDFDocument.create();
  let mergedCount = 0;

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    if (!fs.existsSync(filePath)) continue;

    const pdf = await PDFDocument.load(fs.readFileSync(filePath));
    const pages = await mergedDoc.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedDoc.addPage(page));
    mergedCount++;
  }

  if (mergedCount === 0) return null;

  const pdfBytes = await mergedDoc.save();
  const outputPath = path.join(folderPath, outputName);
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
};