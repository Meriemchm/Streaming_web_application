import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { getLocalIpAddress } from "./utils/ipUtils.js";
import { createDirectories, writeToEnvFile } from "./utils/fileUtils.js";
import { segmentVideo } from "./utils/videoUtils.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 3000;

const uploadsDir = path.join(__dirname, "uploads");
const segmentsDir = path.join(uploadsDir, "segments");

createDirectories(uploadsDir, segmentsDir);
app.use(cors());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
/*--------------------------ip-------------------------- */

const localIp = getLocalIpAddress();
console.log(localIp);

app.get("/get-ip", (req, res) => {
  console.log("Requête reçue pour obtenir l'IP");
  const ip = getLocalIpAddress();
  res.json({ ip });
});

/*-------------------------------video files proprieties--------------------------- */

fs.chmodSync(uploadsDir, 0o755);

app.use("/uploads", express.static("uploads"));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = file.originalname
      .replace(/[^a-zA-Z0-9-_\.]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "");
    cb(null, `${uniqueSuffix}-${sanitizedFileName}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /mp4|mkv|avi|mov/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) cb(null, true);
    else cb(new Error("Format de fichier non pris en charge !"));
  },
});


const generateSegmentListFile = (videoId) => {
  // Chemin du dossier où les segments sont stockés
  const videoFolder = path.join(__dirname, 'uploads', 'segments', videoId);
  
  // Les différentes résolutions que tu pourrais avoir
  const resolutions = ['480p', '720p', '1080p'];

  let segmentList = new Set();  // Use a Set to automatically remove duplicates

  // Lire les segments dans chaque dossier de résolution
  resolutions.forEach((resolution) => {
    const resolutionPath = path.join(videoFolder, resolution);

    if (fs.existsSync(resolutionPath)) {
      const files = fs.readdirSync(resolutionPath);
      
      // Filtrer uniquement les fichiers .mp4 et les ajouter à la liste (Set)
      files
        .filter((file) => file.endsWith('.mp4'))
        .forEach((file) => segmentList.add(file)); // Add to Set, duplicates are ignored
    }
  });

  // Convert Set to array and join the segments
  const fileContent = Array.from(segmentList).join('\n');

  // Chemin du fichier texte à générer
  const outputPath = path.join(videoFolder, 'segments_list.txt');

  // Écrire le contenu dans le fichier texte
  fs.writeFileSync(outputPath, fileContent, 'utf8');

  console.log(`Fichier texte généré : ${outputPath}`);
};

/*-------------------------------post and get routes--------------------------- */

app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const videoName = path.basename(filePath, path.extname(filePath));
    const segmentFolder = path.join(segmentsDir, videoName);

    const { startTime, endTime } = req.body;
    const resolutions = JSON.parse(req.body.resolutions || "[]");

    console.log("Chemin de la vidéo :", filePath);
    console.log("Résolutions choisies :", resolutions);

    if (!fs.existsSync(segmentFolder))
      fs.mkdirSync(segmentFolder, { recursive: true });

    // Segmenter la vidéo
    await segmentVideo(filePath, segmentFolder, startTime, endTime, resolutions);

    // Générer la liste des segments après la segmentation
    generateSegmentListFile(videoName);

    res.status(200).json({
      message: "Vidéo téléversée et segmentée avec succès",
      file: req.file,
    });
  } catch (error) {
    console.error("Erreur sur le serveur :", error);
    res.status(500).json({
      message: "Erreur lors du téléversement ou de la segmentation de la vidéo",
      error: error.message,
    });
  }
});



app.get("/getvideo", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la lecture du dossier",
        error: err,
      });
    }

    const videoFiles = files
      .filter((file) =>
        [".mp4", ".mkv", ".avi", ".mov"].some((ext) => file.endsWith(ext))
      )
      .map(
        (file) => `http://${localIp}:3000/uploads/${encodeURIComponent(file)}`
      );

    res.json(videoFiles);
  });
});

app.get("/segmentsFolder", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  fs.readdir(uploadsDir, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la lecture du dossier",
        error: err,
      });
    }

    const folderContents = {};
    files.forEach((file) => {
      if (file.isDirectory()) {
        const folderPath = path.join(uploadsDir, file.name);
        console.log(file.name); 

        const folderFiles = fs.readdirSync(folderPath).map((segmentFile) => {
          console.log(segmentFile); 
          return `http://${localIp}:3000/uploads/segments/${encodeURIComponent(segmentFile)}`;
        });

        folderContents[file.name] = folderFiles;
      }
    });

    res.json(folderContents);
  });
});

app.get("/segments", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  const videoId = req.query.videoId; // ID de la vidéo
  const resolution = req.query.resolution; // Résolution demandée

  const resolutionDir = path.join(segmentsDir, videoId, resolution); // Dossier de la résolution pour cette vidéo

  fs.readdir(resolutionDir, (err, files) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la lecture des segments",
        error: err,
      });
    }
    console.log(files);
    const segmentFiles = files
      .filter((file) => file.endsWith(".mp4")) // Filtre les fichiers vidéo
      .map(
        (file) =>
          `http://${localIp}:3000/uploads/segments/${videoId}/${resolution}/${encodeURIComponent(
            file
          )}`
      );

    res.json(segmentFiles); // Renvoie les URLs des segments
  });
});


// Nouvelle route pour obtenir les résolutions disponibles
app.get("/video/resolutions/:videoId", (req, res) => {
  const { videoId } = req.params;
  const videoPath = path.join(segmentsDir, videoId);

  // Vérifie si le dossier existe
  if (fs.existsSync(videoPath)) {
    // Lis les sous-dossiers (résolutions)
    const availableResolutions = fs
      .readdirSync(videoPath)
      .filter((folder) => fs.lstatSync(path.join(videoPath, folder)).isDirectory());
    res.status(200).json({ resolutions: availableResolutions });
  } else {
    res.status(404).json({ error: "Video not found" });
  }
});

app.get("/segmentsList/:videoId", (req, res) => {
  const videoId = req.params.videoId;
  const videoFolder = path.join(__dirname, 'uploads', 'segments', videoId);
  const filePath = path.join(videoFolder, 'segments_list.txt');

  if (fs.existsSync(filePath)) {
    const segmentsList = fs.readFileSync(filePath, 'utf8').split('\n');
    res.json(segmentsList);
  } else {
    res.status(404).json({ error: 'Segment list file not found' });
  }
});



/*server start------------------------------------------------------------- */

app.listen(PORT, "0.0.0.0", () => {
  writeToEnvFile(localIp, __dirname);
  console.log(`Server running on http://${localIp}:${PORT}`);
});

app.use((req, res, next) => {
  console.log(`Requête reçue pour : ${req.url}`);
  next();
});
