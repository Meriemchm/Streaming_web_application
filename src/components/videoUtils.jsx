// videoUtils.js

export async function checkBandwidthWithFirstSegment(serverIp, videoId, setResolution) {
    const startTime = Date.now();
    const firstSegmentUrl = `http://${serverIp}:3000/uploads/segments/${videoId}/480p/segment_000.mp4`;
  
    try {
      const response = await fetch(firstSegmentUrl);
      if (!response.ok) throw new Error(`Error downloading: ${response.status}`);

      //taille du fichier
      const blob = await response.blob();
      console.log(blob)
      const duration = (Date.now() - startTime) / 1000;
      //convert to bit
      const bitsLoaded = blob.size * 8;

      //en bits par seconde
      //temps de téléchargement = taille du fichier / vitesse de téléchargement de la connexion
      const speed = bitsLoaded / duration;
      
      //5 Mbps
      if (speed > 5000000) {
        setResolution("1080p");
      } else if (speed > 3000000) {
        setResolution("720p");
      } else {
        setResolution("480p");
      }
    } catch (error) {
      console.error("Failed to check bandwidth with the first segment:", error);
    }
  }
  
// Charge segments vidéo en fon rsolution
export const loadVideoSegments = async (
  serverIp,
  videoId,
  resolution,
  setVideoSources,
  setCurrentSegmentIndex,
  calculateTotalDuration
) => {
  try {
    const response = await fetch(`http://${serverIp}:3000/segmentsList/${videoId}`);
    
    if (!response.ok) throw new Error("Error loading segment list");

    const segmentsList = await response.json();
    console.log(segmentsList)
    //loop to
    const segmentUrls = segmentsList.map((segment) =>
      `http://${serverIp}:3000/uploads/segments/${videoId}/${resolution}/${segment}`
    );
    console.log(segmentUrls)

    setVideoSources(segmentUrls);

    // currentindex
    setCurrentSegmentIndex((prevIndex) => 
      prevIndex < segmentUrls.length ? prevIndex : 0
    );

    calculateTotalDuration(segmentUrls);
  } catch (error) {
    console.error("Failed to load video segments:", error);
  }
};
  
  
  export const getVideoDuration = (url) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
    });
  };
  
export async function calculateTotalDuration(segments, setTotalDuration) {
  let total = 0;
  for (const segment of segments) {
    const segmentDuration = await getVideoDuration(segment);
    total += segmentDuration;
  }
  setTotalDuration(total);
}

//image

const generateThumbnailFromVideo = (videoUrl, time) => {
  const video = document.createElement("video");
  video.src = videoUrl;
  video.currentTime = time;
  video.crossOrigin = "anonymous";

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  return new Promise((resolve) => {
    video.onloadeddata = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL("image/png");
      resolve(thumbnailUrl);
    };
  });
};
export const generateThumbnails = (segments, setThumbnails) => {
  const thumbnailPromises = segments.map((segmentUrl, index) => {
    return generateThumbnailFromVideo(segmentUrl, 2)
      .then((thumbnailUrl) => {
        return { index, thumbnailUrl };
      });
  });

  Promise.all(thumbnailPromises).then((thumbnailsData) => {
    setThumbnails(thumbnailsData);  
  });
};



  