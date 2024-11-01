import fs from "fs";
import path from "path";
import { exec } from "child_process";

export const segmentVideo = (filePath, baseSegmentFolder, segmentDuration = 10) => {
  return new Promise((resolve, reject) => {
    const resolutions = [
      { label: '1080p', width: 1920, height: 1080 },
      { label: '720p', width: 1280, height: 720 },
      { label: '480p', width: 854, height: 480 },
    ];

    const promises = resolutions.map(({ label, width, height }) => {
      return new Promise((res, rej) => {
        const segmentFolder = path.join(baseSegmentFolder, label);
        if (!fs.existsSync(segmentFolder)) {
          fs.mkdirSync(segmentFolder, { recursive: true });
        }
        fs.chmodSync(segmentFolder, 0o755);

        const command = `ffmpeg -i "${filePath}" -vf "scale=${width}:${height}" -c:a copy -map 0 -segment_time ${segmentDuration} -f segment "${segmentFolder}\\segment_%03d.mp4"`;

        console.log(`Commande FFmpeg : ${command}`);
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Erreur lors de l'exécution de FFmpeg pour ${label}: `, error);
            console.error(`Erreur FFmpeg : ${stderr}`);
            rej(error);
          } else {
            console.log(`Sortie FFmpeg : ${stdout}`);
            console.log(`Segmentation réussie pour ${label}`);
            res(`Segmentation réussie pour ${label}`);
          }
        });
      });
    });

    Promise.all(promises)
      .then(results => resolve(results))
      .catch(error => reject(error));
  });
};
