import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRoutes from './routes/uploadRoutes.js';
import session from 'express-session';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ✅ Session (for storing folder names)
app.use(session({
  secret: 'pdf-secret-key',
  resave: false,
  saveUninitialized: true
}));

// ✅ EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

// ✅ Routes
app.use('/', uploadRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server on http://localhost:${PORT}`);
});