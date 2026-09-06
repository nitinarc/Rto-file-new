import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: String,
  files: [String]
});

const pdfSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  baseFolder: { type: String, required: true },
  folders: [folderSchema],
  zipFile: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PDF', pdfSchema);