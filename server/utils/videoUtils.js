import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

export const segmentVideo = (
  filePath,
  baseSegmentFolder,
  startTime,
  endTime,
  resolutions,
  segmentDuration = 10 // Dure
) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`Fichier introuvable : ${filePath}`));
    }
    if (!resolutions || resolutions.length === 0) {
      return reject(new Error("Aucune résolution spécifiée."));
    }

    const resolutionMap = {
      "480p": "scale=854:480",
      "720p": "scale=1280:720",
      "1080p": "scale=1920:1080",
    };

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(new Error(`Erreur FFprobe : ${err.message}`));

      const videoDuration = metadata.format.duration;
      console.log(`Durée totale de la vidéo : ${videoDuration} secondes`);

      if (!startTime || startTime < 0) startTime = 0;
      if (!endTime || endTime > videoDuration) endTime = videoDuration;

      const promises = resolutions.map((label) => {
        return new Promise((res, rej) => {
          const segmentFolder = path.join(baseSegmentFolder, label);
          if (!fs.existsSync(segmentFolder)) {
            fs.mkdirSync(segmentFolder, { recursive: true });
          }

          const scaleFilter = resolutionMap[label] || "scale=1280:-2";

          ffmpeg(filePath)
            .setStartTime(startTime)
            .setDuration(endTime - startTime)
            .videoFilter(scaleFilter)
            .audioCodec("aac") // viter  erreurs
            .output(path.join(segmentFolder, "segment_%03d.mp4"))
            .outputOptions([
              "-preset",
              "ultrafast", 
              "-f",
              "segment",
              "-segment_time",
              segmentDuration.toString(),
              "-reset_timestamps",
              "1",
              "-g",
              (segmentDuration * 30).toString(), // Ajuster en fonction de 30 fps
              "-force_key_frames",
              `expr:gte(t,n_forced*${segmentDuration})`,
            ])
            .on("start", (commandLine) => {
              console.log("Commande FFmpeg : " + commandLine);
            })
            .on("progress", (progress) => {
              console.log(
                `Progression pour ${label} : ${(progress.percent || 0).toFixed(
                  2
                )}%`
              );
            })
            .on("end", () => {
              console.log(`Segmentation terminée pour ${label}.`);
              res(`Segmentation réussie pour ${label}`);
            })
            .on("error", (err, stdout, stderr) => {
              console.error("Erreur lors de la segmentation :", stderr);
              rej({ error: stderr, command: err });
            })
            .run();
        });
      });

      Promise.all(promises)
        .then((results) => resolve(results))
        .catch((error) => reject(error));
    });
  });
};
