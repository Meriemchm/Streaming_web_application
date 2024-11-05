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
  
  export async function loadVideoSegments(serverIp, videoId, resolution, setVideoSources, setCurrentSegmentIndex, calculateTotalDuration) {
    try {
      const response = await fetch(
        `http://${serverIp}:3000/segments?videoId=${videoId}&resolution=${resolution}`
      );
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
  
      const segments = await response.json();
      if (Array.isArray(segments)) {
        setVideoSources(segments);
        setCurrentSegmentIndex(0);
        calculateTotalDuration(segments);
      }
    } catch (error) {
      console.error("Failed to load video segments:", error);
    }
  }
  
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



  