// server/test.js

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mettre à jour le chemin vers le dossier uploads
const uploadsDir = path.join(__dirname, "..", "uploads");
const segmentsDir = path.join(uploadsDir, "segments");

// Assurez-vous que le répertoire 'segments' existe
if (!fs.existsSync(segmentsDir)) {
  fs.mkdirSync(segmentsDir, { recursive: true });
}
// Configuration de multer pour téléverser les fichiers vidéo
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

/**
 * Segmente une vidéo en plusieurs parties de durée fixe.
 * @param {string} filePath - Le chemin de la vidéo à segmenter.
 * @param {string} outputDir - Le répertoire où stocker les segments.
 * @param {number} segmentDuration - Durée de chaque segment en secondes (par défaut : 10 secondes).
 * @returns {Promise<string>} - Un message de succès ou une erreur.
 */
const segmentVideo = (filePath, outputDir, segmentDuration = 10) => {
  return new Promise((resolve, reject) => {
    // Vérifier si le répertoire de sortie existe, sinon le créer
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Commande FFmpeg pour segmenter la vidéo
    const command = `ffmpeg -i "${filePath}" -c copy -map 0 -segment_time ${segmentDuration} -f segment "${outputDir}/segment_%03d.mp4"`;

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

// Route POST pour téléverser et segmenter une vidéo
router.post("/", upload.single("video"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const outputDir = segmentsDir;

    // Appel de la fonction de segmentation
    await segmentVideo(filePath, outputDir);

    res.status(200).json({
      message: "Vidéo téléversée et segmentée avec succès via /test route",
      file: req.file,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors du téléversement ou de la segmentation de la vidéo",
      error,
    });
  }
});

export default router;
