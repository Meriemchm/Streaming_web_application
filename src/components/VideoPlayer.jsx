import React, { useState, useEffect, useRef } from "react";

function VideoPlayer({ videoId }) {
  const [resolution, setResolution] = useState("480p");
  const [videoSources, setVideoSources] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const videoPlayerRef = useRef(null);
  const serverIp = import.meta.env.VITE_SERVER_IP;

  const checkBandwidthWithFirstSegment = async (firstSegmentUrl) => {
    const startTime = Date.now();
    console.log(firstSegmentUrl);

    try {
      const response = await fetch(firstSegmentUrl);
      if (!response.ok)
        throw new Error(`Error downloading: ${response.status}`);

      const blob = await response.blob();
      const duration = (Date.now() - startTime) / 1000;
      const bitsLoaded = blob.size * 8;
      const speed = bitsLoaded / duration;

      if (speed > 5000000) {
        setResolution("1080p");
      } else if (speed > 3000000) {
        setResolution("720p");
      } else {
        setResolution("480p");
      }
      console.log("je suis la");
    } catch (error) {
      console.error("Failed to check bandwidth with the first segment:", error);
    }
  };

  // Load video segments
  async function loadVideoSegments() {
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
        checkBandwidthWithFirstSegment(segments[0]);
      }
    } catch (error) {
      console.error("Failed to load video segments:", error);
    }
  }

  // Get video duration
  const getVideoDuration = (url) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
    });
  };

  const calculateTotalDuration = async (segments) => {
    let total = 0;

    for (const segment of segments) {
      const segmentDuration = await getVideoDuration(segment);
      total += segmentDuration;
    }

    setTotalDuration(total);
  };

  useEffect(() => {
    loadVideoSegments();
  }, [resolution]);

  useEffect(() => {
    const loadSegment = async () => {
      if (videoPlayerRef.current && videoSources.length > 0) {
        const currentSegmentUrl = videoSources[currentSegmentIndex];
        videoPlayerRef.current.src = currentSegmentUrl;
      }
    };

    loadSegment();
  }, [currentSegmentIndex, videoSources]);

  const handleVideoEnd = () => {
    setCurrentSegmentIndex((prevIndex) => {
      // Vérif dernier segment est atteint
      if (prevIndex < videoSources.length - 1) {
        return prevIndex + 1; // prochain segment
      } else {
        return 0; // Retour premier segment
      }
    });
  };

  useEffect(() => {
    const videoPlayer = videoPlayerRef.current;

    if (videoPlayer) {
      videoPlayer.addEventListener("ended", handleVideoEnd);
    }

    return () => {
      if (videoPlayer) {
        videoPlayer.removeEventListener("ended", handleVideoEnd);
      }
    };
  }, [videoSources]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100">
      <video
        ref={videoPlayerRef}
        controls
        autoPlay
        className="w-full mb-4 rounded-lg shadow-lg"
      />

      <div className="text-center">
        <p className="text-lg font-semibold">
          Total Duration:{" "}
          <span className="font-normal">
            {totalDuration.toFixed(2)} seconds
          </span>
        </p>
        <p className="text-lg font-semibold">
          Resolution: <span className="font-normal">{resolution}</span>
        </p>
        <p className="text-lg font-semibold">
          Current Segment:{" "}
          <span className="font-normal">
            {currentSegmentIndex + 1} of {videoSources.length}
          </span>
        </p>
      </div>
    </div>
  );
}

export default VideoPlayer;
