import fs from "fs";
import path from "path";
import { exec } from "child_process";

export const segmentVideo = (filePath, baseSegmentFolder, startTime, endTime, resolutions, segmentDuration = 10) => {
  return new Promise((resolve, reject) => {
    const promises = resolutions.map((label) => {
      return new Promise((res, rej) => {
        const segmentFolder = path.join(baseSegmentFolder, label);
        if (!fs.existsSync(segmentFolder)) {
          fs.mkdirSync(segmentFolder, { recursive: true });
        }

        const timeFilter = startTime && endTime ? `-ss ${startTime} -to ${endTime}` : "";
        const command = `ffmpeg -i "${filePath}" ${timeFilter} -vf "scale=1280:-2" -c:a copy -map 0 -segment_time ${segmentDuration} -f segment "${segmentFolder}/segment_%03d.mp4"`;

        console.log(`Commande FFmpeg : ${command}`);

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Erreur FFmpeg : ${stderr}`);
            rej(error);
          } else {
            console.log("FFmpeg output:", stdout);
            res(`Segmentation réussie pour ${label}`);
          }
        });
      });
    });

    Promise.all(promises)
      .then((results) => resolve(results))
      .catch((error) => reject(error));
  });
};
