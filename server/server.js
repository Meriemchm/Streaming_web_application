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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: false,
  })
);
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = file.originalname
      .replace(/[^a-zA-Z0-9-_\.]/g, '-') 
      .replace(/--+/g, '-') 
      .replace(/^-|-$/g, ''); 
    cb(null, `${uniqueSuffix}-${sanitizedFileName}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /mp4|mkv|avi|mov/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) cb(null, true);
    else cb(new Error("Format de fichier non pris en charge !"));
  },
});

/*-------------------------------post and get routes--------------------------- */

app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const videoName = path.basename(filePath, path.extname(filePath));
    const segmentFolder = path.join(segmentsDir, videoName);

    console.log("Chemin de la vidéo :", filePath);
    console.log("Dossier de destination des segments :", segmentFolder);
    if (!fs.existsSync(segmentFolder)) fs.mkdirSync(segmentFolder, { recursive: true });

    await segmentVideo(filePath, segmentFolder);

    res.status(200).json({
      message: "Vidéo téléversée et segmentée avec succès",
      file: req.file,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors du téléversement ou de la segmentation de la vidéo",
      error,
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
      .map((file) => `http://${localIp}:3000/uploads/${encodeURIComponent(file)}`);

    res.json(videoFiles);
  });
});

app.get("/segments", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  fs.readdir(segmentsDir, (err, folders) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la lecture du dossier segments",
        error: err,
      });
    }

    const segmentFiles = folders.flatMap((folder) => {
      const folderPath = path.join(segmentsDir, folder);
      if (fs.lstatSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        return files
          .filter((file) => [".mp4", ".mkv", ".avi", ".mov"].some((ext) => file.endsWith(ext)))
          .map((file) => `http://${localIp}:3000/uploads/segments/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`);
      }
      return [];
    });


    res.json(segmentFiles);
  });
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
