import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import os from 'os';


const app = express();
const PORT = 3000;

// Fonction pour obtenir l'adresse IP locale
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address; // Renvoie l'adresse IP locale
      }
    }
  }
  return '127.0.0.1'; // Par défaut si aucune adresse n'est trouvée
};

app.get('/get-ip', (req, res) => {
  console.log('Requête reçue pour obtenir l\'IP');
  const ip = getLocalIpAddress();
  res.json({ ip }); // Envoie l'adresse IP au frontend
});

const localIp = getLocalIpAddress();

const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Ensure proper permissions
fs.chmodSync(uploadsDir, 0o755);


app.use('/uploads', express.static('uploads')); //Rends les vidéos téléversés accessible depuis l'URL

//définition des en-tetes HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  crossOriginResourcePolicy: false
}));

app.use(cors()); //permet aux ressources d'être accessibles depuis d'autres domaines.


//Où uploder les fichiers et comment les nommer 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${encodeURIComponent(file.originalname)}`);
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

  res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); // Méthodes autorisées
  fs.readdir('uploads', (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la lecture du dossier', error: err });
    }
    const videoFiles = files.filter(file => file.endsWith('.mp4') || file.endsWith('.mkv') || file.endsWith('.avi') || file.endsWith('.mov'))
      .map(file => `http://${localIp}:3000/uploads/${encodeURIComponent(file)}`);
    res.json(videoFiles);
  });
});




app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://${localIp}:${PORT}`);
});

app.use((req, res, next) => {
  console.log(`Received request for: ${req.url}`);
  next();
});


