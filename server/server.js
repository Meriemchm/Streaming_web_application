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
import testRoute from "../server/test.js";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 3000;

// l'adresseip
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

console.log(getLocalIpAddress());

app.get("/get-ip", (req, res) => {
  console.log("Requête reçue pour obtenir l'IP");
  const ip = getLocalIpAddress();
  res.json({ ip });
});

const localIp = getLocalIpAddress();

const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Ensure proper permissions
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
    cb(null, "uploads/");
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
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) {
      cb(null, true);
    } else {
      cb(new Error("Format de fichier non pris en charge !"));
    }
  },
});

// Routes
app.post("/upload", upload.single("video"), (req, res) => {
  try {
    res
      .status(200)
      .json({ message: "Vidéo téléversée avec succès", file: req.file });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors du téléversement de la vidéo", error });
  }
});


app.get("/getvideo", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  fs.readdir("uploads", (err, files) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Erreur lors de la lecture du dossier", error: err });
    }
    const videoFiles = files
      .filter(
        (file) =>
          file.endsWith(".mp4") ||
          file.endsWith(".mkv") ||
          file.endsWith(".avi") ||
          file.endsWith(".mov")
      )
      .map(
        (file) =>
          `http://${localIp}:3000/uploads/${encodeURIComponent(file)}`
      );
    res.json(videoFiles);
  });
});
const segmentsDir = path.join(__dirname, "uploads", "segments");
if (!fs.existsSync(segmentsDir)) {
  fs.mkdirSync(segmentsDir, { recursive: true });
}

app.get("/test", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  fs.readdir(segmentsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: "Erreur lors de la lecture du dossier segments", error: err });
    }
    const videoFiles = files
      .filter(file => file.endsWith(".mp4") || file.endsWith(".mkv") || file.endsWith(".avi") || file.endsWith(".mov"))
      .map(file => `http://${localIp}:3000/uploads/segments/${encodeURIComponent(file)}`);
    res.json(videoFiles);
  });
});
// Adding the /test route
app.use("/test", testRoute);

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
  console.log(`Received request for: ${req.url}`);
  next();
});
