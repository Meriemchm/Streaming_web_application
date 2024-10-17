import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; 
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = 3000;


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], 
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100000000 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /mp4|mkv|avi|mov/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non pris en charge !'));
    }
  }
});

// Routes 
app.post('/upload', upload.single('video'), (req, res) => {
  try {
    res.status(200).json({ message: 'Vidéo téléversée avec succès', file: req.file });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du téléversement de la vidéo', error });
  }
});


app.get('/getvideo', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la lecture du dossier', error: err });
    }
    const videoFiles = files.filter(file => file.endsWith('.mp4') || file.endsWith('.mkv') || file.endsWith('.avi') || file.endsWith('.mov'));
    console.log(videoFiles); 
    res.json(videoFiles); 
  });
});

app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
