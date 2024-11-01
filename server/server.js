import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import os from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import { exec } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 3000;

const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  let ipAddress = null;

  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName].forEach((iface) => {
      if (!iface.internal && iface.family === "IPv4") {
        ipAddress = iface.address;
      }
    });
  });

  return ipAddress;
};

const localIp = getLocalIpAddress();
console.log(localIp);

app.get("/get-ip", (req, res) => {
  console.log("Requête reçue pour obtenir l'IP");
  const ip = getLocalIpAddress();
  res.json({ ip });
});

const uploadsDir = path.join(__dirname, "uploads");
const segmentsDir = path.join(uploadsDir, "segments");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(segmentsDir)) fs.mkdirSync(segmentsDir, { recursive: true });

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
    cb(null, `${uniqueSuffix}-${encodeURIComponent(file.originalname)}`);
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

const segmentVideo = (filePath, segmentFolder, segmentDuration = 10) => {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${filePath}" -c copy -map 0 -segment_time ${segmentDuration} -f segment "${segmentFolder}/segment_%03d.mp4"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors de l'exécution de FFmpeg : ${error}`);
        reject(error);
      } else {
        console.log(`Segmentation terminée : ${stdout}`);
        resolve("Segmentation réussie !");
      }
    });
  });
};

app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const videoName = path.basename(filePath, path.extname(filePath));
    const segmentFolder = path.join(segmentsDir, videoName);

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

const writeToEnvFile = (ip) => {
  const envFilePath = path.join(__dirname, "..", ".env");
  const content = `VITE_SERVER_IP="${ip}"\n`;

  fs.writeFile(envFilePath, content, (err) => {
    if (err) {
      console.error("Erreur lors de l'écriture dans le fichier .env :", err);
    } else {
      console.log(`Adresse IP ${ip} écrite dans le fichier .env`);
    }
  });
};

app.listen(PORT, "0.0.0.0", () => {
  writeToEnvFile(localIp);
  console.log(`Server running on http://${localIp}:${PORT}`);
});

app.use((req, res, next) => {
  console.log(`Requête reçue pour : ${req.url}`);
  next();
});
