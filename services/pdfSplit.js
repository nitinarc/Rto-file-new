import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export const splitPDF = async (filePath, originalName, folderName) => {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(filePath));
  const totalPages = pdfDoc.getPageCount();

  const baseFolder = `uploads/${folderName}_${Date.now()}`;
  fs.mkdirSync(baseFolder, { recursive: true });

  const folders = [];
  let folderIndex = 1;
  let pageCounter = 0;

  const pageNames = [
    'bill.pdf',
    '21.pdf',
    '20-1.pdf',
    '20-2.pdf',
    '20-3.pdf',
    'id.pdf',
    'insurance.pdf',
    'form22.pdf',
    'helmet.pdf',
    'stamp-1.pdf',
    'stamp-2.pdf'
  ];

  while (pageCounter < totalPages) {
    const folderName = `folder_${folderIndex}`;
    const folderPath = path.join(baseFolder, folderName);
    fs.mkdirSync(folderPath, { recursive: true });

    const filesInFolder = [];
    for (let i = 0; i < 11 && pageCounter < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [page] = await newDoc.copyPages(pdfDoc, [pageCounter]);
      newDoc.addPage(page);
      const pdfBytes = await newDoc.save();

      const fileName = pageNames[i] || `page_${pageCounter + 1}.pdf`;
      fs.writeFileSync(path.join(folderPath, fileName), pdfBytes);
      filesInFolder.push(fileName);
      pageCounter++;
    }

    folders.push({
      folderName,
      folderPath,
      files: filesInFolder
    });
    folderIndex++;
  }

  return { folders, totalPages, baseFolder };
};